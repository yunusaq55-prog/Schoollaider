// ──────────────────────────────────────────────
// Subsidie Genie – shared types
// ──────────────────────────────────────────────

// ── Enums (union types) ──

export type SubsidieStatus =
  | 'GESIGNALEERD'
  | 'ORIENTATIE'
  | 'AANVRAAG_IN_VOORBEREIDING'
  | 'INGEDIEND'
  | 'TOEGEKEND'
  | 'LOPEND'
  | 'VERANTWOORDING_VEREIST'
  | 'VERANTWOORD'
  | 'AFGEROND'
  | 'AFGEWEZEN'
  | 'INGETROKKEN';

export type BestedingsCategorie =
  | 'PERSONEEL'
  | 'MATERIAAL'
  | 'EXTERN_DIENSTEN'
  | 'ICT'
  | 'HUISVESTING'
  | 'OVERHEAD'
  | 'OVERIG';

export type SubsidieDocumentType =
  | 'AANVRAAGFORMULIER'
  | 'BESCHIKKING'
  | 'VOORTGANGSRAPPORTAGE'
  | 'EINDVERANTWOORDING'
  | 'BIJLAGE'
  | 'OVERIG';

export type SubsidieSignaalType =
  | 'NIEUWE_SUBSIDIE'
  | 'DEADLINE_AANVRAAG'
  | 'DEADLINE_VERANTWOORDING'
  | 'ONDERBESTEDING'
  | 'BESCHIKKING_ONTVANGEN'
  | 'SUBSIDIE_VERLOPEN'
  | 'VERANTWOORDING_ONVOLLEDIG';

export type SubsidieUrgentie = 'INFO' | 'WAARSCHUWING' | 'KRITIEK';

// ── Domain models ──

export interface SubsidieRegeling {
  id: string;
  naam: string;
  verstrekker: string;
  beschrijving: string;
  minimaalBedrag: number | null;
  maximaalBedrag: number | null;
  deadlineAanvraag: string | null;
  deadlineVerantwoording: string | null;
  url: string | null;
  isActief: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubsidieMatch {
  id: string;
  tenantId: string;
  regelingId: string;
  regeling?: SubsidieRegeling;
  score: number;
  rpiMatch: string[];
  toelichting: string | null;
  isGezien: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubsidieDossier {
  id: string;
  tenantId: string;
  regelingId: string;
  regeling?: SubsidieRegeling;
  status: SubsidieStatus;
  aangevraagdBedrag: number | null;
  toegekendBedrag: number | null;
  ontvangstdatum: string | null;
  startdatum: string | null;
  einddatum: string | null;
  verantwoordingsdeadline: string | null;
  notities: string | null;
  bestedingen?: SubsidieBesteding[];
  documenten?: SubsidieDocument[];
  verantwoordingen?: SubsidieVerantwoording[];
  createdAt: string;
  updatedAt: string;
}

export interface SubsidieBesteding {
  id: string;
  dossierId: string;
  categorie: BestedingsCategorie;
  omschrijving: string;
  bedrag: number;
  datum: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubsidieDocument {
  id: string;
  dossierId: string;
  type: SubsidieDocumentType;
  naam: string;
  url: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubsidieVerantwoording {
  id: string;
  dossierId: string;
  rapportageperiode: string;
  bestedTotaal: number;
  toelichting: string | null;
  ingediendOp: string | null;
  isCompleet: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubsidieSignaal {
  id: string;
  tenantId: string;
  dossierId: string | null;
  regelingId: string | null;
  type: SubsidieSignaalType;
  urgentie: SubsidieUrgentie;
  titel: string;
  bericht: string;
  isGelezen: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Dashboard & calendar ──

export interface DeadlineItem {
  dossierId: string;
  dossierNaam: string;
  deadline: string;
  dagenResterend: number;
}

export interface SubsidieDashboardKpis {
  totalOntvangen: number;
  aantalLopend: number;
  aantalInAanvraag: number;
  deadlinesKomende30Dagen: {
    aanvraag: DeadlineItem[];
    verantwoording: DeadlineItem[];
  };
  gemistPotentieel: number;
  verantwoordingsRisico: {
    dossierId: string;
    dossierNaam: string;
    reden: string;
  }[];
  pipelineDistributie: Record<SubsidieStatus, number>;
}

export interface SubsidieKalenderItem {
  id: string;
  dossierId: string | null;
  regelingId: string | null;
  titel: string;
  datum: string;
  type: 'DEADLINE_AANVRAAG' | 'DEADLINE_VERANTWOORDING' | 'START' | 'EINDE';
}

// ── Request DTOs ──

export interface CreateDossierRequest {
  regelingId: string;
  status?: SubsidieStatus;
  aangevraagdBedrag?: number | null;
  toegekendBedrag?: number | null;
  ontvangstdatum?: string | null;
  startdatum?: string | null;
  einddatum?: string | null;
  verantwoordingsdeadline?: string | null;
  notities?: string | null;
}

export interface CreateBestedingRequest {
  dossierId: string;
  categorie: BestedingsCategorie;
  omschrijving: string;
  bedrag: number;
  datum: string;
}
