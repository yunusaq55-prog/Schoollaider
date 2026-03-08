import { useState, useEffect } from 'react';
import api from '../../api/client';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import {
  Euro,
  FolderOpen,
  FileUp,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface DashboardData {
  totaalOntvangen: number;
  lopendeSubsidies: number;
  inAanvraag: number;
  gemistPotentieel: number;
  pipeline: Record<string, number>;
  deadlines: {
    dossierId: string;
    naam: string;
    deadline: string;
    type: string;
  }[];
  verantwoordingsrisico: {
    dossierId: string;
    naam: string;
    voortgangPct: number;
    deadline: string;
  }[];
}

const kpiConfig = [
  { key: 'totaalOntvangen', label: 'Totaal Ontvangen', icon: Euro, color: 'text-emerald-600', bg: 'bg-emerald-50', format: (v: number) => `\u20AC ${v.toLocaleString('nl-NL')}` },
  { key: 'lopendeSubsidies', label: 'Lopende Subsidies', icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'inAanvraag', label: 'In Aanvraag', icon: FileUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'gemistPotentieel', label: 'Gemist Potentieel', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', format: (v: number) => `\u20AC ${v.toLocaleString('nl-NL')}` },
] as const;

const statusLabels: Record<string, string> = {
  GESIGNALEERD: 'Gesignaleerd',
  ORIENTATIE: 'Orientatie',
  AANVRAAG_IN_VOORBEREIDING: 'In voorbereiding',
  INGEDIEND: 'Ingediend',
  TOEGEKEND: 'Toegekend',
  LOPEND: 'Lopend',
  VERANTWOORDING_VEREIST: 'Verantwoording',
  VERANTWOORD: 'Verantwoord',
  AFGEROND: 'Afgerond',
  AFGEWEZEN: 'Afgewezen',
  INGETROKKEN: 'Ingetrokken',
};

const statusColors: Record<string, string> = {
  GESIGNALEERD: 'bg-gray-200',
  ORIENTATIE: 'bg-blue-400',
  AANVRAAG_IN_VOORBEREIDING: 'bg-indigo-400',
  INGEDIEND: 'bg-violet-400',
  TOEGEKEND: 'bg-emerald-400',
  LOPEND: 'bg-emerald-500',
  VERANTWOORDING_VEREIST: 'bg-amber-400',
  VERANTWOORD: 'bg-teal-400',
  AFGEROND: 'bg-gray-300',
  AFGEWEZEN: 'bg-red-400',
  INGETROKKEN: 'bg-gray-300',
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function deadlineColor(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 7) return 'text-red-600 bg-red-50';
  if (days < 14) return 'text-orange-600 bg-orange-50';
  return 'text-blue-600 bg-blue-50';
}

export function SubsidieDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await api.get('/subsidies/dashboard');
      setData(res.data);
    } catch (err: any) {
      console.error('[SubsidieDashboard] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  const pipeline = data?.pipeline ?? {};
  const totalPipeline = Object.values(pipeline).reduce((sum, v) => sum + v, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subsidie Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiConfig.map((kpi) => {
          const Icon = kpi.icon;
          const raw = data?.[kpi.key as keyof DashboardData] as number | undefined;
          const value = raw != null ? ('format' in kpi && kpi.format ? kpi.format(raw) : String(raw)) : '-';
          return (
            <div key={kpi.key} className="card p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-500">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Distribution */}
      {totalPipeline > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Pipeline Verdeling</h2>
          </div>
          <div className="px-6 py-5">
            <div className="mb-3 flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
              {Object.entries(pipeline).map(([status, count]) => (
                <div
                  key={status}
                  className={`${statusColors[status] ?? 'bg-gray-300'} transition-all`}
                  style={{ width: `${(count / totalPipeline) * 100}%` }}
                  title={`${statusLabels[status] ?? status}: ${count}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(pipeline).map(([status, count]) => (
                <div key={status} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColors[status] ?? 'bg-gray-300'}`} />
                  {statusLabels[status] ?? status} ({count})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Komende Deadlines (30 dagen)</h2>
            {(data?.deadlines?.length ?? 0) > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {data!.deadlines.length}
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {(!data?.deadlines || data.deadlines.length === 0) && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">Geen deadlines in de komende 30 dagen.</p>
            </div>
          )}
          {data?.deadlines?.map((dl) => {
            const days = daysUntil(dl.deadline);
            const colorClass = deadlineColor(dl.deadline);
            return (
              <div key={`${dl.dossierId}-${dl.type}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/50">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass.split(' ')[1]}`}>
                  <Clock className={`h-4 w-4 ${colorClass.split(' ')[0]}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{dl.naam}</p>
                  <p className="truncate text-xs text-gray-500">{dl.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
                    {days <= 0 ? 'Verlopen' : `${days} dagen`}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(dl.deadline).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Verantwoordingsrisico */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Verantwoordingsrisico</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {(!data?.verantwoordingsrisico || data.verantwoordingsrisico.length === 0) && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">Geen dossiers met verantwoordingsrisico.</p>
            </div>
          )}
          {data?.verantwoordingsrisico?.map((item) => {
            const days = daysUntil(item.deadline);
            return (
              <div key={item.dossierId} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.naam}</p>
                  <p className="text-xs text-gray-500">
                    Deadline: {new Date(item.deadline).toLocaleDateString('nl-NL')} ({days > 0 ? `${days} dagen` : 'Verlopen'})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-500">Voortgang</span>
                      <span className={`font-medium ${item.voortgangPct < 50 ? 'text-red-600' : item.voortgangPct < 75 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.voortgangPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${item.voortgangPct < 50 ? 'bg-red-500' : item.voortgangPct < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${item.voortgangPct}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
