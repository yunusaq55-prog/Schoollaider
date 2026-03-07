export type PdcaFase = 'PLAN' | 'DO' | 'CHECK' | 'ACT';
export type PdcaStatus = 'CONCEPT' | 'ACTIEF' | 'AFGEROND';

export interface PdcaCyclus {
  id: string;
  tenantId: string;
  schoolId: string;
  titel: string;
  beschrijving: string;
  schooljaar: string;
  fase: PdcaFase;
  status: PdcaStatus;
  startDatum: string | null;
  eindDatum: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  acties?: PdcaActie[];
}

export interface PdcaActie {
  id: string;
  cyclusId: string;
  fase: PdcaFase;
  titel: string;
  beschrijving: string;
  verantwoordelijke: string;
  deadline: string | null;
  afgerond: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePdcaCyclusRequest {
  schoolId: string;
  titel: string;
  beschrijving: string;
  schooljaar: string;
}

export interface CreatePdcaActieRequest {
  fase: PdcaFase;
  titel: string;
  beschrijving: string;
  verantwoordelijke?: string;
  deadline?: string;
}
