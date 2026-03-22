import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, FileText, BookOpen } from 'lucide-react';
import api from '../../api/client';

interface DocumentBron {
  documentTitel: string;
  sectionTitel: string;
  datum: string;
  relevantie: number;
  citaat: string;
}

interface SearchResult {
  antwoord: string;
  gevonden: boolean;
  bronnen: DocumentBron[];
}

const RECENTE_VRAGEN_KEY = 'ops_recente_vragen';

function getRecenteVragen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTE_VRAGEN_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveVraag(vraag: string) {
  const recent = getRecenteVragen().filter((v) => v !== vraag).slice(0, 4);
  localStorage.setItem(RECENTE_VRAGEN_KEY, JSON.stringify([vraag, ...recent]));
}

export default function DocumentZoekenPage() {
  const [vraag, setVraag] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);

  const search = useMutation({
    mutationFn: (v: string) =>
      api.post('/operations/zoeken', { vraag: v }).then((r) => r.data as SearchResult),
    onSuccess: (data, v) => {
      setResult(data);
      saveVraag(v);
    },
  });

  function handleSearch(v: string) {
    if (!v.trim()) return;
    setVraag(v);
    search.mutate(v);
  }

  const recenteVragen = getRecenteVragen();

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Search className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Document Zoeken</h1>
      </div>

      <p className="text-sm text-gray-500">
        Stel een vraag in gewone taal. AI doorzoekt alle geanalyseerde documenten.
      </p>

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={vraag}
          onChange={(e) => setVraag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(vraag)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Wat besloot het bestuur over het taakbeleid?"
        />
        <button
          onClick={() => handleSearch(vraag)}
          disabled={!vraag.trim() || search.isPending}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          {search.isPending ? 'Zoeken...' : 'Zoek'}
        </button>
      </div>

      {/* Recent searches */}
      {!result && recenteVragen.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Recente zoekopdrachten</p>
          <div className="flex flex-wrap gap-2">
            {recenteVragen.map((v, i) => (
              <button
                key={i}
                onClick={() => handleSearch(v)}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className={`rounded-lg p-4 ${result.gevonden ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-start gap-2">
              <BookOpen className={`h-4 w-4 mt-0.5 flex-shrink-0 ${result.gevonden ? 'text-blue-600' : 'text-yellow-600'}`} />
              <p className="text-sm text-gray-800 leading-relaxed">{result.antwoord}</p>
            </div>
          </div>

          {result.bronnen.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Bronnen</p>
              <div className="space-y-2">
                {result.bronnen.map((bron, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-1">
                      <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-gray-700">{bron.documentTitel}</span>
                        <span className="text-xs text-gray-400"> · {bron.sectionTitel}</span>
                        <span className="text-xs text-gray-400"> · {new Date(bron.datum).toLocaleDateString('nl-NL')}</span>
                      </div>
                      <span className="ml-auto text-xs text-blue-600 font-medium">
                        {Math.round(bron.relevantie * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 italic ml-5 leading-relaxed">{bron.citaat}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="text-xs text-blue-600 hover:underline"
          >
            Nieuwe zoekopdracht
          </button>
        </div>
      )}
    </div>
  );
}
