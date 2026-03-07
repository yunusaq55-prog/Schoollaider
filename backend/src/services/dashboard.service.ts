import prisma from '../utils/prisma.js';

export async function getDashboardStats(tenantId: string, schoolId?: string) {
  const schoolWhere = schoolId ? { tenantId, schoolId } : { tenantId };
  const tenantWhere = { tenantId };

  const [totalScholen, totalDocumenten, actief, afgerond, concept] = await Promise.all([
    prisma.school.count({ where: tenantWhere }),
    prisma.document.count({ where: schoolWhere }),
    prisma.pdcaCyclus.count({ where: { ...schoolWhere, status: 'ACTIEF' } }),
    prisma.pdcaCyclus.count({ where: { ...schoolWhere, status: 'AFGEROND' } }),
    prisma.pdcaCyclus.count({ where: { ...schoolWhere, status: 'CONCEPT' } }),
  ]);

  return {
    totalScholen,
    totalDocumenten,
    pdcaCycli: { actief, afgerond, concept },
  };
}
