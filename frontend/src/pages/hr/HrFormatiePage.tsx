import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useSchoolContext } from '../../context/SchoolContext';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { hrScoreColor } from '../../components/HrRisicoBadge';
import { Building2, Save, UserCheck } from 'lucide-react';
import type { FormatieData, CreateFormatieRequest } from '@schoollaider/shared';

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

const emptyForm: CreateFormatieRequest = {
  schooljaar: '',
  begroteFte: 0,
  ingevuldeFte: 0,
  vacatures: 0,
  tijdelijkPct: 0,
  fteLeerkracht: 0,
  fteOop: 0,
  fteDirectie: 0,
};

export function HrFormatiePage() {
  const { selectedSchoolId, selectedSchool } = useSchoolContext();
  const schoolYears = generateSchoolYears();
  const [schooljaar, setSchooljaar] = useState(schoolYears[0]);
  const [data, setData] = useState<FormatieData | null>(null);
  const [form, setForm] = useState<CreateFormatieRequest>({ ...emptyForm, schooljaar: schoolYears[0] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (selectedSchoolId) fetchData();
  }, [selectedSchoolId, schooljaar]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get(`/hr/school/${selectedSchoolId}/formatie?schooljaar=${schooljaar}`);
      const d: FormatieData | null = res.data;
      setData(d);
      if (d) {
        setForm({
          schooljaar: d.schooljaar,
          begroteFte: d.begroteFte,
          ingevuldeFte: d.ingevuldeFte,
          vacatures: d.vacatures,
          tijdelijkPct: d.tijdelijkPct,
          fteLeerkracht: d.fteLeerkracht,
          fteOop: d.fteOop,
          fteDirectie: d.fteDirectie,
        });
      } else {
        setForm({ ...emptyForm, schooljaar });
      }
    } catch (err: any) {
      console.error('[HrFormatie] Ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedSchoolId) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put(`/hr/school/${selectedSchoolId}/formatie`, form);
      setData(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error('[HrFormatie] Opslaan mislukt:', err?.message);
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof CreateFormatieRequest, value: number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (!selectedSchoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="mb-4 h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-900">Geen school geselecteerd</p>
        <p className="mt-1 text-sm text-gray-500">Selecteer een school om formatie-data in te voeren.</p>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  const fteTekort = form.begroteFte - form.ingevuldeFte;
  const kpis = [
    { label: 'FTE Tekort/Overschot', value: fteTekort > 0 ? `-${fteTekort.toFixed(1)}` : `+${Math.abs(fteTekort).toFixed(1)}`, color: fteTekort > 0 ? 'text-red-700' : 'text-emerald-700' },
    { label: '% Tijdelijk', value: `${form.tijdelijkPct.toFixed(0)}%`, color: form.tijdelijkPct > 20 ? 'text-amber-700' : 'text-gray-700' },
    { label: 'Vacatures', value: form.vacatures.toString(), color: form.vacatures > 2 ? 'text-red-700' : 'text-gray-700' },
    { label: 'Capaciteitsscore', value: data?.capaciteitsScore?.toString() ?? '-', color: data ? hrScoreColor(data.capaciteitsScore).text : 'text-gray-400' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Formatie & Capaciteit
          </h1>
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
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Formatiegegevens {schooljaar}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Begrote FTE" value={form.begroteFte} onChange={(v) => updateField('begroteFte', v)} step={0.1} />
          <FormField label="Ingevulde FTE" value={form.ingevuldeFte} onChange={(v) => updateField('ingevuldeFte', v)} step={0.1} />
          <FormField label="Vacatures" value={form.vacatures} onChange={(v) => updateField('vacatures', v)} step={1} />
          <FormField label="% Tijdelijk" value={form.tijdelijkPct} onChange={(v) => updateField('tijdelijkPct', v)} step={1} />
        </div>
        <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-700">FTE Verdeling</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="FTE Leerkrachten" value={form.fteLeerkracht} onChange={(v) => updateField('fteLeerkracht', v)} step={0.1} />
          <FormField label="FTE OOP" value={form.fteOop} onChange={(v) => updateField('fteOop', v)} step={0.1} />
          <FormField label="FTE Directie" value={form.fteDirectie} onChange={(v) => updateField('fteDirectie', v)} step={0.1} />
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

function FormField({
  label, value, onChange, step = 1,
}: {
  label: string; value: number; onChange: (v: number) => void; step?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input w-full"
      />
    </div>
  );
}
