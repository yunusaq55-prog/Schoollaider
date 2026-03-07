import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useSchoolContext } from '../../context/SchoolContext';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { hrScoreColor } from '../../components/HrRisicoBadge';
import { Building2, Save, ArrowLeftRight } from 'lucide-react';
import type { VervangingsData, CreateVervangingsRequest } from '@schoollaider/shared';

function generateSchoolYears(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 7 ? currentYear : currentYear - 1;
  return [
    `${startYear}-${startYear + 1}`,
    `${startYear - 1}-${startYear}`,
    `${startYear - 2}-${startYear - 1}`,
  ];
}

const emptyForm: CreateVervangingsRequest = {
  schooljaar: '',
  totaalVervangingsDagen: 0,
  nietVervuldeDagen: 0,
  kostenVervanging: 0,
  totaalFte: 0,
};

export function HrVervangingPage() {
  const { selectedSchoolId } = useSchoolContext();
  const schoolYears = generateSchoolYears();
  const [schooljaar, setSchooljaar] = useState(schoolYears[0]);
  const [data, setData] = useState<VervangingsData | null>(null);
  const [form, setForm] = useState<CreateVervangingsRequest>({ ...emptyForm, schooljaar: schoolYears[0] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (selectedSchoolId) fetchData();
  }, [selectedSchoolId, schooljaar]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get(`/hr/school/${selectedSchoolId}/vervanging?schooljaar=${schooljaar}`);
      const d: VervangingsData | null = res.data;
      setData(d);
      if (d) {
        setForm({
          schooljaar: d.schooljaar,
          totaalVervangingsDagen: d.totaalVervangingsDagen,
          nietVervuldeDagen: d.nietVervuldeDagen,
          kostenVervanging: d.kostenVervanging,
          totaalFte: d.totaalFte,
        });
      } else {
        setForm({ ...emptyForm, schooljaar });
      }
    } catch (err: any) {
      console.error('[HrVervanging] Ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedSchoolId) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put(`/hr/school/${selectedSchoolId}/vervanging`, form);
      setData(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error('[HrVervanging] Opslaan mislukt:', err?.message);
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

  const kostenPerFte = data && data.totaalFte > 0
    ? Math.round(data.kostenVervanging / data.totaalFte)
    : 0;
  const lesuitvalPct = data && data.totaalVervangingsDagen > 0
    ? Math.round((data.nietVervuldeDagen / data.totaalVervangingsDagen) * 100)
    : 0;

  const kpis = [
    { label: 'Vervangingsindex', value: data?.vervangingsIndex?.toString() ?? '-', color: data ? hrScoreColor(data.vervangingsIndex).text : 'text-gray-400' },
    { label: 'Kosten per FTE', value: kostenPerFte > 0 ? `\u20AC ${kostenPerFte.toLocaleString('nl-NL')}` : '-', color: 'text-gray-700' },
    { label: 'Lesuitval %', value: lesuitvalPct > 0 ? `${lesuitvalPct}%` : '-', color: lesuitvalPct > 10 ? 'text-red-700' : 'text-gray-700' },
    { label: 'Niet-vervulde dagen', value: data?.nietVervuldeDagen?.toString() ?? '-', color: data && data.nietVervuldeDagen > 10 ? 'text-red-700' : 'text-gray-700' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vervangingsdruk</h1>
        </div>
        <select
          value={schooljaar}
          onChange={(e) => { setSchooljaar(e.target.value); setForm((prev) => ({ ...prev, schooljaar: e.target.value })); }}
          className="input w-44"
        >
          {schoolYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
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
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Vervangingsgegevens {schooljaar}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Totaal vervangingsdagen</label>
            <input type="number" step={1} value={form.totaalVervangingsDagen} onChange={(e) => setForm({ ...form, totaalVervangingsDagen: parseInt(e.target.value) || 0 })} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Niet-vervulde dagen</label>
            <input type="number" step={1} value={form.nietVervuldeDagen} onChange={(e) => setForm({ ...form, nietVervuldeDagen: parseInt(e.target.value) || 0 })} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Kosten vervanging (&euro;)</label>
            <input type="number" step={100} value={form.kostenVervanging} onChange={(e) => setForm({ ...form, kostenVervanging: parseFloat(e.target.value) || 0 })} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Totaal FTE</label>
            <input type="number" step={0.1} value={form.totaalFte} onChange={(e) => setForm({ ...form, totaalFte: parseFloat(e.target.value) || 0 })} className="input w-full" />
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
    </div>
  );
}
