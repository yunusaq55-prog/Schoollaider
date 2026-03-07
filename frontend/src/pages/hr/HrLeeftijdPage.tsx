import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { LeeftijdData } from '@schoollaider/shared';

export function HrLeeftijdPage() {
  const [schools, setSchools] = useState<{ id: string; naam: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schooljaar, setSchooljaar] = useState('2025-2026');
  const [data, setData] = useState<LeeftijdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categorieOnder30: 0, categorie30Tot40: 0, categorie40Tot50: 0,
    categorie50Tot60: 0, categorie60Plus: 0,
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
    api.get(`/hr/school/${selectedSchool}/leeftijd`, { params: { schooljaar } })
      .then(({ data }) => {
        setData(data);
        if (data) setForm({
          categorieOnder30: data.categorieOnder30, categorie30Tot40: data.categorie30Tot40,
          categorie40Tot50: data.categorie40Tot50, categorie50Tot60: data.categorie50Tot60,
          categorie60Plus: data.categorie60Plus,
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedSchool, schooljaar]);

  const save = async () => {
    setSaving(true);
    try {
      const { data: res } = await api.put(`/hr/school/${selectedSchool}/leeftijd`, { ...form, schooljaar });
      setData(res);
    } catch { /* */ }
    setSaving(false);
  };

  const total = form.categorieOnder30 + form.categorie30Tot40 + form.categorie40Tot50 + form.categorie50Tot60 + form.categorie60Plus;

  const barSegment = (label: string, value: number, color: string) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm text-gray-600">{label}</span>
        <div className="flex-1">
          <div className="h-6 rounded bg-gray-100">
            <div className={`h-6 rounded ${color} flex items-center px-2`} style={{ width: `${Math.max(pct, 2)}%` }}>
              <span className="text-xs font-medium text-white">{value}</span>
            </div>
          </div>
        </div>
        <span className="w-10 text-right text-sm text-gray-500">{pct}%</span>
      </div>
    );
  };

  const field = (label: string, key: keyof typeof form) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input type="number" value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Leeftijd & Uitstroom</h1>
      <p className="mt-1 text-sm text-gray-500">Leeftijdsverdeling en verwachte uitstroom</p>

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
          {/* Visualisatie */}
          {data && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">Leeftijdsverdeling</h3>
                <div className="space-y-3">
                  {barSegment('< 30', data.categorieOnder30, 'bg-green-500')}
                  {barSegment('30-40', data.categorie30Tot40, 'bg-blue-500')}
                  {barSegment('40-50', data.categorie40Tot50, 'bg-yellow-500')}
                  {barSegment('50-60', data.categorie50Tot60, 'bg-orange-500')}
                  {barSegment('60+', data.categorie60Plus, 'bg-red-500')}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg bg-white p-6 shadow">
                  <p className="text-xs text-gray-500">Totaal medewerkers</p>
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                </div>
                <div className="rounded-lg bg-white p-6 shadow">
                  <p className="text-xs text-gray-500">Verwachte uitstroom (3 jaar)</p>
                  <p className={`text-2xl font-bold ${data.verwachteUitstroom3Jaar > total * 0.2 ? 'text-red-600' : 'text-gray-900'}`}>
                    {data.verwachteUitstroom3Jaar.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-6 shadow">
                  <p className="text-xs text-gray-500">% 55+ medewerkers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {total > 0 ? Math.round(((data.categorie50Tot60 * 0.5 + data.categorie60Plus) / total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formulier */}
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Leeftijdsgegevens invoeren</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {field('Onder 30 jaar', 'categorieOnder30')}
              {field('30-40 jaar', 'categorie30Tot40')}
              {field('40-50 jaar', 'categorie40Tot50')}
              {field('50-60 jaar', 'categorie50Tot60')}
              {field('60+ jaar', 'categorie60Plus')}
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
