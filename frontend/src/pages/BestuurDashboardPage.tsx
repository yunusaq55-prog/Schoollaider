import { useState, useEffect } from 'react';
import api from '../api/client';
import { useSchoolContext } from '../context/SchoolContext';
import { StatusBadge, RisicoBadge } from '../components/StatusBadge';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import {
  TrendingUp,
  AlertTriangle,
  FileX,
  RefreshCw,
  ShieldAlert,
  ArrowUpDown,
  ChevronRight,
  Bell,
  FileText,
  ClipboardList,
  BookOpen,
  Sparkles,
  Shield,
} from 'lucide-react';
import type { DashboardKPIs, SchoolOverviewRow, BewijsStatus, HrBestuurKPIs } from '@schoollaider/shared';
import { Users } from 'lucide-react';

interface Alert {
  type: string;
  schoolId: string;
  schoolNaam: string;
  message: string;
}

type SortKey = 'schoolNaam' | 'score' | 'veiligheid' | 'kwaliteit' | 'risico';

const kpiConfig = [
  { key: 'avgReadinessScore', label: 'Gem. Readiness', icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50', format: (v: number) => v.toFixed(1) },
  { key: 'schoolsBelowThreshold', label: 'Onder Drempel', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'missingDocuments', label: 'Ontbrekend', icon: FileX, color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'incompletePdcaCycles', label: 'Incomplete PDCA', icon: RefreshCw, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'outdatedPolicies', label: 'Verouderd Beleid', icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-50' },
] as const;

const alertIcons: Record<string, typeof Bell> = {
  missing_document: FileText,
  incomplete_pdca: ClipboardList,
  outdated_policy: BookOpen,
};

export function BestuurDashboardPage() {
  const { selectSchool } = useSchoolContext();

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [overview, setOverview] = useState<SchoolOverviewRow[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [complianceOverview, setComplianceOverview] = useState<any>(null);
  const [hrKpis, setHrKpis] = useState<HrBestuurKPIs | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [kpiRes, overviewRes, alertRes, complianceRes, hrKpisRes] = await Promise.all([
        api.get('/dashboard/bestuur/kpis'),
        api.get('/dashboard/bestuur/overview'),
        api.get('/dashboard/bestuur/alerts'),
        api.get('/dashboard/bestuur/compliance').catch(() => ({ data: null })),
        api.get('/hr/bestuur/kpis').catch(() => ({ data: null })),
      ]);
      setKpis(kpiRes.data);
      setOverview(Array.isArray(overviewRes.data) ? overviewRes.data : []);
      setAlerts(Array.isArray(alertRes.data) ? alertRes.data : []);
      setComplianceOverview(complianceRes.data);
      setHrKpis(hrKpisRes.data);
    } catch (err: any) {
      console.error('[BestuurDashboard] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function sortedOverview() {
    const statusOrder: Record<BewijsStatus, number> = { AANTOONBAAR: 3, ONVOLLEDIG: 2, ONTBREEKT: 1 };
    const riskOrder: Record<string, number> = { LAAG: 1, MIDDEN: 2, HOOG: 3 };

    return [...overview].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'schoolNaam':
          cmp = a.schoolNaam.localeCompare(b.schoolNaam);
          break;
        case 'score':
          cmp = a.score - b.score;
          break;
        case 'veiligheid':
          cmp = statusOrder[a.veiligheid] - statusOrder[b.veiligheid];
          break;
        case 'kwaliteit':
          cmp = statusOrder[a.kwaliteit] - statusOrder[b.kwaliteit];
          break;
        case 'risico':
          cmp = riskOrder[a.risico] - riskOrder[b.risico];
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bestuur Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiConfig.map((kpi) => {
          const Icon = kpi.icon;
          const raw = kpis?.[kpi.key as keyof DashboardKPIs];
          const value = raw != null ? ('format' in kpi ? kpi.format(raw as number) : String(raw)) : '-';
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

      {/* AI Compliance Overview */}
      {complianceOverview && complianceOverview.schools?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">AI Borgingsscore</h2>
                <p className="text-xs text-gray-500">Compliance per school op basis van AI-analyses</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${
              complianceOverview.gemiddeldScore >= 70 ? 'bg-emerald-50 text-emerald-700' :
              complianceOverview.gemiddeldScore >= 50 ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}>
              {complianceOverview.gemiddeldScore}% gemiddeld
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {complianceOverview.schools.map((s: any) => (
              <div key={s.schoolId} className="flex items-center gap-4 px-6 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <Shield className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.schoolNaam}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      {s.aantoonbaarPct}%
                    </span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      {s.onvolledigPct}%
                    </span>
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                      {s.ontbreektPct}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div className="flex h-full">
                      <div className="bg-emerald-500" style={{ width: `${s.aantoonbaarPct}%` }} />
                      <div className="bg-amber-400" style={{ width: `${s.onvolledigPct}%` }} />
                    </div>
                  </div>
                  <span className={`min-w-[3rem] rounded-full px-2 py-0.5 text-center text-xs font-bold ${
                    s.risico === 'LAAG' ? 'bg-emerald-50 text-emerald-700' :
                    s.risico === 'MIDDEN' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {s.overallScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* School Overview Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Scholenoverzicht</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {([
                  ['schoolNaam', 'School'],
                  ['score', 'Score'],
                  ['veiligheid', 'Veiligheid'],
                  ['kwaliteit', 'Kwaliteit'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <ArrowUpDown className={`h-3 w-3 ${sortKey === key ? 'text-primary-500' : 'text-gray-300'}`} />
                    </span>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  PDCA
                </th>
                <th
                  onClick={() => handleSort('risico')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
                >
                  <span className="inline-flex items-center gap-1">
                    Risico
                    <ArrowUpDown className={`h-3 w-3 ${sortKey === 'risico' ? 'text-primary-500' : 'text-gray-300'}`} />
                  </span>
                </th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {sortedOverview().map((row) => (
                <tr
                  key={row.schoolId}
                  onClick={() => selectSchool(row.schoolId)}
                  className="cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{row.schoolNaam}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`text-sm font-semibold ${
                      row.score >= 70 ? 'text-emerald-600' : row.score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {row.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={row.veiligheid} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={row.kwaliteit} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {row.pdcaComplete ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Compleet
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Incompleet
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <RisicoBadge risico={row.risico} />
                  </td>
                  <td className="px-3 py-4">
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </td>
                </tr>
              ))}
              {overview.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-400">Geen scholen gevonden.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HR Overview */}
      {hrKpis && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">HR Overzicht</h2>
                <p className="text-xs text-gray-500">Personeelsgegevens over alle scholen</p>
              </div>
            </div>
            <a href="/hr" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              Details &rarr;
            </a>
          </div>
          <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-4">
            {[
              { label: 'Gem. HR-score', value: hrKpis.gemHrScore, color: hrKpis.gemHrScore >= 70 ? 'text-emerald-700' : hrKpis.gemHrScore >= 50 ? 'text-amber-700' : 'text-red-700' },
              { label: 'Scholen hoog risico', value: hrKpis.scholenHoogRisico, color: hrKpis.scholenHoogRisico > 0 ? 'text-red-700' : 'text-emerald-700' },
              { label: 'Totaal vacatures', value: hrKpis.totaalVacatures, color: hrKpis.totaalVacatures > 5 ? 'text-red-700' : 'text-gray-700' },
              { label: 'Gem. verzuim', value: `${hrKpis.gemVerzuimPct}%`, color: hrKpis.gemVerzuimPct > 5.5 ? 'text-red-700' : 'text-gray-700' },
            ].map((item) => (
              <div key={item.label} className="bg-white p-5">
                <p className="text-xs font-medium text-gray-500">{item.label}</p>
                <p className={`mt-1 text-xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Alerts */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Risicomeldingen</h2>
            {alerts.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {alerts.length}
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {alerts.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">Geen risicomeldingen.</p>
            </div>
          )}
          {alerts.map((alert, idx) => {
            const AlertIcon = alertIcons[alert.type] ?? Bell;
            return (
              <div key={`${alert.schoolId}-${alert.type}-${idx}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <AlertIcon className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.schoolNaam}</p>
                  <p className="truncate text-xs text-gray-500">{alert.message}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {alert.type === 'missing_document' ? 'Document' : alert.type === 'incomplete_pdca' ? 'PDCA' : 'Beleid'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
