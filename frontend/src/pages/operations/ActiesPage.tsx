import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Plus, X, Mail } from 'lucide-react';
import api from '../../api/client';

interface Actie {
  id: string;
  titel: string;
  beschrijving: string;
  prioriteit: 'LAAG' | 'MIDDEL' | 'HOOG' | 'KRITIEK';
  status: 'OPEN' | 'IN_BEHANDELING' | 'AFGEROND' | 'GEANNULEERD';
  bron: string;
  deadline?: string;
  conceptEmail?: string;
  school?: { naam: string };
  assignee?: { naam: string };
}

const PRIORITEIT_COLORS: Record<string, string> = {
  KRITIEK: 'border-l-red-500 bg-red-50',
  HOOG: 'border-l-orange-400 bg-orange-50',
  MIDDEL: 'border-l-yellow-400 bg-yellow-50',
  LAAG: 'border-l-green-400 bg-green-50',
};

const BRON_LABELS: Record<string, string> = {
  HR_SIGNAAL: 'HR',
  SUBSIDIE_SIGNAAL: 'Subsidie',
  PDCA_SUGGESTION: 'PDCA',
  COMPLIANCE: 'Compliance',
  HANDMATIG: 'Handmatig',
};

const KOLOMMEN: { key: Actie['status']; label: string }[] = [
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_BEHANDELING', label: 'In behandeling' },
  { key: 'AFGEROND', label: 'Afgerond' },
];

export default function ActiesPage() {
  const queryClient = useQueryClient();
  const [selectedActie, setSelectedActie] = useState<Actie | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ titel: '', beschrijving: '', prioriteit: 'MIDDEL' });

  const { data: acties = [], isLoading } = useQuery<Actie[]>({
    queryKey: ['acties'],
    queryFn: () => api.get('/operations/acties').then((r) => r.data),
  });

  const updateActie = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.patch(`/operations/acties/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['acties'] }),
  });

  const createActie = useMutation({
    mutationFn: (data: object) => api.post('/operations/acties', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acties'] });
      setShowNew(false);
      setNewForm({ titel: '', beschrijving: '', prioriteit: 'MIDDEL' });
    },
  });

  const getKolom = (status: Actie['status']) =>
    acties.filter((a) => a.status === status);

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
            {[1, 2].map((j) => (
              <div key={j} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Acties</h1>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nieuwe Actie
        </button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-4">
        {KOLOMMEN.map((kolom) => {
          const items = getKolom(kolom.key);
          return (
            <div key={kolom.key} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-sm">{kolom.label}</h3>
                <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2">
                {items.map((actie) => (
                  <div
                    key={actie.id}
                    onClick={() => setSelectedActie(actie)}
                    className={`bg-white border-l-4 border border-gray-200 rounded p-3 cursor-pointer hover:shadow-sm transition-shadow ${PRIORITEIT_COLORS[actie.prioriteit]}`}
                  >
                    <p className="text-sm font-medium text-gray-900 leading-tight">{actie.titel}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {actie.school && (
                        <span className="text-xs text-gray-500">{actie.school.naam}</span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-600 rounded px-1">
                        {BRON_LABELS[actie.bron] ?? actie.bron}
                      </span>
                      {actie.deadline && (
                        <span className="text-xs text-gray-400">
                          {new Date(actie.deadline).toLocaleDateString('nl-NL')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Geen acties</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actie detail side panel */}
      {selectedActie && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 leading-tight pr-4">
                {selectedActie.titel}
              </h2>
              <button onClick={() => setSelectedActie(null)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Beschrijving
                </label>
                <p className="text-sm text-gray-700 mt-1">{selectedActie.beschrijving}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <select
                    value={selectedActie.status}
                    onChange={(e) => {
                      updateActie.mutate({ id: selectedActie.id, data: { status: e.target.value } });
                      setSelectedActie({ ...selectedActie, status: e.target.value as Actie['status'] });
                    }}
                    className="mt-1 w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_BEHANDELING">In behandeling</option>
                    <option value="AFGEROND">Afgerond</option>
                    <option value="GEANNULEERD">Geannuleerd</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Prioriteit</label>
                  <p className="text-sm mt-1">{selectedActie.prioriteit}</p>
                </div>
              </div>

              {selectedActie.deadline && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Deadline</label>
                  <p className="text-sm mt-1">
                    {new Date(selectedActie.deadline).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              )}

              {selectedActie.conceptEmail && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Concept e-mail
                    </label>
                  </div>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-blue-50 border border-blue-100 rounded p-3 font-sans leading-relaxed">
                    {selectedActie.conceptEmail}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New actie modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Nieuwe Actie</h2>
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
                  placeholder="Actietitel..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Beschrijving</label>
                <textarea
                  value={newForm.beschrijving}
                  onChange={(e) => setNewForm({ ...newForm, beschrijving: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none"
                  placeholder="Beschrijving..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Prioriteit</label>
                <select
                  value={newForm.prioriteit}
                  onChange={(e) => setNewForm({ ...newForm, prioriteit: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="LAAG">Laag</option>
                  <option value="MIDDEL">Middel</option>
                  <option value="HOOG">Hoog</option>
                  <option value="KRITIEK">Kritiek</option>
                </select>
              </div>
              <button
                disabled={!newForm.titel || createActie.isPending}
                onClick={() => createActie.mutate(newForm)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createActie.isPending ? 'Aanmaken...' : 'Actie aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
