import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/client';

interface AgendaItem {
  volgorde: number;
  titel: string;
  toelichting: string;
  type: string;
  verantwoordelijke: string;
  duurMinuten: number;
}

interface AgendaResult {
  items: AgendaItem[];
  totaalDuurMinuten: number;
  samenvatting: string;
}

interface Vergadering {
  id: string;
  titel: string;
  datum: string;
  locatie: string;
  status: 'CONCEPT' | 'DEFINITIEF' | 'AFGEROND';
  aiGegenereerd: boolean;
  agendaJson: AgendaResult | null;
  creator: { naam: string };
}

const TYPE_BADGES: Record<string, string> = {
  besluitvorming: 'bg-blue-100 text-blue-700',
  informatie: 'bg-gray-100 text-gray-700',
  actie: 'bg-orange-100 text-orange-700',
  rondvraag: 'bg-purple-100 text-purple-700',
};

export default function VergaderingenPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ titel: '', datum: '', locatie: '' });

  const { data: vergaderingen = [], isLoading } = useQuery<Vergadering[]>({
    queryKey: ['vergaderingen'],
    queryFn: () => api.get('/operations/vergaderingen').then((r) => r.data),
  });

  const createVergadering = useMutation({
    mutationFn: (data: object) => api.post('/operations/vergaderingen', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vergaderingen'] });
      setShowNew(false);
      setNewForm({ titel: '', datum: '', locatie: '' });
    },
  });

  const generateAgenda = useMutation({
    mutationFn: (id: string) =>
      api.post(`/operations/vergaderingen/${id}/agenda`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vergaderingen'] }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Vergaderingen</h1>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nieuwe Vergadering
        </button>
      </div>

      <div className="space-y-3">
        {vergaderingen.map((v) => (
          <div key={v.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === v.id ? null : v.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{v.titel}</span>
                  {v.aiGegenereerd && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI-agenda
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(v.datum).toLocaleDateString('nl-NL', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                  {v.locatie && ` · ${v.locatie}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    generateAgenda.mutate(v.id);
                  }}
                  disabled={generateAgenda.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  {generateAgenda.isPending ? 'Genereren...' : 'Genereer Agenda'}
                </button>
                {expanded === v.id ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            {expanded === v.id && v.agendaJson && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {v.agendaJson.samenvatting && (
                  <p className="text-sm text-gray-600 mb-3 italic">{v.agendaJson.samenvatting}</p>
                )}
                <div className="space-y-2">
                  {v.agendaJson.items.map((item) => (
                    <div key={item.volgorde} className="flex items-start gap-3 bg-white rounded p-3 border border-gray-100">
                      <span className="text-sm font-bold text-gray-400 w-5 flex-shrink-0">
                        {item.volgorde}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900">{item.titel}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${TYPE_BADGES[item.type] ?? 'bg-gray-100 text-gray-700'}`}>
                            {item.type}
                          </span>
                          <span className="text-xs text-gray-400">{item.duurMinuten} min</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.toelichting}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Verantwoordelijke: {item.verantwoordelijke}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">
                  Totaal: {v.agendaJson.totaalDuurMinuten} minuten
                </p>
              </div>
            )}
          </div>
        ))}

        {vergaderingen.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CalendarDays className="h-12 w-12 mx-auto mb-3" />
            <p>Nog geen vergaderingen gepland.</p>
          </div>
        )}
      </div>

      {/* New vergadering modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Nieuwe Vergadering</h2>
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
                  placeholder="Bestuursvergadering Q1..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Datum</label>
                <input
                  type="datetime-local"
                  value={newForm.datum}
                  onChange={(e) => setNewForm({ ...newForm, datum: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Locatie</label>
                <input
                  type="text"
                  value={newForm.locatie}
                  onChange={(e) => setNewForm({ ...newForm, locatie: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Bestuurskantoor..."
                />
              </div>
              <button
                disabled={!newForm.titel || !newForm.datum || createVergadering.isPending}
                onClick={() => createVergadering.mutate({ ...newForm, datum: new Date(newForm.datum).toISOString() })}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createVergadering.isPending ? 'Aanmaken...' : 'Aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
