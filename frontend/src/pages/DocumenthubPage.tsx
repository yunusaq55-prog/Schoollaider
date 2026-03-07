import { useEffect, useState } from 'react';
import api from '../api/client';

interface Document {
  id: string;
  titel: string;
  beschrijving: string;
  type: string;
  versie: number;
  createdAt: string;
}

export function DocumenthubPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents')
      .then(({ data }) => setDocs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-200" />)}
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documenthub</h1>
          <p className="mt-1 text-sm text-gray-500">Beleidsdocumenten, protocollen en kwaliteitshandboek</p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Nog geen documenten geupload</p>
          <p className="mt-1 text-sm text-gray-400">Upload documenten via de API</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Versie</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{doc.titel}</div>
                    <div className="text-sm text-gray-500">{doc.beschrijving}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">v{doc.versie}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString('nl-NL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
