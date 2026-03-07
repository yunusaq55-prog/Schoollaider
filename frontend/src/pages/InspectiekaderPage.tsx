import { useEffect, useState } from 'react';
import api from '../api/client';
import type { InspectieDomein } from '@schoollaider/shared';

export function InspectiekaderPage() {
  const [domeinen, setDomeinen] = useState<InspectieDomein[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDomein, setOpenDomein] = useState<string | null>(null);

  useEffect(() => {
    api.get('/inspectie/domeinen')
      .then(({ data }) => setDomeinen(data))
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
      <h1 className="text-2xl font-bold text-gray-900">Inspectiekader</h1>
      <p className="mt-1 text-sm text-gray-500">Onderwijsinspectie domeinen en standaarden</p>

      {domeinen.length === 0 ? (
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Geen inspectiedomeinen geladen</p>
          <p className="mt-1 text-sm text-gray-400">Domeinen worden via de seed data aangemaakt</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {domeinen.map((domein) => (
            <div key={domein.id} className="rounded-lg bg-white shadow">
              <button
                onClick={() => setOpenDomein(openDomein === domein.id ? null : domein.id)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <div>
                  <span className="mr-2 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {domein.code}
                  </span>
                  <span className="font-medium text-gray-900">{domein.naam}</span>
                </div>
                <span className="text-gray-400">{openDomein === domein.id ? '\u25B2' : '\u25BC'}</span>
              </button>

              {openDomein === domein.id && (
                <div className="border-t px-6 pb-4 pt-2">
                  <p className="mb-3 text-sm text-gray-600">{domein.beschrijving}</p>
                  {domein.standaarden && domein.standaarden.length > 0 && (
                    <div className="space-y-2">
                      {domein.standaarden.map((s) => (
                        <div key={s.id} className="rounded-md bg-gray-50 p-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-mono text-gray-600">
                              {s.code}
                            </span>
                            <span className="text-sm font-medium text-gray-800">{s.naam}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{s.beschrijving}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
