import { useState, useEffect } from 'react';
import api from '../api/client';
import { useSchoolContext } from '../context/SchoolContext';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Plus, Calendar, RefreshCw, X, ClipboardList, Sparkles, Check, XCircle, Loader2 } from 'lucide-react';
import type { PdcaItem, PdcaFase, PdcaStatus, PdcaSuggestion } from '@schoollaider/shared';

const PHASES: { key: PdcaFase; label: string; color: string; bg: string }[] = [
  { key: 'PLAN', label: 'Plan', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'DO', label: 'Do', color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'CHECK', label: 'Check', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'ACT', label: 'Act', color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const STATUS_OPTIONS: { value: PdcaStatus; label: string; dot: string; bg: string; text: string }[] = [
  { value: 'NIET_GESTART', label: 'Niet gestart', dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' },
  { value: 'BEZIG', label: 'Bezig', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  { value: 'AFGEROND', label: 'Afgerond', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
];

function generateSchoolYears(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 7 ? currentYear : currentYear - 1;
  // Use dash format to match backend getCurrentSchoolYear()
  return [
    `${startYear}-${startYear + 1}`,
    `${startYear - 1}-${startYear}`,
    `${startYear - 2}-${startYear - 1}`,
  ];
}

interface ModalForm {
  titel: string;
  beschrijving: string;
  deadline: string;
  fase: PdcaFase;
  status: PdcaStatus;
}

const emptyForm: ModalForm = {
  titel: '',
  beschrijving: '',
  deadline: '',
  fase: 'PLAN',
  status: 'NIET_GESTART',
};

export function PdcaPage() {
  const { selectedSchoolId } = useSchoolContext();

  const schoolYears = generateSchoolYears();
  const [selectedYear, setSelectedYear] = useState(schoolYears[0]);
  const [items, setItems] = useState<PdcaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModalForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<PdcaSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchData();
      fetchSuggestions();
    }
  }, [selectedSchoolId, selectedYear]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/pdca/school/${selectedSchoolId}?schooljaar=${encodeURIComponent(selectedYear)}`
      );
      setItems(data);
    } catch (err: any) {
      console.error('[PDCA] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSuggestions() {
    try {
      const { data } = await api.get(
        `/pdca/school/${selectedSchoolId}/suggestions?schooljaar=${encodeURIComponent(selectedYear)}&status=pending`
      );
      setSuggestions(data);
    } catch (err: any) {
      console.error('[PDCA] Suggesties ophalen mislukt:', err?.message);
    }
  }

  async function handleGenerateSuggestions() {
    if (!selectedSchoolId) return;
    setGenerating(true);
    setErrorMessage(null);
    try {
      await api.post(`/pdca/school/${selectedSchoolId}/generate`, {
        schooljaar: selectedYear,
      });
      await fetchSuggestions();
      setShowSuggestions(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'AI suggesties genereren mislukt.';
      setErrorMessage(msg);
      console.error('[PDCA] AI genereren mislukt:', msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleAcceptSuggestion(id: string) {
    try {
      await api.post(`/pdca/suggestions/${id}/accept`);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      await fetchData();
    } catch (err: any) {
      console.error('[PDCA] Suggestie accepteren mislukt:', err?.message);
    }
  }

  async function handleDismissSuggestion(id: string) {
    try {
      await api.post(`/pdca/suggestions/${id}/dismiss`);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      console.error('[PDCA] Suggestie afwijzen mislukt:', err?.message);
    }
  }

  function openAddModal(fase: PdcaFase) {
    setEditingId(null);
    setForm({ ...emptyForm, fase });
    setShowModal(true);
  }

  function openEditModal(item: PdcaItem) {
    setEditingId(item.id);
    setForm({
      titel: item.titel,
      beschrijving: item.beschrijving,
      deadline: item.deadline ? item.deadline.slice(0, 10) : '',
      fase: item.fase,
      status: item.status,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSchoolId) return;
    setSaving(true);

    const payload = {
      schoolId: selectedSchoolId,
      schooljaar: selectedYear,
      fase: form.fase,
      titel: form.titel,
      beschrijving: form.beschrijving,
      status: form.status,
      deadline: form.deadline || null,
    };

    try {
      if (editingId) {
        await api.patch(`/pdca/${editingId}`, payload);
      } else {
        await api.post(`/pdca/school/${selectedSchoolId}`, payload);
      }
      closeModal();
      await fetchData();
    } catch (err: any) {
      console.error('[PDCA] Opslaan mislukt:', err?.message);
    } finally {
      setSaving(false);
    }
  }

  function getStatusBadge(status: PdcaStatus) {
    const config = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  function getPhaseItems(fase: PdcaFase): PdcaItem[] {
    return items.filter((item) => item.fase === fase);
  }

  if (!selectedSchoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <RefreshCw className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">Geen school geselecteerd</p>
        <p className="mt-1 text-sm text-gray-500">Selecteer een school om de PDCA-cyclus te bekijken.</p>
      </div>
    );
  }

  if (loading) return <TableSkeleton rows={4} cols={3} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">PDCA Cyclus</h1>
        <div className="flex items-center gap-3">
          {/* AI Generate Button */}
          <button
            onClick={handleGenerateSuggestions}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Genereren...' : 'AI Suggesties'}
          </button>

          {/* Suggestion counter badge */}
          {suggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="relative rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100"
            >
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
              {suggestions.length} suggestie{suggestions.length !== 1 ? 's' : ''}
            </button>
          )}

          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input py-2 pl-9 pr-8"
            >
              {schoolYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      {/* AI Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="card overflow-hidden border-violet-200 bg-violet-50/50">
          <div className="flex items-center justify-between border-b border-violet-100 px-6 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-900">AI Suggesties</span>
            </div>
            <button onClick={() => setShowSuggestions(false)} className="btn-ghost p-1.5 text-violet-400">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-violet-100">
            {suggestions.map((s) => {
              const phase = PHASES.find((p) => p.key === s.fase);
              return (
                <div key={s.id} className="flex items-start gap-4 px-6 py-4">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${phase?.bg ?? 'bg-gray-50'}`}>
                    <span className={`text-xs font-bold ${phase?.color ?? 'text-gray-600'}`}>
                      {s.fase[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.titel}</p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{s.beschrijving}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                        {Math.round(s.vertrouwen * 100)}% vertrouwen
                      </span>
                      {s.bronSectie && (
                        <span className="text-[10px] text-gray-400">Bron: {s.bronSectie}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => handleAcceptSuggestion(s.id)}
                      className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100"
                      title="Accepteren"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDismissSuggestion(s.id)}
                      className="rounded-lg bg-gray-100 p-2 text-gray-400 transition-colors hover:bg-gray-200"
                      title="Afwijzen"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PHASES.map((phase) => {
          const phaseItems = getPhaseItems(phase.key);

          return (
            <div key={phase.key} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${phase.bg}`}>
                    <span className={`text-xs font-bold ${phase.color}`}>{phase.label[0]}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">{phase.label}</h2>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {phaseItems.length}
                </span>
              </div>

              <div className="space-y-2 p-3">
                {phaseItems.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center">
                    <ClipboardList className="mx-auto mb-1.5 h-5 w-5 text-gray-300" />
                    <p className="text-xs text-gray-400">Geen items</p>
                  </div>
                )}

                {phaseItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openEditModal(item)}
                    className="w-full rounded-lg border border-gray-100 p-3 text-left transition-all hover:border-primary-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{item.titel}</p>
                      {item.bron === 'AI_GENERATED' && (
                        <span title="AI gegenereerd"><Sparkles className="h-3 w-3 shrink-0 text-violet-400" /></span>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      {getStatusBadge(item.status)}
                      {item.deadline && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.deadline).toLocaleDateString('nl-NL')}
                        </span>
                      )}
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => openAddModal(phase.key)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 py-2.5 text-xs font-medium text-gray-400 transition-colors hover:border-primary-300 hover:text-primary-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Toevoegen
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card mx-4 w-full max-w-md p-6 shadow-xl" style={{ animation: 'slideUp 0.2s ease-out' }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                {editingId ? 'Item bewerken' : 'Nieuw PDCA item'}
              </h2>
              <button onClick={closeModal} className="btn-ghost p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Titel *</label>
                <input
                  type="text"
                  required
                  value={form.titel}
                  onChange={(e) => setForm({ ...form, titel: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Beschrijving</label>
                <textarea
                  value={form.beschrijving}
                  onChange={(e) => setForm({ ...form, beschrijving: e.target.value })}
                  rows={3}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="input"
                />
              </div>
              {editingId && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as PdcaStatus })}
                    className="input"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Annuleren
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Opslaan...' : editingId ? 'Bijwerken' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
