import { useEffect, useState } from 'react';
import api from '../api/client';
import type { School } from '@schoollaider/shared';

export function ScholenPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/schools')
      .then(({ data }) => setSchools(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-gray-200" />)}
    </div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Scholen</h1>
      <p className="mt-1 text-sm text-gray-500">Overzicht van alle scholen</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <div key={school.id} className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">{school.naam}</h3>
            <p className="mt-1 text-sm text-gray-500">{school.adres}</p>
            <div className="mt-3">
              <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                BRIN: {school.brinCode}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
