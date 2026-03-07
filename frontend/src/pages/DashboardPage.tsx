import { useSchoolContext } from '../context/SchoolContext';
import { BestuurDashboardPage } from './BestuurDashboardPage';
import { SchoolDashboardPage } from './SchoolDashboardPage';

export function DashboardPage() {
  const { isBestuurView } = useSchoolContext();
  return isBestuurView ? <BestuurDashboardPage /> : <SchoolDashboardPage />;
}
