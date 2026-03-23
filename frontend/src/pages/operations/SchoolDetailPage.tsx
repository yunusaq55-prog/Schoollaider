import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Users,
  TrendingDown,
  ClipboardCheck,
  Briefcase,
  Coins,
} from 'lucide-react';
import api from '../../api/client';

interface SchoolDetail {
  schoolId: string;
  schoolNaam: string;
  rag: 'ROOD' | 'ORANJE' | 'GROEN';
  verzuimPct: number;
  compliancePct: number;
  openActies: number;
  openPdcaItems: number;
  hrSignalen: Array<{ id: string; titel: string; type: string; status: string }>;
  opsSignalen: Array<{ id: string; titel: string; type: string; severity: string; beschrijving: string }>;
  acties: Array<{ id: string; titel: string; prioriteit: string; status: string; deadline: string | null }>;
  complianceDomeinen: Array<{ domeinCode: string; domeinNaam: string; aantoonbaar: number; total: number }>;
  subsidieDeadlines: Array<{ naam: string; deadline: string; status: string }>;
}

const RAG_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  ROOD:   { dot: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  ORANJE: { dot: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  GROEN:  { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
};

const PRIORITEIT_BORDER: Record<string, string> = {
  KRITIEK: 'border-l-red-500',
  HOOG: 'border-l-orange-400',
  MIDDEL: 'border-l-yellow-400',
  LAAG: 'border-l-gray-300',
};

const ACTIE_STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  IN_BEHANDELING: 'In behandeling',
};

export default function SchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [oplosLoading, setOplosLoading] = useState<string | null>(null);
  const [opgelostIds, setOpgelostIds] = useState<Set<string>>(new Set());
  const [actieLoading, setActieLoading] = useState<string | null>(null);
  const [actieResults, setActieResults] = useState<Set<string>>(new Set());

  const { data: detail, isLoading, error } = useQuery<SchoolDetail>({
    queryKey: ['school-detail', schoolId],
    queryFn: () => api.get(`/operations/school/${schoolId}/detail`).then((r) => r.data),
    enabled: !!schoolId,
  });

  async function oplosSignaal(signaalId: string) {
    setOplosLoading(signaalId);
    try {
      await api.patch(`/operations/signalen/${signaalId}`, { opgelost: true });
      setOpgelostIds((prev) => new Set([...prev, signaalId]));
      queryClient.invalidateQueries({ queryKey: ['school-detail', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    } finally {
      setOplosLoading(null);
    }
  }

  async function maakActie(signaalId: string, signaalType: string) {
    setActieLoading(signaalId);
    try {
      await api.post('/operations/acties/from-signaal', { signaalId, signaalType });
      setActieResults((prev) => new Set([...prev, signaalId]));
      queryClient.invalidateQueries({ queryKey: ['acties'] });
    } finally {
      setActieLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          School kon niet worden geladen.
        </div>
      </div>
    );
  }

  const rag = RAG_STYLES[detail.rag];
  const allSignalen = [
    ...detail.opsSignalen.map((s) => ({ ...s, bron: 'Operationeel' as const, signaalType: 'OpsSignaal' })),
    ...detail.hrSignalen.map((s) => ({ ...s, bron: 'HR' as const, severity: s.status, beschrijving: '', signaalType: 'HrSignaal' })),
  ].sort((a, b) => (a.severity === 'URGENT' || a.severity === 'KRITIEK' ? -1 : 1));

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/operations/scholen')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Schooloverzicht
        </button>

        <div className={`flex items-center gap-3 p-4 rounded-lg border ${rag.bg}`}>
          <div className={`w-4 h-4 rounded-full flex-shrink-0 ${rag.dot}`} />
          <h1 className={`text-2xl font-bold ${rag.text}`}>{detail.schoolNaam}</h1>
          <span className={`ml-auto text-sm font-medium ${rag.text}`}>{detail.rag}</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">Verzuim</span>
          </div>
          <div className={`text-2xl font-bold ${detail.verzuimPct > 7 ? 'text-red-600' : 'text-gray-800'}`}>
            {detail.verzuimPct}%
          </div>
          {detail.verzuimPct > 7 && (
            <div className="text-xs text-red-500 mt-0.5">Boven drempel (7%)</div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">Compliance</span>
          </div>
          <div className={`text-2xl font-bold ${detail.compliancePct >= 70 ? 'text-green-600' : detail.compliancePct >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
            {detail.compliancePct}%
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">Open Acties</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{detail.openActies}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">Open PDCA</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{detail.openPdcaItems}</div>
        </div>
      </div>

      {/* Actieve signalen */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Actieve signalen</h2>
          <span className="ml-auto text-xs text-gray-400">{allSignalen.length} signalen</span>
        </div>
        {allSignalen.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
            Geen openstaande signalen
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allSignalen.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                {(s.severity === 'URGENT' || s.severity === 'HOOG_RISICO') ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      s.bron === 'Operationeel' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {s.bron}
                    </span>
                    <span className="text-xs text-gray-400">{s.type}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{s.titel}</p>
                  {s.beschrijving && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{s.beschrijving}</p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {opgelostIds.has(s.id) || actieResults.has(s.id) ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {opgelostIds.has(s.id) ? 'Opgelost' : 'Actie aangemaakt'}
                    </span>
                  ) : (
                    <>
                      {s.bron === 'Operationeel' && (
                        <button
                          onClick={() => oplosSignaal(s.id)}
                          disabled={oplosLoading === s.id}
                          className="text-xs px-2.5 py-1 border border-teal-500 text-teal-700 rounded hover:bg-teal-50 disabled:opacity-50"
                        >
                          {oplosLoading === s.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Oplossen'}
                        </button>
                      )}
                      <button
                        onClick={() => maakActie(s.id, s.signaalType)}
                        disabled={actieLoading === s.id}
                        className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actieLoading === s.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Maak Actie'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open acties */}
      {detail.acties.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Open acties</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {detail.acties.map((a) => (
              <div key={a.id} className={`px-4 py-3 border-l-4 ${PRIORITEIT_BORDER[a.prioriteit] ?? 'border-l-gray-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{a.titel}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">{ACTIE_STATUS_LABEL[a.status] ?? a.status}</span>
                    {a.deadline && (
                      <span className="text-xs text-orange-500">
                        {new Date(a.deadline).toLocaleDateString('nl-NL')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance per domein */}
      {detail.complianceDomeinen.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Compliance per domein</h2>
          </div>
          <div className="px-4 py-3 space-y-3">
            {detail.complianceDomeinen.map((d) => {
              const pct = d.total ? Math.round((d.aantoonbaar / d.total) * 100) : 0;
              return (
                <div key={d.domeinCode}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {d.domeinCode} – {d.domeinNaam}
                    </span>
                    <span className="text-xs text-gray-500">{d.aantoonbaar}/{d.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-orange-400' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subsidie deadlines */}
      {detail.subsidieDeadlines.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Coins className="h-4 w-4 text-purple-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Subsidie deadlines</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {detail.subsidieDeadlines.map((d, i) => {
              const daysLeft = Math.ceil(
                (new Date(d.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.naam}</p>
                    <p className="text-xs text-gray-500">{d.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(d.deadline).toLocaleDateString('nl-NL')}
                    </p>
                    <p className={`text-xs font-medium ${daysLeft < 14 ? 'text-red-500' : daysLeft < 30 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {daysLeft > 0 ? `nog ${daysLeft} dagen` : 'verlopen'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
