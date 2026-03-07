import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { VerzuimData } from '@schoollaider/shared';

export function HrVerzuimPage() {
  const [schools, setSchools] = useState<{ id: string; naam: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [periodes, setPeriodes] = useState<VerzuimData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    periode: new Date().toISOString().slice(0, 7),
    verzuimPct: 0, kortVerzuimPct: 0, langVerzuimPct: 0, ziekteVervangingsDagen: 0,
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
    api.get(`/hr/school/${selectedSchool}/verzuim`)
      .then(({ data }) => setPeriodes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedSchool]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/hr/school/${selectedSchool}/verzuim`, form);
      const { data } = await api.get(`/hr/school/${selectedSchool}/verzuim`);
      setPeriodes(data);
    } catch { /* */ }
    setSaving(false);
  };

  const field = (label: string, key: keyof typeof form, step = 0.1) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={key === 'periode' ? 'month' : 'number'}
        step={step}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: key === 'periode' ? e.target.value : parseFloat(e.target.value) || 0 })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Verzuim & Belastbaarheid</h1>
      <p className="mt-1 text-sm text-gray-500">Verzuimpercentages en belastbaarheidsindex per school</p>

      <div className="mt-6">
        <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          {schools.map((s) => <option key={s.id} value={s.id}>{s.naam}</option>)}
        </select>
      </div>

      {/* Invoerformulier */}
      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Verzuimdata invoeren</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {field('Periode', 'periode')}
          {field('Verzuim %', 'verzuimPct')}
          {field('Kort verzuim %', 'kortVerzuimPct')}
          {field('Lang verzuim %', 'langVerzuimPct')}
          {field('Ziektevervangingsdagen', 'ziekteVervangingsDagen', 1)}
        </div>
        <button onClick={save} disabled={saving}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {/* Trend tabel */}
      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-lg bg-gray-200" />
      ) : periodes.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Periode</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Verzuim %</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kort</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Lang</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Belastbaarheid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {periodes.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{p.periode}</td>
                  <td className={`px-6 py-3 text-sm ${p.verzuimPct > 5.5 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {p.verzuimPct}%
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">{p.kortVerzuimPct}%</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{p.langVerzuimPct}%</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${p.belastbaarheidsIndex >= 70 ? 'bg-green-500' : p.belastbaarheidsIndex >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${p.belastbaarheidsIndex}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{p.belastbaarheidsIndex}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">Nog geen verzuimdata voor deze school</p>
        </div>
      )}
    </div>
  );
}
