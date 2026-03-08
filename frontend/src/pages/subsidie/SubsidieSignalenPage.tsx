import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  Bell,
  Info,
  AlertTriangle,
  AlertOctagon,
  Filter,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Signaal {
  id: string;
  titel: string;
  beschrijving: string;
  urgentie: 'INFO' | 'WAARSCHUWING' | 'KRITIEK';
  gelezen: boolean;
  createdAt: string;
}

const urgentieConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Bell }> = {
  INFO: { label: 'Info', color: 'text-blue-700', bg: 'bg-blue-50', icon: Info },
  WAARSCHUWING: { label: 'Waarschuwing', color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
  KRITIEK: { label: 'Kritiek', color: 'text-red-700', bg: 'bg-red-50', icon: AlertOctagon },
};

export function SubsidieSignalenPage() {
  const [signalen, setSignalen] = useState<Signaal[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgentieFilter, setUrgentieFilter] = useState<string>('Alle');
  const [gelezenFilter, setGelezenFilter] = useState<'alle' | 'ongelezen' | 'gelezen'>('alle');
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSignalen();
  }, []);

  async function fetchSignalen() {
    try {
      const res = await api.get('/subsidies/signalen');
      setSignalen(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('[SubsidieSignalen] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function markeerAlsGelezen(id: string) {
    setMarkingId(id);
    try {
      await api.patch(`/subsidies/signalen/${id}/gelezen`);
      setSignalen((prev) =>
        prev.map((s) => (s.id === id ? { ...s, gelezen: true } : s))
      );
    } catch (err: any) {
      console.error('[SubsidieSignalen] Markeren mislukt:', err?.message);
    } finally {
      setMarkingId(null);
    }
  }

  const filtered = useMemo(() => {
    return signalen.filter((s) => {
      if (urgentieFilter !== 'Alle' && s.urgentie !== urgentieFilter) return false;
      if (gelezenFilter === 'ongelezen' && s.gelezen) return false;
      if (gelezenFilter === 'gelezen' && !s.gelezen) return false;
      return true;
    });
  }, [signalen, urgentieFilter, gelezenFilter]);

  const ongelezenCount = signalen.filter((s) => !s.gelezen).length;

  if (loading) return <TableSkeleton rows={6} cols={3} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subsidie Signalen</h1>
          {ongelezenCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              {ongelezenCount} ongelezen
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={urgentieFilter}
              onChange={(e) => setUrgentieFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="Alle">Alle urgentieniveaus</option>
              <option value="INFO">Info</option>
              <option value="WAARSCHUWING">Waarschuwing</option>
              <option value="KRITIEK">Kritiek</option>
            </select>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
            {([
              ['alle', 'Alle', null],
              ['ongelezen', 'Ongelezen', EyeOff],
              ['gelezen', 'Gelezen', Eye],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => setGelezenFilter(value)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  gelezenFilter === value
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {label}
              </button>
            ))}
          </div>
          <p className="ml-auto text-xs text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'signaal' : 'signalen'}
          </p>
        </div>
      </div>

      {/* Signalen List */}
      {filtered.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">Geen signalen gevonden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const config = urgentieConfig[s.urgentie] ?? urgentieConfig.INFO;
            const UrgentieIcon = config.icon;
            return (
              <div
                key={s.id}
                className={`card overflow-hidden transition-shadow hover:shadow-md ${
                  !s.gelezen ? 'border-l-4 border-l-primary-400' : ''
                }`}
              >
                <div className="flex items-start gap-4 px-6 py-4">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                    <UrgentieIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className={`text-sm font-semibold ${!s.gelezen ? 'text-gray-900' : 'text-gray-600'}`}>
                        {s.titel}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      {!s.gelezen && (
                        <span className="h-2 w-2 rounded-full bg-primary-500" title="Ongelezen" />
                      )}
                    </div>
                    <p className="mb-2 text-sm text-gray-500">{s.beschrijving}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {!s.gelezen && (
                      <button
                        onClick={() => markeerAlsGelezen(s.id)}
                        disabled={markingId === s.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {markingId === s.id ? 'Bezig...' : 'Markeer als gelezen'}
                      </button>
                    )}
                    {s.gelezen && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Gelezen
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
