import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import {
  Search,
  Filter,
  Sparkles,
  Calendar,
  Euro,
  Tag,
  X,
  FolderPlus,
} from 'lucide-react';

interface Regeling {
  id: string;
  naam: string;
  financier: string;
  minBedrag: number | null;
  maxBedrag: number | null;
  aanvraagPeriodeSluiting: string | null;
  tags: string[];
  beschrijving: string;
  vereisten: string | null;
  createdAt: string;
}

interface Match {
  subsidieId: string;
  matchScore: number;
}

const financierOptions = ['Alle', 'DUS-I', 'Gemeente', 'EU', 'Privaat'];

function isNieuw(createdAt: string): boolean {
  const created = new Date(createdAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return created >= thirtyDaysAgo;
}

export function SubsidieLibraryPage() {
  const [regelingen, setRegelingen] = useState<Regeling[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [financierFilter, setFinancierFilter] = useState('Alle');
  const [selectedRegeling, setSelectedRegeling] = useState<Regeling | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [regelingenRes, matchesRes] = await Promise.all([
        api.get('/subsidies/bibliotheek'),
        api.get('/subsidies/matches').catch(() => ({ data: [] })),
      ]);
      setRegelingen(Array.isArray(regelingenRes.data) ? regelingenRes.data : []);
      setMatches(Array.isArray(matchesRes.data) ? matchesRes.data : []);
    } catch (err: any) {
      console.error('[SubsidieLibrary] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  const matchMap = useMemo(() => {
    const map = new Map<string, number>();
    matches.forEach((m) => map.set(m.subsidieId, Math.round(m.matchScore * 100)));
    return map;
  }, [matches]);

  const filtered = useMemo(() => {
    return regelingen.filter((r) => {
      if (financierFilter !== 'Alle' && r.financier !== financierFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.naam.toLowerCase().includes(q) ||
          r.beschrijving?.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [regelingen, search, financierFilter]);

  async function handleStartDossier(subsidieId: string) {
    setCreating(true);
    try {
      await api.post('/subsidies/dossiers', { subsidieId });
      setSelectedRegeling(null);
    } catch (err: any) {
      console.error('[SubsidieLibrary] Dossier aanmaken mislukt:', err?.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subsidie Bibliotheek</h1>

      {/* Filter Bar */}
      <div className="card px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek op naam, beschrijving of tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={financierFilter}
              onChange={(e) => setFinancierFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {financierOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        {filtered.length} {filtered.length === 1 ? 'regeling' : 'regelingen'} gevonden
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-sm text-gray-400">Geen regelingen gevonden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const matchScore = matchMap.get(r.id);
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRegeling(r)}
                className="card cursor-pointer p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{r.naam}</h3>
                  <div className="flex items-center gap-1.5">
                    {isNieuw(r.createdAt) && (
                      <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                        <Sparkles className="h-3 w-3" />
                        Nieuw!
                      </span>
                    )}
                    {matchScore != null && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        matchScore >= 80 ? 'bg-emerald-50 text-emerald-700' :
                        matchScore >= 50 ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {matchScore}% match
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
                    {r.financier}
                  </span>
                  {(r.minBedrag != null || r.maxBedrag != null) && (
                    <span className="inline-flex items-center gap-1">
                      <Euro className="h-3 w-3" />
                      {r.minBedrag != null ? r.minBedrag.toLocaleString('nl-NL') : '?'} - {r.maxBedrag != null ? r.maxBedrag.toLocaleString('nl-NL') : '?'}
                    </span>
                  )}
                  {r.aanvraagPeriodeSluiting && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.aanvraagPeriodeSluiting).toLocaleDateString('nl-NL')}
                    </span>
                  )}
                </div>

                {r.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRegeling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedRegeling(null)}>
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900">{selectedRegeling.naam}</h2>
              <button onClick={() => setSelectedRegeling(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-600">{selectedRegeling.financier}</span>
              {(selectedRegeling.minBedrag != null || selectedRegeling.maxBedrag != null) && (
                <span className="inline-flex items-center gap-1">
                  <Euro className="h-3 w-3" />
                  {selectedRegeling.minBedrag != null ? selectedRegeling.minBedrag.toLocaleString('nl-NL') : '?'} - {selectedRegeling.maxBedrag != null ? selectedRegeling.maxBedrag.toLocaleString('nl-NL') : '?'}
                </span>
              )}
              {selectedRegeling.aanvraagPeriodeSluiting && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(selectedRegeling.aanvraagPeriodeSluiting).toLocaleDateString('nl-NL')}
                </span>
              )}
            </div>

            <div className="mb-4">
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Beschrijving</h3>
              <p className="text-sm text-gray-600">{selectedRegeling.beschrijving || 'Geen beschrijving beschikbaar.'}</p>
            </div>

            {selectedRegeling.vereisten && (
              <div className="mb-6">
                <h3 className="mb-1 text-sm font-semibold text-gray-700">Vereisten</h3>
                <p className="whitespace-pre-line text-sm text-gray-600">{selectedRegeling.vereisten}</p>
              </div>
            )}

            <button
              onClick={() => handleStartDossier(selectedRegeling.id)}
              disabled={creating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FolderPlus className="h-4 w-4" />
              {creating ? 'Bezig...' : 'Start dossier'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
