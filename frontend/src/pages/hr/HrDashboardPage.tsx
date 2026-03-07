import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { HrSchoolOverview, HrRisico } from '@schoollaider/shared';

const RISICO_COLORS: Record<HrRisico, string> = {
  STABIEL: 'bg-green-100 text-green-700',
  KWETSBAAR: 'bg-yellow-100 text-yellow-700',
  HOOG_RISICO: 'bg-red-100 text-red-700',
};

const RISICO_LABELS: Record<HrRisico, string> = {
  STABIEL: 'Stabiel',
  KWETSBAAR: 'Kwetsbaar',
  HOOG_RISICO: 'Hoog risico',
};

export function HrDashboardPage() {
  const [overview, setOverview] = useState<HrSchoolOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hr/overview')
      .then(({ data }) => setOverview(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gemScore = overview.length > 0
    ? Math.round(overview.reduce((s, o) => s + o.hrScore, 0) / overview.length)
    : 0;
  const hoogRisico = overview.filter((o) => o.risico === 'HOOG_RISICO').length;
  const totaalSignalen = overview.reduce((s, o) => s + o.openSignalen, 0);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-gray-200" />)}
    </div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overzicht personeelsdata per school</p>

      {/* KPI's */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Gem. HR Score</h3>
          <p className="mt-1 text-3xl font-bold text-gray-900">{gemScore}</p>
          <p className="text-xs text-gray-400">van 100</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Scholen hoog risico</h3>
          <p className={`mt-1 text-3xl font-bold ${hoogRisico > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {hoogRisico}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Open signalen</h3>
          <p className="mt-1 text-3xl font-bold text-gray-900">{totaalSignalen}</p>
        </div>
      </div>

      {/* School overzicht tabel */}
      {overview.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">HR Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Formatie</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Verzuim %</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vervanging</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Risico</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Signalen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {overview.map((row) => (
                <tr key={row.schoolId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.schoolNaam}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${row.hrScore >= 70 ? 'bg-green-500' : row.hrScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${row.hrScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">{row.hrScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.formatieScore}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.verzuimPct}%</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.vervangingsIndex}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RISICO_COLORS[row.risico]}`}>
                      {RISICO_LABELS[row.risico]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.openSignalen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Nog geen HR data ingevoerd</p>
          <p className="mt-1 text-sm text-gray-400">Ga naar Formatie of Verzuim om data in te voeren</p>
        </div>
      )}
    </div>
  );
}
