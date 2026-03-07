import { useState, useEffect } from 'react';
import api from '../api/client';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Plus, Pencil, Archive, School, MapPin, Users, X } from 'lucide-react';
import type { School as SchoolType, CreateSchoolRequest } from '@schoollaider/shared';

interface SchoolFormData {
  naam: string;
  brinCode: string;
  adres: string;
  directeur: string;
  leerlingaantal: string;
}

const emptyForm: SchoolFormData = {
  naam: '',
  brinCode: '',
  adres: '',
  directeur: '',
  leerlingaantal: '',
};

export function ScholenBeheerPage() {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SchoolFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [showArchived]);

  async function fetchData() {
    setLoading(true);
    try {
      const url = showArchived ? '/schools?status=GEARCHIVEERD' : '/schools';
      const { data } = await api.get(url);
      setSchools(data);
    } catch (err: any) {
      console.error('[ScholenBeheer] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(school: SchoolType) {
    setEditingId(school.id);
    setForm({
      naam: school.naam,
      brinCode: school.brinCode,
      adres: school.adres,
      directeur: school.directeur,
      leerlingaantal: school.leerlingaantal.toString(),
    });
    setShowForm(true);
  }

  function handleNewSchool() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: CreateSchoolRequest = {
      naam: form.naam,
      brinCode: form.brinCode,
      adres: form.adres,
      directeur: form.directeur || undefined,
      leerlingaantal: form.leerlingaantal ? parseInt(form.leerlingaantal, 10) : undefined,
    };

    try {
      if (editingId) {
        await api.patch(`/schools/${editingId}`, payload);
      } else {
        await api.post('/schools', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchData();
    } catch (err: any) {
      console.error('[ScholenBeheer] Opslaan mislukt:', err?.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string) {
    try {
      await api.patch(`/schools/${id}/archive`);
      await fetchData();
    } catch (err: any) {
      console.error('[ScholenBeheer] Archiveren mislukt:', err?.message);
    }
  }

  if (loading) return <TableSkeleton rows={6} cols={5} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Scholenbeheer</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Gearchiveerd
          </label>
          <button onClick={handleNewSchool} className="btn-primary">
            <Plus className="h-4 w-4" />
            School toevoegen
          </button>
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="card animate-slide-up p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {editingId ? 'School bewerken' : 'Nieuwe school'}
            </h2>
            <button onClick={handleCancel} className="btn-ghost p-1.5">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Naam *</label>
              <input
                type="text"
                required
                value={form.naam}
                onChange={(e) => setForm({ ...form, naam: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">BRIN-code *</label>
              <input
                type="text"
                required
                value={form.brinCode}
                onChange={(e) => setForm({ ...form, brinCode: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Adres *</label>
              <input
                type="text"
                required
                value={form.adres}
                onChange={(e) => setForm({ ...form, adres: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Directeur</label>
              <input
                type="text"
                value={form.directeur}
                onChange={(e) => setForm({ ...form, directeur: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Leerlingaantal</label>
              <input
                type="number"
                min="0"
                value={form.leerlingaantal}
                onChange={(e) => setForm({ ...form, leerlingaantal: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex items-end gap-3 sm:col-span-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Opslaan...' : editingId ? 'Bijwerken' : 'Toevoegen'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schools Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Naam</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">BRIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Directeur</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Leerlingen</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                        <School className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{school.naam}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {school.adres}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">{school.brinCode}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {school.directeur || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      {school.leerlingaantal}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        school.status === 'ACTIEF'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${school.status === 'ACTIEF' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {school.status === 'ACTIEF' ? 'Actief' : 'Gearchiveerd'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(school)} className="btn-ghost p-2" title="Bewerken">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {school.status === 'ACTIEF' && (
                        <button onClick={() => handleArchive(school.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50 hover:text-red-600" title="Archiveren">
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <School className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">Geen scholen gevonden.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
