import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/client';

interface DashboardStats {
  totalScholen: number;
  totalDocumenten: number;
  pdcaCycli: { actief: number; afgerond: number; concept: number };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welkom, {user?.naam}
      </h1>
      <p className="mt-1 text-gray-500">
        Overzicht van het kwaliteitsbeheer
      </p>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : stats ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Scholen" value={stats.totalScholen} />
          <StatCard label="Documenten" value={stats.totalDocumenten} />
          <StatCard
            label="PDCA Cycli (actief)"
            value={stats.pdcaCycli.actief}
            sub={`${stats.pdcaCycli.afgerond} afgerond, ${stats.pdcaCycli.concept} concept`}
          />
          <StatCard label="Rol" value={user?.role ?? '-'} />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Rol" value={user?.role ?? '-'} />
          <StatCard label="School" value={user?.schoolId ?? 'Alle scholen'} />
          <StatCard label="Status" value="Actief" />
        </div>
      )}
    </div>
  );
}
