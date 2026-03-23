import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sun, RefreshCw, AlertTriangle, ChevronRight, Zap, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/client';

interface MorningBriefItem {
  prioriteit: 'KRITIEK' | 'HOOG' | 'MIDDEL' | 'LAAG';
  titel: string;
  schoolNaam: string;
  actie: string;
  kanSluitenVandaag: boolean;
  bron: string;
  signaalId: string;
  signaalType: string;
}

interface MorningBrief {
  datum: string;
  samenvatting: string;
  aantalKritiek: number;
  aantalHoog: number;
  items: MorningBriefItem[];
  kanVandaagAfsluiten: string[];
}

const PRIORITEIT_COLORS: Record<string, string> = {
  KRITIEK: 'bg-red-100 text-red-700 border-red-200',
  HOOG: 'bg-orange-100 text-orange-700 border-orange-200',
  MIDDEL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LAAG: 'bg-green-100 text-green-700 border-green-200',
};

const BRON_COLORS: Record<string, string> = {
  HR: 'bg-blue-100 text-blue-700',
  Subsidie: 'bg-purple-100 text-purple-700',
  PDCA: 'bg-indigo-100 text-indigo-700',
  Compliance: 'bg-gray-100 text-gray-700',
  Operationeel: 'bg-teal-100 text-teal-700',
};

function PrioriteitBadge({ prioriteit }: { prioriteit: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${PRIORITEIT_COLORS[prioriteit] ?? 'bg-gray-100 text-gray-700'}`}>
      {prioriteit}
    </span>
  );
}

function BronBadge({ bron }: { bron: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${BRON_COLORS[bron] ?? 'bg-gray-100 text-gray-700'}`}>
      {bron}
    </span>
  );
}

export default function OperationsDashboardPage() {
  const queryClient = useQueryClient();
  const [actieLoading, setActieLoading] = useState<string | null>(null);
  const [actieResult, setActieResult] = useState<{ signaalId: string; actie: object } | null>(null);
  const [opgelostIds, setOpgelostIds] = useState<Set<string>>(new Set());

  const { data: brief, isLoading, error } = useQuery<MorningBrief>({
    queryKey: ['morning-brief'],
    queryFn: () => api.get('/operations/morning-brief').then((r) => r.data),
  });

  const regenerate = useMutation({
    mutationFn: () => api.post('/operations/morning-brief/regenerate').then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['morning-brief'] }),
  });

  async function maakActie(signaalId: string, signaalType: string) {
    setActieLoading(signaalId);
    try {
      const { data } = await api.post('/operations/acties/from-signaal', { signaalId, signaalType });
      setActieResult({ signaalId, actie: data });
      queryClient.invalidateQueries({ queryKey: ['acties'] });
    } finally {
      setActieLoading(null);
    }
  }

  async function oplosSignaal(signaalId: string) {
    setActieLoading(signaalId);
    try {
      await api.patch(`/operations/signalen/${signaalId}`, { opgelost: true });
      setOpgelostIds((prev) => new Set([...prev, signaalId]));
      queryClient.invalidateQueries({ queryKey: ['morning-brief'] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    } finally {
      setActieLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Kon de Morning Brief niet laden. Controleer of de backend draait en probeer opnieuw.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="h-7 w-7 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Morning Brief</h1>
            <p className="text-sm text-gray-500">{brief?.datum}</p>
          </div>
        </div>
        <button
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${regenerate.isPending ? 'animate-spin' : ''}`} />
          Regenereer
        </button>
      </div>

      {/* Executive Summary */}
      {brief?.samenvatting && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900 leading-relaxed">{brief.samenvatting}</p>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{brief?.aantalKritiek ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Kritieke signalen</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-500">{brief?.aantalHoog ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Hoge prioriteit</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-700">{brief?.items.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Totaal signalen</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{brief?.kanVandaagAfsluiten.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Vandaag afsluitbaar</div>
        </div>
      </div>

      {/* Signal list */}
      {brief && brief.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium">Geen openstaande signalen</p>
          <p className="text-sm">Alles is onder controle.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {brief?.items.map((item) => (
            <div
              key={item.signaalId}
              className={`bg-white border rounded-lg p-4 flex items-start gap-4 ${
                item.prioriteit === 'KRITIEK' ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              {item.prioriteit === 'KRITIEK' && (
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              {item.prioriteit === 'HOOG' && (
                <Zap className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              )}
              {(item.prioriteit === 'MIDDEL' || item.prioriteit === 'LAAG') && (
                <Clock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <PrioriteitBadge prioriteit={item.prioriteit} />
                  <BronBadge bron={item.bron} />
                  <span className="text-xs text-gray-500">{item.schoolNaam}</span>
                  {item.kanSluitenVandaag && (
                    <span className="text-xs text-green-600 font-medium">✓ Vandaag afsluitbaar</span>
                  )}
                </div>
                <p className="font-medium text-gray-900 text-sm">{item.titel}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.actie}</p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                {opgelostIds.has(item.signaalId) ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Opgelost
                  </span>
                ) : actieResult?.signaalId === item.signaalId ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Actie aangemaakt
                  </span>
                ) : (
                  <>
                    {item.bron === 'Operationeel' && (
                      <button
                        onClick={() => oplosSignaal(item.signaalId)}
                        disabled={actieLoading === item.signaalId}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-teal-500 text-teal-700 rounded-lg hover:bg-teal-50 disabled:opacity-50"
                      >
                        {actieLoading === item.signaalId ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        Oplossen
                      </button>
                    )}
                    <button
                      onClick={() => maakActie(item.signaalId, item.signaalType)}
                      disabled={actieLoading === item.signaalId}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actieLoading === item.signaalId ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      Maak Actie
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
