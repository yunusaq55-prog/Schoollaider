import type { BewijsStatus } from './inspectie';

export interface ReadinessScore {
  id: string;
  schoolId: string;
  totalScore: number;
  domainScores: Record<string, number>;
  berekendOp: string;
}

export interface DashboardKPIs {
  avgReadinessScore: number;
  schoolsBelowThreshold: number;
  missingDocuments: number;
  incompletePdcaCycles: number;
  outdatedPolicies: number;
}

export interface SchoolOverviewRow {
  schoolId: string;
  schoolNaam: string;
  score: number;
  veiligheid: BewijsStatus;
  kwaliteit: BewijsStatus;
  pdcaComplete: boolean;
  risico: 'LAAG' | 'MIDDEN' | 'HOOG';
}
