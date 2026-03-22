import { useQuery } from '@tanstack/react-query';
import { Grid3x3 } from 'lucide-react';
import api from '../../api/client';

interface SchoolOverviewRow {
  schoolId: string;
  schoolNaam: string;
  hrRisico: string;
  verzuimPct: number;
  compliancePct: number;
  openPdcaItems: number;
  openActies: number;
  openSubsidies: number;
  aankomendSubsidieDeadline: string | null;
  rag: 'ROOD' | 'ORANJE' | 'GROEN';
}

const RAG_COLORS: Record<string, string> = {
  ROOD: 'bg-red-500',
  ORANJE: 'bg-orange-400',
  GROEN: 'bg-green-500',
};

const HR_RISICO_COLORS: Record<string, string> = {
  STABIEL: 'text-green-600 bg-green-50',
  KWETSBAAR: 'text-orange-600 bg-orange-50',
  HOOG_RISICO: 'text-red-600 bg-red-50',
};

export default function SchoolOverviewPage() {
  const { data: rows = [], isLoading } = useQuery<SchoolOverviewRow[]>({
    queryKey: ['school-overview'],
    queryFn: () => api.get('/operations/school-overview').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center gap-3">
        <Grid3x3 className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Schooloverzicht</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">School</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">HR Risico</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Verzuim</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Compliance</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">PDCA</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Acties</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Subsidies</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.schoolId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.schoolNaam}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${HR_RISICO_COLORS[row.hrRisico] ?? ''}`}>
                    {row.hrRisico.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={row.verzuimPct > 7 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                    {row.verzuimPct}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${row.compliancePct >= 70 ? 'bg-green-500' : row.compliancePct >= 50 ? 'bg-orange-400' : 'bg-red-500'}`}
                        style={{ width: `${row.compliancePct}%` }}
                      />
                    </div>
                    <span className="text-gray-700">{row.compliancePct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{row.openPdcaItems}</td>
                <td className="px-4 py-3 text-gray-700">{row.openActies}</td>
                <td className="px-4 py-3">
                  <span className="text-gray-700">{row.openSubsidies}</span>
                  {row.aankomendSubsidieDeadline && (
                    <span className="ml-1 text-xs text-orange-500">
                      (deadline: {new Date(row.aankomendSubsidieDeadline).toLocaleDateString('nl-NL')})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className={`w-3 h-3 rounded-full ${RAG_COLORS[row.rag]}`} title={row.rag} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Geen scholen gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
