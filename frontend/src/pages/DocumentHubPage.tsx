import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import { useSchoolContext } from '../context/SchoolContext';
import { DocumentStatusBadge } from '../components/StatusBadge';
import { AiStatusBadge } from '../components/AiStatusBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Upload, Download, FileText, Filter, FolderOpen, Sparkles, Eye } from 'lucide-react';
import type { Document, DocumentType, AnalysisStatus, AnalysisStatusResponse } from '@schoollaider/shared';

const DOCUMENT_TYPES: { value: DocumentType | ''; label: string }[] = [
  { value: '', label: 'Alle types' },
  { value: 'SCHOOLPLAN', label: 'Schoolplan' },
  { value: 'JAARPLAN', label: 'Jaarplan' },
  { value: 'VEILIGHEIDSBELEID', label: 'Veiligheidsbeleid' },
  { value: 'SCHOOLGIDS', label: 'Schoolgids' },
  { value: 'SOP', label: 'SOP' },
  { value: 'EVALUATIE', label: 'Evaluatie' },
  { value: 'PEDAGOGISCH_BELEIDSPLAN', label: 'Pedagogisch Beleidsplan' },
  { value: 'RESULTATENANALYSE', label: 'Resultatenanalyse' },
  { value: 'IB_JAARVERSLAG', label: 'IB Jaarverslag' },
  { value: 'AUDITRAPPORT', label: 'Auditrapport' },
  { value: 'RIE', label: 'RIE' },
  { value: 'OUDERCOMMISSIE_REGLEMENT', label: 'Oudercommissie Reglement' },
  { value: 'OVERIG', label: 'Overig' },
];

interface AnalysisState {
  status: AnalysisStatus;
  progress: number;
  errorMessage?: string;
}

