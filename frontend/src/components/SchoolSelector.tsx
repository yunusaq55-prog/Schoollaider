import { useState, useRef, useEffect } from 'react';
import { useSchoolContext } from '../context/SchoolContext';
import { useAuth } from '../auth/AuthContext';
import { Role } from '@schoollaider/shared';
import { ChevronDown, Building2, Check } from 'lucide-react';

export function SchoolSelector() {
  const { user } = useAuth();
  const { selectedSchoolId, schools, selectSchool } = useSchoolContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isSchoolRole = user?.role === Role.SCHOOL_DIRECTEUR || user?.role === Role.SCHOOL_GEBRUIKER;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isSchoolRole) {
    const school = schools.find((s) => s.id === user?.schoolId);
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
        <Building2 className="h-3.5 w-3.5" />
        {school?.naam ?? 'Mijn school'}
      </div>
    );
  }

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
  const label = selectedSchool?.naam ?? 'Bestuursdashboard';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        <Building2 className="h-3.5 w-3.5 text-gray-400" />
        <span className="max-w-[180px] truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 animate-fade-in rounded-xl border border-gray-100 bg-white py-1 shadow-card">
          <button
            onClick={() => { selectSchool(null); setOpen(false); }}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
              !selectedSchoolId ? 'bg-primary-50/50 text-primary-700' : 'text-gray-700'
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="flex-1 truncate">Bestuursdashboard</span>
            {!selectedSchoolId && <Check className="h-3.5 w-3.5 text-primary-600" />}
          </button>

          {schools.length > 0 && (
            <div className="mx-3 my-1 border-t border-gray-100" />
          )}

          {schools.map((school) => (
            <button
              key={school.id}
              onClick={() => { selectSchool(school.id); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                selectedSchoolId === school.id ? 'bg-primary-50/50 text-primary-700' : 'text-gray-700'
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[10px] font-semibold text-gray-500">
                {school.naam.charAt(0)}
              </div>
              <span className="flex-1 truncate">{school.naam}</span>
              {selectedSchoolId === school.id && <Check className="h-3.5 w-3.5 text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
