import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welkom, {user?.naam}
      </h1>
      <p className="mt-2 text-gray-600">
        Dit is het SchoollAIder dashboard. Hier komt een overzicht van de kwaliteitsmodule.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Rol</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">{user?.role}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Tenant</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">{user?.tenantId}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">School</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {user?.schoolId ?? 'Alle scholen'}
          </p>
        </div>
      </div>
    </div>
  );
}