export function DocumentHubPage() {
  const { selectedSchoolId } = useSchoolContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<DocumentType | ''>('');
  const [uploading, setUploading] = useState(false);
  const [analysisStates, setAnalysisStates] = useState<Record<string, AnalysisState>>({});
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalysisStatus = useCallback(async (docId: string) => {
    try {
      const { data } = await api.get<AnalysisStatusResponse>(`/analysis/documents/${docId}/status`);
      setAnalysisStates((prev) => ({
        ...prev,
        [docId]: { status: data.status as AnalysisStatus, progress: data.progress },
      }));
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchData();
    }
  }, [selectedSchoolId, filterType]);

  // Poll for in-progress analyses
  useEffect(() => {
    const activeJobs = Object.entries(analysisStates).filter(
      ([, s]) => s.status === 'PENDING' || s.status === 'PROCESSING',
    );
    if (activeJobs.length === 0) return;

    const interval = setInterval(() => {
      for (const [docId] of activeJobs) {
        fetchAnalysisStatus(docId);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [analysisStates, fetchAnalysisStatus]);

  async function fetchData() {
    setLoading(true);
    try {
      let url = `/documents?schoolId=${selectedSchoolId}`;
      if (filterType) url += `&type=${filterType}`;
      const { data } = await api.get(url);
      setDocuments(data);

      // Fetch analysis status for all documents
      for (const doc of data) {
        fetchAnalysisStatus(doc.id);
      }
    } catch (err: any) {
      console.error('[DocumentHub] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedSchoolId) return;

    setUploading(true);
    try {
      const docType: DocumentType = 'OVERIG';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('schoolId', selectedSchoolId);
      formData.append('titel', file.name);
      formData.append('beschrijving', '');
      formData.append('type', docType);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Upload mislukt.';
      setErrorMessage(msg);
      console.error('[DocumentHub] Upload mislukt:', msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDownload(documentId: string) {
    try {
      const response = await api.get(`/documents/${documentId}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? decodeURIComponent(contentDisposition.split('filename="')[1]?.replace('"', '') || 'document')
        : 'document';
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('[DocumentHub] Download mislukt:', err?.message);
    }
  }

  async function handleTriggerAnalysis(documentId: string) {
    try {
      setErrorMessage(null);
      setAnalysisStates((prev) => ({
        ...prev,
        [documentId]: { status: 'PENDING', progress: 0 },
      }));
      await api.post(`/analysis/documents/${documentId}/analyze`);
      fetchAnalysisStatus(documentId);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Analyse kon niet worden gestart.';
      setErrorMessage(msg);
      setAnalysisStates((prev) => ({
        ...prev,
        [documentId]: { status: 'FAILED', progress: 0, errorMessage: msg },
      }));
      console.error('[DocumentHub] Analyse trigger mislukt:', msg);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('nl-NL');
  }

  if (!selectedSchoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <FolderOpen className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">Geen school geselecteerd</p>
        <p className="mt-1 text-sm text-gray-500">Selecteer een school om documenten te bekijken.</p>
      </div>
    );
  }

  if (loading) return <TableSkeleton rows={5} cols={7} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Document Hub</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as DocumentType | '')}
              className="input py-2 pl-9 pr-8"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>
          <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" accept=".pdf,.doc,.docx" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploaden...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">AI Analyse</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Versie</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vervaldatum</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const analysisState = analysisStates[doc.id];
                const aiStatus: AnalysisStatus = analysisState?.status ?? 'NONE';
                const canAnalyze = aiStatus === 'NONE' || aiStatus === 'FAILED';
                const canViewResults = aiStatus === 'COMPLETED';

                return (
                  <tr key={doc.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                          <FileText className="h-4 w-4 text-primary-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{doc.titel}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {DOCUMENT_TYPES.find((dt) => dt.value === doc.type)?.label ?? doc.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <DocumentStatusBadge status={doc.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <AiStatusBadge status={aiStatus} progress={analysisState?.progress} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">v{doc.versie}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(doc.vervaltDatum)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {canAnalyze && (
                          <button
                            onClick={() => handleTriggerAnalysis(doc.id)}
                            className="btn-ghost p-2 text-violet-600 hover:bg-violet-50"
                            title="AI Analyseer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canViewResults && (
                          <button
                            onClick={() => setSelectedDocId(doc.id)}
                            className="btn-ghost p-2 text-emerald-600 hover:bg-emerald-50"
                            title="Bekijk analyse"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDownload(doc.id)} className="btn-ghost p-2" title="Downloaden">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-400">Geen documenten gevonden.</p>
                    <p className="mt-1 text-xs text-gray-400">Upload een document om te beginnen.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis slide-over panel */}
      {selectedDocId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm" onClick={() => setSelectedDocId(null)}>
          <div
            className="w-full max-w-lg bg-white shadow-2xl"
            style={{ animation: 'slideInRight 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Document Analyse</h2>
              <button onClick={() => setSelectedDocId(null)} className="btn-ghost p-2 text-lg">&times;</button>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              <DocumentAnalysisContent documentId={selectedDocId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline analysis content — will be replaced by full DocumentAnalysisPanel in Step 6 */
function DocumentAnalysisContent({ documentId }: { documentId: string }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/analysis/documents/${documentId}/results`);
        setAnalysis(data);
      } catch {
        setError('Analyse niet gevonden of nog niet voltooid.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-gray-400">{error}</p>;
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {analysis.summary && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Samenvatting</h3>
          <p className="text-sm leading-relaxed text-gray-600">{analysis.summary}</p>
        </div>
      )}

      {/* Sections */}
      {analysis.documentSections?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Secties ({analysis.documentSections.length})
          </h3>
          <div className="space-y-3">
            {analysis.documentSections.map((section: any) => (
              <div key={section.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{section.titel}</h4>
                  {section.startPagina && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                      p.{section.startPagina}{section.eindPagina ? `–${section.eindPagina}` : ''}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 line-clamp-3">{section.inhoud}</p>
                {section.standaardLinks?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {section.standaardLinks.map((link: any) => (
                      <span
                        key={link.id}
                        className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700"
                        title={`${link.standaard.naam} (${Math.round(link.relevance * 100)}%)`}
                      >
                        {link.standaard.code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {analysis.gaps && (analysis.gaps as any[]).length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Gaps</h3>
          <div className="space-y-2">
            {(analysis.gaps as any[]).map((gap: any, i: number) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/50 p-3">
                <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  gap.ernst === 'hoog' ? 'bg-red-100 text-red-700' :
                  gap.ernst === 'midden' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {gap.ernst}
                </span>
                <div>
                  <span className="text-xs font-semibold text-gray-700">{gap.standaardCode}: </span>
                  <span className="text-xs text-gray-600">{gap.beschrijving}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token usage */}
      {analysis.tokenCount && (
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          Tokens: {analysis.tokenCount.toLocaleString()} · Kosten: ~€{((analysis.costCents ?? 0) / 100).toFixed(2)}
        </div>
      )}
    </div>
  );
}
