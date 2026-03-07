import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Role, type School } from '@schoollaider/shared';

interface SchoolContextState {
  selectedSchoolId: string | null;
  schools: School[];
  loading: boolean;
  selectSchool: (id: string | null) => void;
  isBestuurView: boolean;
  selectedSchool: School | null;
}

const SchoolContext = createContext<SchoolContextState | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchools = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/schools');
      setSchools(data);
    } catch {
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // Auto-select school for school-level roles
  useEffect(() => {
    if (!user) return;

    const isSchoolRole = user.role === Role.SCHOOL_DIRECTEUR || user.role === Role.SCHOOL_GEBRUIKER;
    if (isSchoolRole && user.schoolId) {
      setSelectedSchoolId(user.schoolId);
      return;
    }

    // Restore from localStorage for board roles
    const saved = localStorage.getItem('selectedSchoolId');
    if (saved && saved !== 'null') {
      setSelectedSchoolId(saved);
    }
  }, [user]);

  const selectSchool = (id: string | null) => {
    setSelectedSchoolId(id);
    localStorage.setItem('selectedSchoolId', id ?? 'null');
  };

  const isBestuurView = selectedSchoolId === null;
  const selectedSchool = schools.find((s) => s.id === selectedSchoolId) ?? null;

  return (
    <SchoolContext.Provider value={{ selectedSchoolId, schools, loading, selectSchool, isBestuurView, selectedSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolContext() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchoolContext must be used within SchoolProvider');
  return ctx;
}
