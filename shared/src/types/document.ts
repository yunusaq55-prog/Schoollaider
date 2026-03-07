export type DocumentType =
  | 'SCHOOLPLAN'
  | 'JAARPLAN'
  | 'VEILIGHEIDSBELEID'
  | 'SCHOOLGIDS'
  | 'SOP'
  | 'EVALUATIE'
  | 'OVERIG'
  | 'PEDAGOGISCH_BELEIDSPLAN'
  | 'RESULTATENANALYSE'
  | 'IB_JAARVERSLAG'
  | 'AUDITRAPPORT'
  | 'RIE'
  | 'OUDERCOMMISSIE_REGLEMENT';

export type DocumentStatus = 'ACTUEEL' | 'VERLOPEN' | 'CONCEPT';

export interface Document {
  id: string;
  tenantId: string;
  schoolId: string;
  titel: string;
  beschrijving: string;
  s3Key: string;
  type: DocumentType;
  status: DocumentStatus;
  uploadedBy: string;
  versie: number;
  vervaltDatum: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versie: number;
  s3Key: string;
  uploadedBy: string;
  opmerking: string;
  createdAt: string;
}

export interface CreateDocumentRequest {
  schoolId: string;
  titel: string;
  beschrijving: string;
  type: DocumentType;
  vervaltDatum?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
}
