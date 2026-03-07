import { useState, useEffect } from 'react';
import api from '../api/client';
import { useSchoolContext } from '../context/SchoolContext';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import {
  Gauge,
  Download,
  BarChart3,
  CheckCircle2,
  Circle,
  Building2,
  PieChart,
  Sparkles,
} from 'lucide-react';
import type { ReadinessScore } from '@schoollaider/shared';

interface GapSummary {
  aantoonbaar: number;
  onvolledig: number;
  ontbreekt: number;
}

interface PdcaCycleStatus {
  plan: boolean;
  do: boolean;
  check: boolean;
  act: boolean;
}

export function SchoolDashboardPage() {
  const { selectedSchoolId, selectedSchool } = useSchoolContext();

  const [score, setScore] = useState<ReadinessScore | null>(null);
  const [gaps, setGaps] = useState<GapSummary | null>(null);
  const [pdca, setPdca] = useState<PdcaCycleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [complianceData, setComplianceData] = useState<any>(null);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchData();
    }
  }, [selectedSchoolId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [scoreRes, gapsRes, complianceRes] = await Promise.all([
        api.get(`/dashboard/school/${selectedSchoolId}/score`),
        api.get(`/dashboard/school/${selectedSchoolId}/gaps`),
        api.get(`/dashboard/school/${selectedSchoolId}/compliance`).catch(() => ({ data: null })),
      ]);
      setComplianceData(complianceRes.data);
      setScore(scoreRes.data.score ?? null);
      setGaps(gapsRes.data.gaps ?? null);
      setPdca(gapsRes.data.pdca ?? null);
    } catch (err: any) {
      console.error('[SchoolDashboard] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!selectedSchoolId) return;
    setExporting(true);
    try {
      const response = await api.get(`/export/school/${selectedSchoolId}/inspectiedossier`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inspectiedossier-${selectedSchool?.naam ?? selectedSchoolId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('[SchoolDashboard] Export mislukt:', err?.message);
    } finally {
      setExporting(false);
    }
  }

  function scoreGradient(value: number) {
    if (value >= 70) return { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    if (value >= 50) return { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' };
    return { ring: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700' };
  }

  if (!selectedSchoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <Building2 className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">Geen school geselecteerd</p>
        <p className="mt-1 text-sm text-gray-500">Selecteer een school om het dashboard te bekijken.</p>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  const domainEntries = score?.domainScores ? Object.entries(score.domainScores) : [];
  const pdcaPhases: { key: keyof PdcaCycleStatus; label: string }[] = [
    { key: 'plan', label: 'Plan' },
    { key: 'do', label: 'Do' },
    { key: 'check', label: 'Check' },
    { key: 'act', label: 'Act' },
  ];

  const colors = score ? scoreGradient(score.totalScore) : null;
  const circumference = 2 * Math.PI * 54;
  const progress = score ? (score.totalScore / 100) * circumference : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {selectedSchool?.naam ?? 'School'} Dashboard
        </h1>
        <button onClick={handleExport} disabled={exporting} className="btn-primary">
          <Download className="h-4 w-4" />
          {exporting ? 'Exporteren...' : 'Inspectiedossier'}
        </button>
      </div>

      {/* Score + Gap Analysis row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Readiness Score Ring */}
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
                {score ? score.totalScore.toFixed(0) : '-'}
              </span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Readiness Score</span>
          </div>
          {score && (
            <p className="mt-1 text-xs text-gray-400">
              {new Date(score.berekendOp).toLocaleDateString('nl-NL')}
            </p>
          )}
        </div>

        {/* Gap Analysis */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Gap Analyse</h2>
          </div>
          {gaps ? (
            <div className="space-y-3">
              {[
                { label: 'Aantoonbaar', value: gaps.aantoonbaar, dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                { label: 'Onvolledig', value: gaps.onvolledig, dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
                { label: 'Ontbreekt', value: gaps.ontbreekt, dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between rounded-lg px-4 py-3 ${item.bg}`}>
                  <span className={`inline-flex items-center gap-2 text-sm font-medium ${item.text}`}>
                    <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                    {item.label}
                  </span>
                  <span className={`text-lg font-bold ${item.text}`}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Geen data beschikbaar.</p>
          )}
        </div>

        {/* PDCA Cycle */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">PDCA Cyclus</h2>
          </div>
          {pdca ? (
            <div className="space-y-3">
              {pdcaPhases.map((phase) => {
                const complete = pdca[phase.key];
                return (
                  <div
                    key={phase.key}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                      complete
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {complete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                    <span className={`text-sm font-medium ${complete ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {phase.label}
                    </span>
                    <span className={`ml-auto text-xs ${complete ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {complete ? 'Afgerond' : 'Incompleet'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Geen data beschikbaar.</p>
          )}
        </div>
      </div>

      {/* AI Compliance Score */}
      {complianceData && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">AI Borgingsscore</h2>
                <p className="text-xs text-gray-500">
                  {complianceData.aantoonbaarCount} aantoonbaar · {complianceData.onvolledigCount} onvolledig · {complianceData.ontbreektCount} ontbreekt
                </p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-lg font-bold ${
              complianceData.overallScore >= 70 ? 'bg-emerald-50 text-emerald-700' :
              complianceData.overallScore >= 50 ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}>
              {complianceData.overallScore}%
            </span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-5 gap-3">
              {complianceData.domeinen?.map((d: any) => (
                <div key={d.code} className="rounded-lg border border-gray-100 p-3 text-center">
                  <p className="text-xs font-semibold text-gray-500">{d.code}</p>
                  <p className={`text-xl font-bold ${
                    d.domeinScore >= 70 ? 'text-emerald-600' :
                    d.domeinScore >= 50 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>{d.domeinScore}%</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">{d.naam}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Domain Scores */}
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Domeinscores</h2>
        </div>
        {domainEntries.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Geen domeinscores beschikbaar.</p>
        ) : (
          <div className="space-y-4">
            {domainEntries.map(([domain, value]) => {
              const g = scoreGradient(value);
              return (
                <div key={domain}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{domain}</span>
                    <span className={`text-sm font-semibold ${g.text}`}>{value.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
