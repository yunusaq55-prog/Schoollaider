import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Scholen', path: '/scholen' },
  { label: 'Documenten', path: '/documenten' },
  { label: 'Gebruikers', path: '/gebruikers' },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-gray-900 text-white">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-lg font-bold">SchoollAIder</h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <p className="truncate text-sm text-gray-300">{user?.naam}</p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-2 text-sm text-gray-400 hover:text-white"
          >
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b bg-white px-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find((i) => i.path === location.pathname)?.label ?? 'SchoollAIder'}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
