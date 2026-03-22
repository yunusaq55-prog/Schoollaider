import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, AlertTriangle, X } from 'lucide-react';
import api from '../../api/client';

interface BeleidsDocument {
  id: string;
  titel: string;
  domein: string;
  status: 'ACTIEF' | 'VERLOPEN' | 'ARCHIEF';
  vastgesteldDatum: string | null;
  evaluatieDatum: string | null;
  volgendEvaluatieDatum: string | null;
  herinneringDagen: number;
  voortgangNotes: string;
  school?: { naam: string };
}

const DOMEINEN = ['HR', 'Veiligheid', 'Kwaliteit', 'Financiën', 'ICT', 'Onderwijs', 'Overig'];

function dagsTot(datum: string | null): number | null {
  if (!datum) return null;
  return Math.ceil((new Date(datum).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function EvaluatieBadge({ datum }: { datum: string | null }) {
  const dagen = dagsTot(datum);
  if (dagen === null) return <span className="text-xs text-gray-400">Niet gepland</span>;
  if (dagen < 0) return <span className="text-xs text-red-600 font-medium">Verlopen ({Math.abs(dagen)}d)</span>;
  if (dagen <= 14) return <span className="text-xs text-red-600 font-medium">{dagen} dagen</span>;
  if (dagen <= 30) return <span className="text-xs text-orange-500 font-medium">{dagen} dagen</span>;
  return <span className="text-xs text-gray-600">{new Date(datum!).toLocaleDateString('nl-NL')}</span>;
}

export default function BeleidPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    titel: '',
    domein: 'HR',
    volgendEvaluatieDatum: '',
    herinneringDagen: 30,
  });

  const { data: upcoming = [] } = useQuery<BeleidsDocument[]>({
    queryKey: ['beleid-evaluaties'],
    queryFn: () => api.get('/operations/beleid/evaluaties').then((r) => r.data),
  });

  const { data: alle = [], isLoading } = useQuery<BeleidsDocument[]>({
    queryKey: ['beleid'],
    queryFn: () => api.get('/operations/beleid').then((r) => r.data),
  });

  const createDoc = useMutation({
    mutationFn: (data: object) => api.post('/operations/beleid', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beleid'] });
      queryClient.invalidateQueries({ queryKey: ['beleid-evaluaties'] });
      setShowNew(false);
      setNewForm({ titel: '', domein: 'HR', volgendEvaluatieDatum: '', herinneringDagen: 30 });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Beleidscyclus</h1>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nieuw Document
        </button>
      </div>

      {/* Upcoming evaluaties alert */}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-medium">{upcoming.length} beleidsdocument{upcoming.length > 1 ? 'en' : ''}</span>{' '}
            vereist{upcoming.length === 1 ? '' : 'en'} binnenkort evaluatie.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Document</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Domein</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">School / Bestuur</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Volgende evaluatie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alle.map((doc) => {
              const dagen = dagsTot(doc.volgendEvaluatieDatum);
              const isUrgent = dagen !== null && dagen <= 30;
              return (
                <tr key={doc.id} className={isUrgent ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{doc.titel}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {doc.domein}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{doc.school?.naam ?? 'Bestuur'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      doc.status === 'ACTIEF' ? 'bg-green-100 text-green-700' :
                      doc.status === 'VERLOPEN' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <EvaluatieBadge datum={doc.volgendEvaluatieDatum} />
                  </td>
                </tr>
              );
            })}
            {alle.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nog geen beleidsdocumenten. Voeg er een toe om de cyclus bij te houden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New document modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Nieuw Beleidsdocument</h2>
              <button onClick={() => setShowNew(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Titel</label>
                <input
                  type="text"
                  value={newForm.titel}
                  onChange={(e) => setNewForm({ ...newForm, titel: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Taakbeleid 2024..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Domein</label>
                <select
                  value={newForm.domein}
                  onChange={(e) => setNewForm({ ...newForm, domein: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {DOMEINEN.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Volgende evaluatiedatum</label>
                <input
                  type="date"
                  value={newForm.volgendEvaluatieDatum}
                  onChange={(e) => setNewForm({ ...newForm, volgendEvaluatieDatum: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Herinneringsperiode (dagen voor evaluatie)</label>
                <input
                  type="number"
                  value={newForm.herinneringDagen}
                  onChange={(e) => setNewForm({ ...newForm, herinneringDagen: parseInt(e.target.value) })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  min={7}
                  max={90}
                />
              </div>
              <button
                disabled={!newForm.titel || createDoc.isPending}
                onClick={() =>
                  createDoc.mutate({
                    ...newForm,
                    volgendEvaluatieDatum: newForm.volgendEvaluatieDatum || undefined,
                  })
                }
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createDoc.isPending ? 'Aanmaken...' : 'Aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
