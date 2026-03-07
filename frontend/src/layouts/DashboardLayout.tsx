import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useSchoolContext } from '../context/SchoolContext';
import { SchoolSelector } from '../components/SchoolSelector';
import {
  LayoutDashboard,
  School,
  Users,
  FileText,
  ClipboardCheck,
  RefreshCw,
  LogOut,
  GraduationCap,
  Sparkles,
  ChevronDown,
  UserCheck,
  HeartPulse,
  ArrowLeftRight,
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  basePath: string;        // path for clicking the group header
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

const bestuurNav: NavEntry[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Scholenbeheer', path: '/scholen', icon: School },
  { label: 'Gebruikers', path: '/gebruikers', icon: Users },
];

const schoolNav: NavEntry[] = [
  {
    label: 'AI Kwaliteitsmanager',
    icon: Sparkles,
    basePath: '/',
    children: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Documenthub', path: '/documenten', icon: FileText },
      { label: 'Inspectiekader', path: '/inspectiekader', icon: ClipboardCheck },
      { label: 'PDCA', path: '/pdca', icon: RefreshCw },
    ],
  },
  {
    label: 'HR Module',
    icon: Users,
    basePath: '/hr',
    children: [
      { label: 'Dashboard', path: '/hr', icon: LayoutDashboard },
      { label: 'Formatie', path: '/hr/formatie', icon: UserCheck },
      { label: 'Verzuim', path: '/hr/verzuim', icon: HeartPulse },
      { label: 'Vervanging', path: '/hr/vervanging', icon: ArrowLeftRight },
      { label: 'Leeftijd & Uitstroom', path: '/hr/leeftijd', icon: Clock },
    ],
  },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isBestuurView, selectedSchool } = useSchoolContext();
  const location = useLocation();

  const navEntries = isBestuurView ? bestuurNav : schoolNav;

  // Track which nav groups are expanded (default: expand the group containing the active route)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const entry of navEntries) {
      if (isNavGroup(entry)) {
        initial[entry.label] = true; // start expanded
      }
    }
    return initial;
  });

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  const initials = user?.naam
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?';

  function renderNavItem(item: NavItem, isChild = false) {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isChild ? 'ml-3 pl-4' : ''
        } ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon size={isChild ? 16 : 18} className={isActive ? 'text-primary-600' : 'text-gray-400'} />
        {item.label}
        {isActive && (
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-600" />
        )}
      </Link>
    );
  }

  function renderNavGroup(group: NavGroup) {
    const isExpanded = expandedGroups[group.label] ?? true;
    const GroupIcon = group.icon;
    const isGroupActive = group.children.some((c) => location.pathname === c.path || (c.path !== '/' && location.pathname.startsWith(c.path)));

    return (
      <div key={group.label}>
        <button
          onClick={() => toggleGroup(group.label)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
            isGroupActive
              ? 'text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <GroupIcon size={18} className={isGroupActive ? 'text-primary-600' : 'text-gray-500'} />
          {group.label}
          <ChevronDown
            size={14}
            className={`ml-auto text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
        {isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {group.children.map((child) => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500">
            <GraduationCap className="h-4.5 w-4.5 text-white" size={18} />
          </div>
          <span className="bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-lg font-bold text-transparent">
            SchoollAIder
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navEntries.map((entry) =>
            isNavGroup(entry) ? renderNavGroup(entry) : renderNavItem(entry),
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user?.naam}</p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <LogOut size={16} />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 px-6 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-gray-800">
            {isBestuurView
              ? (navEntries.find((e) => !isNavGroup(e) && e.path === location.pathname) as NavItem | undefined)?.label ?? 'SchoollAIder'
              : (selectedSchool?.naam ?? 'School')}
          </h2>
          <SchoolSelector />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
