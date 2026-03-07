export type PdcaFase = 'PLAN' | 'DO' | 'CHECK' | 'ACT';
export type PdcaStatus = 'NIET_GESTART' | 'BEZIG' | 'AFGEROND';

import type { AiSourceType } from './analysis.js';

export interface PdcaItem {
  id: string;
  schoolId: string;
  schooljaar: string;
  fase: PdcaFase;
  titel: string;
  beschrijving: string;
  status: PdcaStatus;
  deadline: string | null;
  bron: AiSourceType;
  bronDocumentId: string | null;
  vertrouwen: number | null;
  createdAt: string;
  updatedAt: string;
}
