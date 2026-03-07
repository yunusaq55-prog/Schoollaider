// ─── HR Module Types ────────────────────────────────────────────────

// ─── Enums ──────────────────────────────────
export type HrRisico = 'STABIEL' | 'KWETSBAAR' | 'HOOG_RISICO';
export type HrPeriodeType = 'MAAND' | 'KWARTAAL' | 'JAAR';
export type HrSignaalStatus = 'OPEN' | 'IN_BEHANDELING' | 'AFGEHANDELD';
export type HrSignaalType = 'TEKORT' | 'VERZUIM' | 'VERVANGING' | 'UITSTROOM';

// ─── Module 1: Formatie & Capaciteit ────────
export interface FormatieData {
  id: string;
  schoolId: string;
  schooljaar: string;
  begroteFte: number;
  ingevuldeFte: number;
  vacatures: number;
  tijdelijkPct: number;
  fteLeerkracht: number;
  fteOop: number;
  fteDirectie: number;
  capaciteitsScore: number;
  updatedAt: string;
}

// ─── Module 2: Verzuim & Belastbaarheid ─────
export interface VerzuimData {
  id: string;
  schoolId: string;
  periode: string;
  verzuimPct: number;
  kortVerzuimPct: number;
  langVerzuimPct: number;
  ziekteVervangingsDagen: number;
  belastbaarheidsIndex: number;
  updatedAt: string;
}

// ─── Module 3: Vervangingsdruk ──────────────
export interface VervangingsData {
  id: string;
  schoolId: string;
  schooljaar: string;
  totaalVervangingsDagen: number;
  nietVervuldeDagen: number;
  kostenVervanging: number;
  totaalFte: number;
  vervangingsIndex: number;
  updatedAt: string;
}

// ─── Module 4: Leeftijd & Uitstroom ─────────
export interface LeeftijdData {
  id: string;
  schoolId: string;
  schooljaar: string;
  categorieOnder30: number;
  categorie30Tot40: number;
  categorie40Tot50: number;
  categorie50Tot60: number;
  categorie60Plus: number;
  verwachteUitstroom3Jaar: number;
  updatedAt: string;
}

// ─── Module 5: HR Risicoscore ───────────────
export interface HrRisicoScore {
  schoolId: string;
  schoolNaam: string;
  hrScore: number;
  formatieScore: number;
  verzuimScore: number;
  vervangingsScore: number;
  leeftijdScore: number;
  risico: HrRisico;
  trend: 'STIJGEND' | 'STABIEL' | 'DALEND';
}

// ─── HR Signalen (alerts) ───────────────────
export interface HrSignaal {
  id: string;
  schoolId: string;
  type: HrSignaalType;
  titel: string;
  beschrijving: string;
  aanbevolenActie: string;
  deadline: string | null;
  status: HrSignaalStatus;
  createdAt: string;
}

// ─── Bestuur HR Dashboard KPIs ──────────────
export interface HrBestuurKPIs {
  gemHrScore: number;
  scholenHoogRisico: number;
  totaalVacatures: number;
  totaalVervangingskosten: number;
  gemVerzuimPct: number;
}

// ─── School HR Overview Row ─────────────────
export interface HrSchoolOverviewRow {
  schoolId: string;
  schoolNaam: string;
  hrScore: number;
  formatieScore: number;
  verzuimPct: number;
  vervangingsIndex: number;
  risico: HrRisico;
  trend: 'STIJGEND' | 'STABIEL' | 'DALEND';
  openSignalen: number;
}

// ─── Request types ──────────────────────────
export interface CreateFormatieRequest {
  schooljaar: string;
  begroteFte: number;
  ingevuldeFte: number;
  vacatures: number;
  tijdelijkPct: number;
  fteLeerkracht: number;
  fteOop: number;
  fteDirectie: number;
}

export interface CreateVerzuimRequest {
  periode: string;
  verzuimPct: number;
  kortVerzuimPct: number;
  langVerzuimPct: number;
  ziekteVervangingsDagen: number;
}

export interface CreateVervangingsRequest {
  schooljaar: string;
  totaalVervangingsDagen: number;
  nietVervuldeDagen: number;
  kostenVervanging: number;
  totaalFte: number;
}

export interface CreateLeeftijdRequest {
  schooljaar: string;
  categorieOnder30: number;
  categorie30Tot40: number;
  categorie40Tot50: number;
  categorie50Tot60: number;
  categorie60Plus: number;
}
