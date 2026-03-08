import { useState, useEffect } from 'react';
import api from '../../api/client';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  FolderPlus,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  Calendar,
  Euro,
} from 'lucide-react';

interface Dossier {
  id: string;
  naam: string;
  status: string;
  bedragToegewezen: number | null;
  besteedPct: number | null;
  deadline: string | null;
  beschrijving?: string;
  regelingNaam?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  GESIGNALEERD: { label: 'Gesignaleerd', color: 'bg-gray-100 text-gray-700' },
  ORIENTATIE: { label: 'Orientatie', color: 'bg-blue-50 text-blue-700' },
  AANVRAAG_IN_VOORBEREIDING: { label: 'In voorbereiding', color: 'bg-indigo-50 text-indigo-700' },
  INGEDIEND: { label: 'Ingediend', color: 'bg-violet-50 text-violet-700' },
  TOEGEKEND: { label: 'Toegekend', color: 'bg-emerald-50 text-emerald-700' },
  LOPEND: { label: 'Lopend', color: 'bg-emerald-50 text-emerald-700' },
  VERANTWOORDING_VEREIST: { label: 'Verantwoording', color: 'bg-amber-50 text-amber-700' },
  VERANTWOORD: { label: 'Verantwoord', color: 'bg-teal-50 text-teal-700' },
  AFGEROND: { label: 'Afgerond', color: 'bg-gray-100 text-gray-600' },
  AFGEWEZEN: { label: 'Afgewezen', color: 'bg-red-50 text-red-700' },
  INGETROKKEN: { label: 'Ingetrokken', color: 'bg-gray-100 text-gray-500' },
};

type SortKey = 'naam' | 'status' | 'bedragToegewezen' | 'besteedPct' | 'deadline';

export function SubsidieDossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newNaam, setNewNaam] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDossiers();
  }, []);

  async function fetchDossiers() {
    try {
      const res = await api.get('/subsidies/dossiers');
      setDossiers(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('[SubsidieDossiers] Data ophalen mislukt:', err?.message);
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

  function sortedDossiers() {
    return [...dossiers].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'naam':
          cmp = a.naam.localeCompare(b.naam);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'bedragToegewezen':
          cmp = (a.bedragToegewezen ?? 0) - (b.bedragToegewezen ?? 0);
          break;
        case 'besteedPct':
          cmp = (a.besteedPct ?? 0) - (b.besteedPct ?? 0);
          break;
        case 'deadline':
          cmp = (a.deadline ?? '').localeCompare(b.deadline ?? '');
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }

  async function handleCreate() {
    if (!newNaam.trim()) return;
    setCreating(true);
    try {
      await api.post('/subsidies/dossiers', { naam: newNaam.trim() });
      setNewNaam('');
      setShowNewForm(false);
      await fetchDossiers();
    } catch (err: any) {
      console.error('[SubsidieDossiers] Dossier aanmaken mislukt:', err?.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <TableSkeleton rows={8} cols={6} />;

  const columns: [SortKey, string][] = [
    ['naam', 'Naam'],
    ['status', 'Status'],
    ['bedragToegewezen', 'Bedrag Toegekend'],
    ['besteedPct', 'Besteed %'],
    ['deadline', 'Deadline'],
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subsidie Dossiers</h1>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <FolderPlus className="h-4 w-4" />
          Nieuw dossier
        </button>
      </div>

      {/* New Dossier Form */}
      {showNewForm && (
        <div className="card px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-700">Dossiernaam</label>
              <input
                type="text"
                value={newNaam}
                onChange={(e) => setNewNaam(e.target.value)}
                placeholder="Voer een naam in..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !newNaam.trim()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Bezig...' : 'Aanmaken'}
            </button>
            <button
              onClick={() => { setShowNewForm(false); setNewNaam(''); }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Dossiers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="w-8 px-3 py-3" />
                {columns.map(([key, label]) => (
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
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {sortedDossiers().length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-400">Geen dossiers gevonden.</p>
                  </td>
                </tr>
              )}
              {sortedDossiers().map((d) => {
                const config = statusConfig[d.status] ?? { label: d.status, color: 'bg-gray-100 text-gray-600' };
                const isExpanded = expandedId === d.id;
                return (
                  <tr key={d.id} className="group">
                    <td colSpan={7} className="p-0">
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : d.id)}
                        className="flex cursor-pointer items-center border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-3 py-4">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{d.naam}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                            <Euro className="h-3 w-3 text-gray-400" />
                            {d.bedragToegewezen != null ? d.bedragToegewezen.toLocaleString('nl-NL') : '-'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {d.besteedPct != null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full rounded-full ${d.besteedPct > 90 ? 'bg-red-500' : d.besteedPct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(d.besteedPct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">{d.besteedPct}%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {d.deadline ? (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {new Date(d.deadline).toLocaleDateString('nl-NL')}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4" />
                      </div>
                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="border-b border-gray-100 bg-gray-50/30 px-10 py-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Regeling</p>
                              <p className="text-sm text-gray-900">{d.regelingNaam ?? '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Beschrijving</p>
                              <p className="text-sm text-gray-900">{d.beschrijving ?? 'Geen beschrijving.'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
