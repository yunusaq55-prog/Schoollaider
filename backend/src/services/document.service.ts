import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { CreateDocumentRequest } from '@schoollaider/shared';

export async function listDocuments(tenantId: string, schoolId?: string) {
  return prisma.document.findMany({
    where: {
      tenantId,
      ...(schoolId ? { schoolId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocument(tenantId: string, id: string) {
  const doc = await prisma.document.findFirst({ where: { id, tenantId } });
  if (!doc) throw new NotFoundError('Document');
  return doc;
}

export async function createDocument(tenantId: string, userId: string, data: CreateDocumentRequest & { s3Key: string }) {
  return prisma.document.create({
    data: {
      tenantId,
      schoolId: data.schoolId,
      titel: data.titel,
      beschrijving: data.beschrijving,
      type: data.type,
      s3Key: data.s3Key,
      uploadedBy: userId,
    },
  });
}

export async function updateDocument(tenantId: string, id: string, data: { titel?: string; beschrijving?: string }) {
  await getDocument(tenantId, id);
  return prisma.document.update({ where: { id }, data });
}

export async function deleteDocument(tenantId: string, id: string) {
  await getDocument(tenantId, id);
  return prisma.document.delete({ where: { id } });
}
