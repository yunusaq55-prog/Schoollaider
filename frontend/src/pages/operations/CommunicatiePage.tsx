import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Sparkles, Check } from 'lucide-react';
import api from '../../api/client';

interface CommunicatieDraft {
  id: string;
  onderwerp: string;
  concept: string;
  intentie: string;
  ontvangerNaam: string;
  definitief: boolean;
  verstuurdOp: string | null;
  kanaal: string;
  school?: { naam: string };
  createdAt: string;
}

export default function CommunicatiePage() {
  const queryClient = useQueryClient();
  const [selectedDraft, setSelectedDraft] = useState<CommunicatieDraft | null>(null);
  const [form, setForm] = useState({
    intentie: '',
    ontvangerNaam: '',
    ontvangerRol: 'Schoolleider',
    ontvangerEmail: '',
    schoolId: '',
  });

  const { data: drafts = [] } = useQuery<CommunicatieDraft[]>({
    queryKey: ['communicatie-drafts'],
    queryFn: () => api.get('/operations/communicatie').then((r) => r.data),
  });

  const generateDraft = useMutation({
    mutationFn: (data: object) =>
      api.post('/operations/communicatie/genereer', data).then((r) => r.data),
    onSuccess: (draft) => {
      queryClient.invalidateQueries({ queryKey: ['communicatie-drafts'] });
      setSelectedDraft(draft);
      setForm({ intentie: '', ontvangerNaam: '', ontvangerRol: 'Schoolleider', ontvangerEmail: '', schoolId: '' });
    },
  });

  const updateDraft = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.patch(`/operations/communicatie/${id}`, data).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['communicatie-drafts'] });
      setSelectedDraft(updated);
    },
  });

  return (
    <div className="p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Communicatie</h1>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Left: draft history */}
        <div className="col-span-1 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-600">Recente drafts</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {drafts.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDraft(d)}
                className={`w-full text-left p-3 hover:bg-gray-50 ${selectedDraft?.id === d.id ? 'bg-blue-50' : ''}`}
              >
                <p className="text-sm font-medium text-gray-900 truncate">{d.onderwerp}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {d.definitief && <Check className="h-3 w-3 text-green-500" />}
                  <p className="text-xs text-gray-400 truncate">{d.ontvangerNaam}</p>
                </div>
              </button>
            ))}
            {drafts.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Nog geen drafts</p>
            )}
          </div>
        </div>

        {/* Right: compose or view */}
        <div className="col-span-2 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {selectedDraft ? (
            <>
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{selectedDraft.onderwerp}</p>
                  <p className="text-xs text-gray-500">Aan: {selectedDraft.ontvangerNaam}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedDraft.definitief && (
                    <button
                      onClick={() =>
                        updateDraft.mutate({
                          id: selectedDraft.id,
                          data: { definitief: true, verstuurdOp: new Date().toISOString() },
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Check className="h-3 w-3" /> Markeer verstuurd
                    </button>
                  )}
                  {selectedDraft.definitief && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Verstuurd
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedDraft(null)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Nieuw concept
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <textarea
                  value={selectedDraft.concept}
                  onChange={(e) =>
                    setSelectedDraft({ ...selectedDraft, concept: e.target.value })
                  }
                  onBlur={() =>
                    updateDraft.mutate({
                      id: selectedDraft.id,
                      data: { concept: selectedDraft.concept },
                    })
                  }
                  className="w-full h-full min-h-64 text-sm text-gray-800 border-0 outline-none resize-none font-sans leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 p-5 flex flex-col gap-4">
              <p className="text-sm font-medium text-gray-700">Nieuwe communicatie opstellen</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Naam ontvanger</label>
                  <input
                    type="text"
                    value={form.ontvangerNaam}
                    onChange={(e) => setForm({ ...form, ontvangerNaam: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                    placeholder="Jan de Vries"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Rol ontvanger</label>
                  <input
                    type="text"
                    value={form.ontvangerRol}
                    onChange={(e) => setForm({ ...form, ontvangerRol: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                    placeholder="Schoolleider"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Uw intentie (wat wilt u communiceren?)</label>
                <textarea
                  value={form.intentie}
                  onChange={(e) => setForm({ ...form, intentie: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm h-28 resize-none"
                  placeholder="Schrijf een mail aan de schoolleider over het aanhoudende personeelsverzuim, vraag om een gesprek volgende week en verwijs naar het protocol..."
                />
              </div>

              <button
                disabled={!form.intentie || !form.ontvangerNaam || generateDraft.isPending}
                onClick={() => generateDraft.mutate(form)}
                className="flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {generateDraft.isPending ? 'AI schrijft concept...' : 'Genereer Concept'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
