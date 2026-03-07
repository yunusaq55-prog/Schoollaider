import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useSchoolContext } from '../../context/SchoolContext';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { HrRisicoBadge, hrScoreColor, trendIcon } from '../../components/HrRisicoBadge';
import { Building2, Users, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import type { HrRisicoScore, HrSignaal, HrBestuurKPIs, HrSchoolOverviewRow } from '@schoollaider/shared';

export function HrDashboardPage() {
  const { selectedSchoolId, selectedSchool, isBestuurView } = useSchoolContext();

  if (isBestuurView || !selectedSchoolId) {
    return <HrBestuurDashboard />;
  }

  return <HrSchoolDashboard schoolId={selectedSchoolId} schoolNaam={selectedSchool?.naam ?? 'School'} />;
}

// ─── School-level HR Dashboard ───────────────────────────────

function HrSchoolDashboard({ schoolId, schoolNaam }: { schoolId: string; schoolNaam: string }) {
  const [score, setScore] = useState<HrRisicoScore | null>(null);
  const [signalen, setSignalen] = useState<HrSignaal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [scoreRes, signalenRes] = await Promise.all([
        api.get(`/hr/school/${schoolId}/score`),
        api.get(`/hr/school/${schoolId}/signalen`),
      ]);
      setScore(scoreRes.data);
      setSignalen(signalenRes.data);
    } catch (err: any) {
      console.error('[HrDashboard] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  const colors = score ? hrScoreColor(score.hrScore) : null;
  const circumference = 2 * Math.PI * 54;
  const progress = score ? (score.hrScore / 100) * circumference : 0;

  const deelScores = score
    ? [
        { label: 'Formatie', value: score.formatieScore },
        { label: 'Verzuim', value: score.verzuimScore },
        { label: 'Vervanging', value: score.vervangingsScore },
        { label: 'Leeftijd', value: score.leeftijdScore },
      ]
    : [];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        HR Dashboard — {schoolNaam}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* HR Score Ring */}
        <div className="card flex flex-col items-center p-8">
          <div className="relative mb-4">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                className={`transition-all duration-1000 ease-out ${colors?.ring ?? 'text-gray-300'}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${colors?.text ?? 'text-gray-400'}`}>
                {score ? score.hrScore : '-'}
              </span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">HR Score</span>
          </div>
          {score && (
            <div className="mt-2 flex items-center gap-2">
              <HrRisicoBadge risico={score.risico} />
              <span className={`text-xs font-medium ${trendIcon(score.trend).color}`}>
                {trendIcon(score.trend).icon} {trendIcon(score.trend).label}
              </span>
            </div>
          )}
        </div>

        {/* Deelscores */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Deelscores</h2>
          <div className="space-y-4">
            {deelScores.map((ds) => {
              const g = hrScoreColor(ds.value);
              return (
                <div key={ds.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{ds.label}</span>
                    <span className={`text-sm font-semibold ${g.text}`}>{ds.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        ds.value >= 70 ? 'bg-emerald-500' : ds.value >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(ds.value, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signalen */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Openstaande signalen</h2>
            <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {signalen.filter((s) => s.status !== 'AFGEHANDELD').length}
            </span>
          </div>
          {signalen.filter((s) => s.status !== 'AFGEHANDELD').length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Geen openstaande signalen.</p>
          ) : (
            <div className="space-y-2">
              {signalen
                .filter((s) => s.status !== 'AFGEHANDELD')
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="rounded-lg border border-gray-100 px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{s.titel}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{s.aanbevolenActie}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bestuur-level HR Dashboard ──────────────────────────────

function HrBestuurDashboard() {
  const [kpis, setKpis] = useState<HrBestuurKPIs | null>(null);
  const [overview, setOverview] = useState<HrSchoolOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [kpisRes, overviewRes] = await Promise.all([
        api.get('/hr/bestuur/kpis'),
        api.get('/hr/bestuur/overview'),
      ]);
      setKpis(kpisRes.data);
      setOverview(overviewRes.data);
    } catch (err: any) {
      console.error('[HrBestuurDashboard] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  const kpiCards = kpis
    ? [
        { label: 'Gem. HR-score', value: kpis.gemHrScore, suffix: '', color: hrScoreColor(kpis.gemHrScore) },
        { label: 'Scholen hoog risico', value: kpis.scholenHoogRisico, suffix: '', color: kpis.scholenHoogRisico > 0 ? hrScoreColor(0) : hrScoreColor(100) },
        { label: 'Totaal vacatures', value: kpis.totaalVacatures, suffix: '', color: hrScoreColor(kpis.totaalVacatures > 5 ? 30 : 80) },
        { label: 'Gem. verzuim', value: kpis.gemVerzuimPct, suffix: '%', color: hrScoreColor(kpis.gemVerzuimPct > 5.5 ? 30 : 80) },
      ]
    : [];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">HR Overzicht</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold ${kpi.color.text}`}>
              {kpi.value}{kpi.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* School overview table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Scholen HR-overzicht</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 font-medium text-gray-500">School</th>
                <th className="px-4 py-3 font-medium text-gray-500">HR-score</th>
                <th className="px-4 py-3 font-medium text-gray-500">Formatie</th>
                <th className="px-4 py-3 font-medium text-gray-500">Verzuim</th>
                <th className="px-4 py-3 font-medium text-gray-500">Vervanging</th>
                <th className="px-4 py-3 font-medium text-gray-500">Risico</th>
                <th className="px-4 py-3 font-medium text-gray-500">Trend</th>
                <th className="px-4 py-3 font-medium text-gray-500">Signalen</th>
              </tr>
            </thead>
            <tbody>
              {overview.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <Building2 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    Nog geen HR-data ingevoerd.
                  </td>
                </tr>
              ) : (
                overview.map((row) => {
                  const t = trendIcon(row.trend);
                  return (
                    <tr key={row.schoolId} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-medium text-gray-900">{row.schoolNaam}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${hrScoreColor(row.hrScore).text}`}>{row.hrScore}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.formatieScore}</td>
                      <td className="px-4 py-3 text-gray-600">{row.verzuimPct}%</td>
                      <td className="px-4 py-3 text-gray-600">{row.vervangingsIndex}</td>
                      <td className="px-4 py-3"><HrRisicoBadge risico={row.risico} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${t.color}`}>{t.icon} {t.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {row.openSignalen > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {row.openSignalen}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
