export interface Tenant {
  id: string;
  naam: string;
  slug: string;
  active: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  naam: string;
  slug: string;
  settings?: Record<string, unknown>;
}

export type SchoolStatus = 'ACTIEF' | 'GEARCHIVEERD';

export interface School {
  id: string;
  tenantId: string;
  naam: string;
  brinCode: string;
  adres: string;
  directeur: string;
  leerlingaantal: number;
  status: SchoolStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolRequest {
  naam: string;
  brinCode: string;
  adres: string;
  directeur?: string;
  leerlingaantal?: number;
}
