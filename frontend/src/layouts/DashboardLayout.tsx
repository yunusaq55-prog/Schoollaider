import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface NavItem {
  label: string;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const kwaliteitNav: NavGroup = {
  label: 'Kwaliteitsbeheer',
  items: [
    { label: 'Dashboard', path: '/' },
    { label: 'Documenthub', path: '/documenten' },
    { label: 'Inspectiekader', path: '/inspectiekader' },
    { label: 'PDCA Cyclus', path: '/pdca' },
  ],
};

const hrNav: NavGroup = {
  label: 'HR Module',
  items: [
    { label: 'Dashboard', path: '/hr' },
    { label: 'Formatie', path: '/hr/formatie' },
    { label: 'Verzuim', path: '/hr/verzuim' },
    { label: 'Vervanging', path: '/hr/vervanging' },
    { label: 'Leeftijd & Uitstroom', path: '/hr/leeftijd' },
  ],
};

const beheerNav: NavGroup = {
  label: 'Beheer',
  items: [
    { label: 'Scholen', path: '/scholen' },
    { label: 'Gebruikers', path: '/gebruikers' },
  ],
};

function NavSection({ group, currentPath }: { group: NavGroup; currentPath: string }) {
  const [open, setOpen] = useState(true);
  const isActive = group.items.some((i) => i.path === currentPath);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
          isActive ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <span>{group.label}</span>
        <span className="text-[10px]">{open ? '\u25BC' : '\u25B6'}</span>
      </button>
      {open && (
        <div className="mt-1 space-y-0.5 pl-2">
          {group.items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                currentPath === item.path
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const allItems = [...kwaliteitNav.items, ...hrNav.items, ...beheerNav.items];
  return allItems.find((i) => i.path === pathname)?.label ?? 'SchoollAIder';
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-gray-900 text-white">
        <div className="flex h-16 items-center border-b border-gray-700 px-6">
          <h1 className="text-lg font-bold tracking-tight">SchoollAIder</h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavSection group={kwaliteitNav} currentPath={location.pathname} />
          <NavSection group={hrNav} currentPath={location.pathname} />
          <NavSection group={beheerNav} currentPath={location.pathname} />
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
            {getPageTitle(location.pathname)}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
