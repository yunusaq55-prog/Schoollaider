export interface Document {
  id: string;
  tenantId: string;
  schoolId: string;
  titel: string;
  beschrijving: string;
  s3Key: string;
  type: string;
  uploadedBy: string;
  versie: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  schoolId: string;
  titel: string;
  beschrijving: string;
  type: string;
}
