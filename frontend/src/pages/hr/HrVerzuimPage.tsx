import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useSchoolContext } from '../../context/SchoolContext';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { hrScoreColor } from '../../components/HrRisicoBadge';
import { Building2, Save, HeartPulse } from 'lucide-react';
import type { VerzuimData, CreateVerzuimRequest } from '@schoollaider/shared';

function generatePeriodes(): string[] {
  const now = new Date();
  const periodes: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periodes.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return periodes;
}

const emptyForm: CreateVerzuimRequest = {
  periode: '',
  verzuimPct: 0,
  kortVerzuimPct: 0,
  langVerzuimPct: 0,
  ziekteVervangingsDagen: 0,
};

export function HrVerzuimPage() {
  const { selectedSchoolId } = useSchoolContext();
  const periodes = generatePeriodes();
  const [selectedPeriode, setSelectedPeriode] = useState(periodes[0]);
  const [history, setHistory] = useState<VerzuimData[]>([]);
  const [form, setForm] = useState<CreateVerzuimRequest>({ ...emptyForm, periode: periodes[0] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (selectedSchoolId) fetchData();
  }, [selectedSchoolId]);

  useEffect(() => {
    // Pre-fill form from history if period exists
    const existing = history.find((h) => h.periode === selectedPeriode);
    if (existing) {
      setForm({
        periode: existing.periode,
        verzuimPct: existing.verzuimPct,
        kortVerzuimPct: existing.kortVerzuimPct,
        langVerzuimPct: existing.langVerzuimPct,
        ziekteVervangingsDagen: existing.ziekteVervangingsDagen,
      });
    } else {
      setForm({ ...emptyForm, periode: selectedPeriode });
    }
  }, [selectedPeriode, history]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get(`/hr/school/${selectedSchoolId}/verzuim?limit=12`);
      setHistory(res.data);
    } catch (err: any) {
      console.error('[HrVerzuim] Ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedSchoolId) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.put(`/hr/school/${selectedSchoolId}/verzuim`, form);
      await fetchData();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error('[HrVerzuim] Opslaan mislukt:', err?.message);
    } finally {
      setSaving(false);
    }
  }

  if (!selectedSchoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="mb-4 h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-900">Geen school geselecteerd</p>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  const latest = history[0];
  const kpis = [
    { label: 'Actueel verzuim', value: latest ? `${latest.verzuimPct.toFixed(1)}%` : '-', color: latest && latest.verzuimPct > 5.5 ? 'text-red-700' : 'text-emerald-700' },
    { label: 'Kort verzuim', value: latest ? `${latest.kortVerzuimPct.toFixed(1)}%` : '-', color: 'text-gray-700' },
    { label: 'Lang verzuim', value: latest ? `${latest.langVerzuimPct.toFixed(1)}%` : '-', color: latest && latest.langVerzuimPct > 3 ? 'text-red-700' : 'text-gray-700' },
    { label: 'Belastbaarheidsindex', value: latest ? latest.belastbaarheidsIndex.toString() : '-', color: latest ? hrScoreColor(latest.belastbaarheidsIndex).text : 'text-gray-400' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <HeartPulse className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Verzuim & Belastbaarheid</h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Verzuimgegevens invoeren</h2>
          <select
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="input w-40"
          >
            {periodes.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Verzuim %</label>
            <input type="number" step={0.1} value={form.verzuimPct} onChange={(e) => setForm({ ...form, verzuimPct: parseFloat(e.target.value) || 0 })} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Kort verzuim %</label>
            <input type="number" step={0.1} value={form.kortVerzuimPct} onChange={(e) => setForm({ ...form, kortVerzuimPct: parseFloat(e.target.value) || 0 })} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Lang verzuim %</label>
            <input type="number" step={0.1} value={form.langVerzuimPct} onChange={(e) => setForm({ ...form, langVerzuimPct: parseFloat(e.target.value) || 0 })} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Ziektevervangingsdagen</label>
            <input type="number" step={1} value={form.ziekteVervangingsDagen} onChange={(e) => setForm({ ...form, ziekteVervangingsDagen: parseInt(e.target.value) || 0 })} className="input w-full" />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
          {saved && <span className="text-sm text-emerald-600">Opgeslagen!</span>}
        </div>
      </div>

      {/* History table */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Verzuimtrend (laatste 12 maanden)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 font-medium text-gray-500">Periode</th>
                <th className="px-4 py-3 font-medium text-gray-500">Verzuim %</th>
                <th className="px-4 py-3 font-medium text-gray-500">Kort %</th>
                <th className="px-4 py-3 font-medium text-gray-500">Lang %</th>
                <th className="px-4 py-3 font-medium text-gray-500">Verv.dagen</th>
                <th className="px-4 py-3 font-medium text-gray-500">Belastb.index</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nog geen data.</td></tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">{h.periode}</td>
                    <td className={`px-4 py-3 ${h.verzuimPct > 5.5 ? 'font-semibold text-red-700' : 'text-gray-600'}`}>{h.verzuimPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-600">{h.kortVerzuimPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-600">{h.langVerzuimPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-600">{h.ziekteVervangingsDagen}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${hrScoreColor(h.belastbaarheidsIndex).text}`}>
                        {h.belastbaarheidsIndex}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
