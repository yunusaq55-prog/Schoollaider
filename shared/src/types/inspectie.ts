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
  gewicht: number;
}

export type BewijsStatus = 'AANTOONBAAR' | 'ONVOLLEDIG' | 'ONTBREEKT';

export interface SchoolStandaardStatus {
  id: string;
  schoolId: string;
  standaardId: string;
  status: BewijsStatus;
  bewijs: string;
  evaluatie: string;
  actueel: boolean;
  opmerking: string;
  updatedAt: string;
  standaard?: InspectieStandaard;
}
