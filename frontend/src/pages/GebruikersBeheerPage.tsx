import { useState, useEffect } from 'react';
import api from '../api/client';
import { useSchoolContext } from '../context/SchoolContext';
import { useAuth } from '../auth/AuthContext';
import { Role } from '@schoollaider/shared';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Plus, Pencil, UserX, UserCheck, Users, X } from 'lucide-react';
import type { User } from '@schoollaider/shared';

interface UserFormData {
  naam: string;
  email: string;
  password: string;
  role: Role;
  schoolId: string;
}

const emptyForm: UserFormData = {
  naam: '',
  email: '',
  password: '',
  role: Role.SCHOOL_GEBRUIKER,
  schoolId: '',
};

const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.BESTUUR_ADMIN]: 'Bestuur Admin',
  [Role.BESTUUR_GEBRUIKER]: 'Bestuur Gebruiker',
  [Role.SCHOOL_DIRECTEUR]: 'School Directeur',
  [Role.SCHOOL_GEBRUIKER]: 'School Gebruiker',
  [Role.OPERATIONEEL_MANAGER]: 'Operationeel Manager',
};

export function GebruikersBeheerPage() {
  const { schools } = useSchoolContext();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err: any) {
      console.error('[GebruikersBeheer] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingId(user.id);
    setForm({
      naam: user.naam,
      email: user.email,
      password: '',
      role: user.role,
      schoolId: user.schoolId ?? '',
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
    setSaving(true);

    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          naam: form.naam,
          role: form.role,
          schoolId: form.schoolId || null,
        };
        await api.patch(`/users/${editingId}`, payload);
      } else {
        await api.post('/auth/register', {
          naam: form.naam,
          email: form.email,
          password: form.password,
          role: form.role,
          schoolId: form.schoolId || undefined,
        });
      }
      closeModal();
      await fetchData();
    } catch (err: any) {
      console.error('[GebruikersBeheer] Opslaan mislukt:', err?.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(userId: string) {
    try {
      await api.patch(`/users/${userId}`, { active: false });
      await fetchData();
    } catch (err: any) {
      console.error('[GebruikersBeheer] Deactiveren mislukt:', err?.message);
    }
  }

  async function handleActivate(userId: string) {
    try {
      await api.patch(`/users/${userId}`, { active: true });
      await fetchData();
    } catch (err: any) {
      console.error('[GebruikersBeheer] Activeren mislukt:', err?.message);
    }
  }

  function getSchoolName(schoolId: string | null): string {
    if (!schoolId) return '-';
    const school = schools.find((s) => s.id === schoolId);
    return school?.naam ?? schoolId;
  }

  if (loading) return <TableSkeleton rows={6} cols={5} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gebruikersbeheer</h1>
        <button onClick={openAddModal} className="btn-primary">
          <Plus className="h-4 w-4" />
          Gebruiker toevoegen
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gebruiker</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-semibold text-white">
                        {user.naam.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.naam}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {getSchoolName(user.schoolId)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {user.active ? 'Actief' : 'Inactief'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditModal(user)} className="btn-ghost p-2" title="Bewerken">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {user.id !== currentUser?.id && (
                        user.active ? (
                          <button onClick={() => handleDeactivate(user.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50 hover:text-red-600" title="Deactiveren">
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(user.id)} className="btn-ghost p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600" title="Activeren">
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">Geen gebruikers gevonden.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card mx-4 w-full max-w-md animate-slide-up p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                {editingId ? 'Gebruiker bewerken' : 'Nieuwe gebruiker'}
              </h2>
              <button onClick={closeModal} className="btn-ghost p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              {!editingId && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Wachtwoord *</label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Rol *</label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="input"
                >
                  {Object.values(Role).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">School</label>
                <select
                  value={form.schoolId}
                  onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                  className="input"
                >
                  <option value="">Geen school (bestuursniveau)</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.naam}
                    </option>
                  ))}
                </select>
              </div>
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
