import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { FormatieData } from '@schoollaider/shared';

export function HrFormatiePage() {
  const [schools, setSchools] = useState<{ id: string; naam: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schooljaar, setSchooljaar] = useState('2025-2026');
  const [formatie, setFormatie] = useState<FormatieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    begroteFte: 0, ingevuldeFte: 0, vacatures: 0, tijdelijkPct: 0,
    fteLeerkracht: 0, fteOop: 0, fteDirectie: 0,
  });

  useEffect(() => {
    api.get('/schools').then(({ data }) => {
      setSchools(data);
      if (data.length > 0) setSelectedSchool(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedSchool) return;
    setLoading(true);
    api.get(`/hr/school/${selectedSchool}/formatie`, { params: { schooljaar } })
      .then(({ data }) => {
        setFormatie(data);
        if (data) {
          setForm({
            begroteFte: data.begroteFte, ingevuldeFte: data.ingevuldeFte,
            vacatures: data.vacatures, tijdelijkPct: data.tijdelijkPct,
            fteLeerkracht: data.fteLeerkracht, fteOop: data.fteOop, fteDirectie: data.fteDirectie,
          });
        }
      })
      .catch(() => setFormatie(null))
      .finally(() => setLoading(false));
  }, [selectedSchool, schooljaar]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/hr/school/${selectedSchool}/formatie`, { ...form, schooljaar });
      setFormatie(data);
    } catch { /* */ }
    setSaving(false);
  };

  const field = (label: string, key: keyof typeof form, step = 0.1) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        step={step}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Formatie & Capaciteit</h1>
      <p className="mt-1 text-sm text-gray-500">FTE verdeling en bezetting per school</p>

      <div className="mt-6 flex gap-4">
        <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          {schools.map((s) => <option key={s.id} value={s.id}>{s.naam}</option>)}
        </select>
        <select value={schooljaar} onChange={(e) => setSchooljaar(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option>2024-2025</option>
          <option>2025-2026</option>
          <option>2026-2027</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-6 h-64 animate-pulse rounded-lg bg-gray-200" />
      ) : (
        <>
          {/* KPI's */}
          {formatie && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="text-xs text-gray-500">FTE Tekort</p>
                <p className={`text-xl font-bold ${formatie.begroteFte - formatie.ingevuldeFte > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(formatie.begroteFte - formatie.ingevuldeFte).toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="text-xs text-gray-500">Vacatures</p>
                <p className="text-xl font-bold text-gray-900">{formatie.vacatures}</p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="text-xs text-gray-500">% Tijdelijk</p>
                <p className="text-xl font-bold text-gray-900">{formatie.tijdelijkPct}%</p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="text-xs text-gray-500">Capaciteitsscore</p>
                <p className={`text-xl font-bold ${formatie.capaciteitsScore >= 70 ? 'text-green-600' : formatie.capaciteitsScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatie.capaciteitsScore}
                </p>
              </div>
            </div>
          )}

          {/* Formulier */}
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Formatiegegevens invoeren</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {field('Begrote FTE', 'begroteFte')}
              {field('Ingevulde FTE', 'ingevuldeFte')}
              {field('Vacatures', 'vacatures', 1)}
              {field('% Tijdelijke contracten', 'tijdelijkPct')}
              {field('FTE Leerkrachten', 'fteLeerkracht')}
              {field('FTE OOP', 'fteOop')}
              {field('FTE Directie', 'fteDirectie')}
            </div>
            <button onClick={save} disabled={saving}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
