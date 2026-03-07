import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { VervangingsData } from '@schoollaider/shared';

export function HrVervangingPage() {
  const [schools, setSchools] = useState<{ id: string; naam: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schooljaar, setSchooljaar] = useState('2025-2026');
  const [data, setData] = useState<VervangingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    totaalVervangingsDagen: 0, nietVervuldeDagen: 0, kostenVervanging: 0, totaalFte: 0,
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
    api.get(`/hr/school/${selectedSchool}/vervanging`, { params: { schooljaar } })
      .then(({ data }) => {
        setData(data);
        if (data) setForm({
          totaalVervangingsDagen: data.totaalVervangingsDagen,
          nietVervuldeDagen: data.nietVervuldeDagen,
          kostenVervanging: data.kostenVervanging,
          totaalFte: data.totaalFte,
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedSchool, schooljaar]);

  const save = async () => {
    setSaving(true);
    try {
      const { data: res } = await api.put(`/hr/school/${selectedSchool}/vervanging`, { ...form, schooljaar });
      setData(res);
    } catch { /* */ }
    setSaving(false);
  };

  const field = (label: string, key: keyof typeof form, step = 1) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input type="number" step={step} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Vervangingsdruk</h1>
      <p className="mt-1 text-sm text-gray-500">Vervangingsdagen, kosten en lesuitvalrisico</p>

      <div className="mt-6 flex gap-4">
        <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          {schools.map((s) => <option key={s.id} value={s.id}>{s.naam}</option>)}
        </select>
        <select value={schooljaar} onChange={(e) => setSchooljaar(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option>2024-2025</option><option>2025-2026</option><option>2026-2027</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-lg bg-gray-200" />
      ) : (
        <>
          {data && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="text-xs text-gray-500">Vervangingsindex</p>
                <p className={`text-xl font-bold ${data.vervangingsIndex >= 70 ? 'text-green-600' : data.vervangingsIndex >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {data.vervangingsIndex}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="text-xs text-gray-500">Kosten vervanging</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(data.kostenVervanging)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="text-xs text-gray-500">Niet-vervulde dagen</p>
                <p className={`text-xl font-bold ${data.nietVervuldeDagen > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                  {data.nietVervuldeDagen}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Vervangingsdata invoeren</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field('Totaal vervangingsdagen', 'totaalVervangingsDagen')}
              {field('Niet-vervulde dagen', 'nietVervuldeDagen')}
              {field('Kosten vervanging (EUR)', 'kostenVervanging', 0.01)}
              {field('Totaal FTE', 'totaalFte', 0.1)}
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
