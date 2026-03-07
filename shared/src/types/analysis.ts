export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'NONE';
export type AiSourceType = 'MANUAL' | 'AI_GENERATED' | 'AI_ASSISTED';

export interface SectionStandaardMapping {
  id: string;
  sectionId: string;
  standaardId: string;
  relevance: number;
  evidence: string;
  standaard: {
    id: string;
    code: string;
    naam: string;
  };
}

export interface DocumentSection {
  id: string;
  analysisId: string;
  titel: string;
  inhoud: string;
  startPagina: number | null;
  eindPagina: number | null;
  volgorde: number;
  createdAt: string;
  standaardLinks: SectionStandaardMapping[];
}

export interface Gap {
  standaardCode: string;
  beschrijving: string;
  ernst: 'hoog' | 'midden' | 'laag';
}

export interface Overlap {
  standaardCodes: string[];
  beschrijving: string;
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  documentVersion: number;
  status: AnalysisStatus;
  extractedText: string | null;
  sections: unknown;
  mappings: unknown;
  gaps: Gap[] | null;
  overlaps: Overlap[] | null;
  summary: string | null;
  tokenCount: number | null;
  costCents: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  documentSections: DocumentSection[];
}

export interface AnalysisJob {
  id: string;
  tenantId: string;
  documentId: string;
  jobType: string;
  status: AnalysisStatus;
  progress: number;
  resultId: string | null;
  errorMessage: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisStatusResponse {
  status: AnalysisStatus;
  progress: number;
  jobId: string | null;
  errorMessage: string | null;
}

export interface SchoolAnalysisOverviewItem {
  id: string;
  titel: string;
  type: string;
  status: string;
  versie: number;
  createdAt: string;
  analysis: {
    id: string;
    status: AnalysisStatus;
    summary: string | null;
    completedAt: string | null;
    tokenCount: number | null;
  } | null;
  job: AnalysisJob | null;
}

export interface PdcaSuggestion {
  id: string;
  schoolId: string;
  schooljaar: string;
  fase: 'PLAN' | 'DO' | 'CHECK' | 'ACT';
  titel: string;
  beschrijving: string;
  bronDocumentId: string | null;
  bronSectie: string | null;
  vertrouwen: number;
  status: 'pending' | 'accepted' | 'dismissed';
  pdcaItemId: string | null;
  createdAt: string;
}
