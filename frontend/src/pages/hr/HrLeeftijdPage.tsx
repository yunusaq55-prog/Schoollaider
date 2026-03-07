import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useSchoolContext } from '../../context/SchoolContext';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { hrScoreColor } from '../../components/HrRisicoBadge';
import { Building2, Save, Clock } from 'lucide-react';
import type { LeeftijdData, CreateLeeftijdRequest } from '@schoollaider/shared';

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

const emptyForm: CreateLeeftijdRequest = {
  schooljaar: '',
  categorieOnder30: 0,
  categorie30Tot40: 0,
  categorie40Tot50: 0,
  categorie50Tot60: 0,
  categorie60Plus: 0,
};

const categories = [
  { key: 'categorieOnder30' as const, label: '< 30 jaar', color: 'bg-emerald-500' },
  { key: 'categorie30Tot40' as const, label: '30-40 jaar', color: 'bg-blue-500' },
  { key: 'categorie40Tot50' as const, label: '40-50 jaar', color: 'bg-violet-500' },
  { key: 'categorie50Tot60' as const, label: '50-60 jaar', color: 'bg-amber-500' },
  { key: 'categorie60Plus' as const, label: '60+ jaar', color: 'bg-red-500' },
];

export function HrLeeftijdPage() {
  const { selectedSchoolId } = useSchoolContext();
  const schoolYears = generateSchoolYears();
  const [schooljaar, setSchooljaar] = useState(schoolYears[0]);
  const [data, setData] = useState<LeeftijdData | null>(null);
  const [form, setForm] = useState<CreateLeeftijdRequest>({ ...emptyForm, schooljaar: schoolYears[0] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (selectedSchoolId) fetchData();
  }, [selectedSchoolId, schooljaar]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get(`/hr/school/${selectedSchoolId}/leeftijd?schooljaar=${schooljaar}`);
      const d: LeeftijdData | null = res.data;
      setData(d);
      if (d) {
        setForm({
          schooljaar: d.schooljaar,
          categorieOnder30: d.categorieOnder30,
          categorie30Tot40: d.categorie30Tot40,
          categorie40Tot50: d.categorie40Tot50,
          categorie50Tot60: d.categorie50Tot60,
          categorie60Plus: d.categorie60Plus,
        });
      } else {
        setForm({ ...emptyForm, schooljaar });
      }
    } catch (err: any) {
      console.error('[HrLeeftijd] Ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedSchoolId) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put(`/hr/school/${selectedSchoolId}/leeftijd`, form);
      setData(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error('[HrLeeftijd] Opslaan mislukt:', err?.message);
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

  const totaal = form.categorieOnder30 + form.categorie30Tot40 + form.categorie40Tot50 + form.categorie50Tot60 + form.categorie60Plus;
  const pct55Plus = totaal > 0 ? Math.round(((form.categorie50Tot60 * 0.5 + form.categorie60Plus) / totaal) * 100) : 0;
  const pct60Plus = totaal > 0 ? Math.round((form.categorie60Plus / totaal) * 100) : 0;

  const kpis = [
    { label: 'Totaal personeel', value: totaal.toString(), color: 'text-gray-700' },
    { label: '% 55+', value: `${pct55Plus}%`, color: pct55Plus > 30 ? 'text-red-700' : 'text-gray-700' },
    { label: 'Verwachte uitstroom 3jr', value: data?.verwachteUitstroom3Jaar?.toFixed(1) ?? '-', color: data && data.verwachteUitstroom3Jaar > 3 ? 'text-red-700' : 'text-gray-700' },
    { label: '% 60+', value: `${pct60Plus}%`, color: pct60Plus > 20 ? 'text-red-700' : 'text-gray-700' },
  ];

  // Bar chart data
  const maxValue = Math.max(form.categorieOnder30, form.categorie30Tot40, form.categorie40Tot50, form.categorie50Tot60, form.categorie60Plus, 1);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Leeftijd & Uitstroom</h1>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Leeftijdsverdeling {schooljaar}</h2>
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{cat.label}</label>
                <input
                  type="number"
                  step={1}
                  min={0}
                  value={form[cat.key]}
                  onChange={(e) => setForm({ ...form, [cat.key]: parseInt(e.target.value) || 0 })}
                  className="input w-full"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
            {saved && <span className="text-sm text-emerald-600">Opgeslagen!</span>}
          </div>
        </div>

        {/* Bar chart visualization */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Leeftijdsverdeling</h2>
          <div className="flex h-64 items-end gap-3">
            {categories.map((cat) => {
              const value = form[cat.key];
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
              return (
                <div key={cat.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">{value}</span>
                  <div className="w-full rounded-t-lg" style={{ height: `${height}%`, minHeight: value > 0 ? '8px' : '0' }}>
                    <div className={`h-full w-full rounded-t-lg ${cat.color} transition-all duration-500`} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500">{cat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
