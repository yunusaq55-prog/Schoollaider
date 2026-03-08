import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export async function listDocuments(tenantId: string, schoolId?: string) {
  return prisma.document.findMany({
    where: {
      tenantId,
      ...(schoolId ? { schoolId } : {}),
    },
    include: {
      _count: { select: { versions: true, standaardLinks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocument(tenantId: string, id: string) {
  const doc = await prisma.document.findFirst({
    where: { id, tenantId },
    include: {
      versions: { orderBy: { versie: 'desc' } },
      standaardLinks: { include: { standaard: true } },
    },
  });
  if (!doc) throw new NotFoundError('Document');
  return doc;
}

export async function getDocumentWithFile(tenantId: string, id: string) {
  const doc = await prisma.document.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      titel: true,
      mimeType: true,
      fileData: true,
    },
  });
  if (!doc) throw new NotFoundError('Document');
  return doc;
}

export async function createDocument(
  tenantId: string,
  userId: string,
  data: {
    schoolId: string;
    titel: string;
    beschrijving: string;
    type: string;
    vervaltDatum?: string;
    fileData: string;
    mimeType: string;
  },
) {
  return prisma.document.create({
    data: {
      tenantId,
      schoolId: data.schoolId,
      titel: data.titel,
      beschrijving: data.beschrijving,
      type: data.type as any,
      fileData: data.fileData,
      mimeType: data.mimeType,
      uploadedBy: userId,
      vervaltDatum: data.vervaltDatum ? new Date(data.vervaltDatum) : null,
    },
  });
}

export async function updateDocument(
  tenantId: string,
  id: string,
  data: { titel?: string; beschrijving?: string; status?: 'ACTUEEL' | 'VERLOPEN' | 'CONCEPT'; vervaltDatum?: string },
) {
  await getDocument(tenantId, id);
  return prisma.document.update({
    where: { id },
    data: {
      ...(data.titel !== undefined && { titel: data.titel }),
      ...(data.beschrijving !== undefined && { beschrijving: data.beschrijving }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.vervaltDatum !== undefined && { vervaltDatum: new Date(data.vervaltDatum) }),
    },
  });
}

export async function deleteDocument(tenantId: string, id: string) {
  await getDocument(tenantId, id);
  return prisma.document.delete({ where: { id } });
}

export async function createNewVersion(
  tenantId: string,
  userId: string,
  documentId: string,
  fileData: string,
  opmerking: string = '',
) {
  const doc = await getDocument(tenantId, documentId);
  const newVersie = doc.versie + 1;

  await prisma.documentVersion.create({
    data: {
      documentId,
      versie: doc.versie,
      fileData: doc.fileData,
      uploadedBy: doc.uploadedBy,
      opmerking,
    },
  });

  return prisma.document.update({
    where: { id: documentId },
    data: { fileData, versie: newVersie, uploadedBy: userId },
  });
}

export async function listDocumentVersions(tenantId: string, documentId: string) {
  await getDocument(tenantId, documentId);
  return prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { versie: 'desc' },
  });
}

export async function linkDocumentToStandaard(tenantId: string, documentId: string, standaardId: string) {
  await getDocument(tenantId, documentId);
  return prisma.documentStandaardLink.create({
    data: { documentId, standaardId },
  });
}

export async function unlinkDocumentFromStandaard(tenantId: string, documentId: string, standaardId: string) {
  await getDocument(tenantId, documentId);
  return prisma.documentStandaardLink.deleteMany({
    where: { documentId, standaardId },
  });
}

export async function getDocumentsByStandaard(tenantId: string, schoolId: string, standaardId: string) {
  return prisma.document.findMany({
    where: {
      tenantId,
      schoolId,
      standaardLinks: { some: { standaardId } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
