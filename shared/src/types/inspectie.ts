export interface InspectieDomein {
  id: string;
  code: string;
  naam: string;
  beschrijving: string;
  versie: string;
  standaarden?: InspectieStandaard[];
}

export interface InspectieStandaard {
  id: string;
  domeinId: string;
  code: string;
  naam: string;
  beschrijving: string;
  toelichting: string;
}
