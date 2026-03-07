import { useEffect, useState } from 'react';
import api from '../api/client';
import type { PdcaCyclus, PdcaFase } from '@schoollaider/shared';

const FASE_LABELS: Record<PdcaFase, string> = {
  PLAN: 'Plan',
  DO: 'Do',
  CHECK: 'Check',
  ACT: 'Act',
};

const FASE_COLORS: Record<PdcaFase, string> = {
  PLAN: 'bg-blue-100 text-blue-700',
  DO: 'bg-green-100 text-green-700',
  CHECK: 'bg-yellow-100 text-yellow-700',
  ACT: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS: Record<string, string> = {
  CONCEPT: 'bg-gray-100 text-gray-600',
  ACTIEF: 'bg-green-100 text-green-700',
  AFGEROND: 'bg-blue-100 text-blue-700',
};

export function PdcaPage() {
  const [cycli, setCycli] = useState<PdcaCyclus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCyclus, setSelectedCyclus] = useState<PdcaCyclus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titel: '', beschrijving: '', schooljaar: '2025-2026', schoolId: '' });
  const [schools, setSchools] = useState<{ id: string; naam: string }[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/pdca'),
      api.get('/schools'),
    ]).then(([cycliRes, schoolsRes]) => {
      setCycli(cycliRes.data);
      setSchools(schoolsRes.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadCyclus = async (id: string) => {
    const { data } = await api.get(`/pdca/${id}`);
    setSelectedCyclus(data);
  };

  const createCyclus = async () => {
    if (!form.titel || !form.schoolId) return;
    const { data } = await api.post('/pdca', form);
    setCycli([data, ...cycli]);
    setShowForm(false);
    setForm({ titel: '', beschrijving: '', schooljaar: '2025-2026', schoolId: '' });
  };

  const updateFase = async (id: string, fase: PdcaFase) => {
    await api.patch(`/pdca/${id}`, { fase });
    setCycli(cycli.map((c) => c.id === id ? { ...c, fase } : c));
    if (selectedCyclus?.id === id) setSelectedCyclus({ ...selectedCyclus, fase });
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-gray-200" />)}
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDCA Cyclus</h1>
          <p className="mt-1 text-sm text-gray-500">Plan-Do-Check-Act verbetercycli</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nieuwe cyclus
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Nieuwe PDCA Cyclus</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Titel</label>
              <input
                value={form.titel}
                onChange={(e) => setForm({ ...form, titel: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">School</label>
              <select
                value={form.schoolId}
                onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Selecteer school...</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.naam}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Beschrijving</label>
              <textarea
                value={form.beschrijving}
                onChange={(e) => setForm({ ...form, beschrijving: e.target.value })}
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createCyclus} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Aanmaken
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">
              Annuleren
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cycli lijst */}
        <div className="lg:col-span-1">
          <div className="space-y-3">
            {cycli.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500">Geen PDCA cycli</p>
              </div>
            ) : cycli.map((c) => (
              <button
                key={c.id}
                onClick={() => loadCyclus(c.id)}
                className={`w-full rounded-lg bg-white p-4 text-left shadow transition-colors hover:bg-gray-50 ${
                  selectedCyclus?.id === c.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${FASE_COLORS[c.fase]}`}>
                    {FASE_LABELS[c.fase]}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <h4 className="mt-2 font-medium text-gray-900">{c.titel}</h4>
                <p className="mt-1 text-xs text-gray-500">{c.schooljaar}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selectedCyclus ? (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-bold text-gray-900">{selectedCyclus.titel}</h3>
              <p className="mt-1 text-sm text-gray-500">{selectedCyclus.beschrijving}</p>

              {/* Fase knoppen */}
              <div className="mt-4 flex gap-2">
                {(['PLAN', 'DO', 'CHECK', 'ACT'] as PdcaFase[]).map((fase) => (
                  <button
                    key={fase}
                    onClick={() => updateFase(selectedCyclus.id, fase)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedCyclus.fase === fase
                        ? FASE_COLORS[fase].replace('100', '600').replace('700', '100') + ' ring-2 ring-offset-1'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {FASE_LABELS[fase]}
                  </button>
                ))}
              </div>

              {/* Acties */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700">Acties</h4>
                {selectedCyclus.acties && selectedCyclus.acties.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedCyclus.acties.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 rounded-md bg-gray-50 p-3">
                        <span className={`h-4 w-4 rounded border ${a.afgerond ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                        <div className="flex-1">
                          <p className={`text-sm ${a.afgerond ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {a.titel}
                          </p>
                          <span className={`text-xs ${FASE_COLORS[a.fase]} rounded px-1.5 py-0.5`}>
                            {FASE_LABELS[a.fase]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">Nog geen acties toegevoegd</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-400">Selecteer een cyclus om details te bekijken</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
