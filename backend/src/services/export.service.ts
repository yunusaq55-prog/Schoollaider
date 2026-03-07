import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import prisma from '../utils/prisma.js';
import { calculateSchoolScore } from './readiness.service.js';
import { analyzeSchool } from './gap-analysis.service.js';
import { getPdcaCycleStatus, getCurrentSchoolYear } from './pdca.service.js';
import { buildEvidencePackage } from './evidence-builder.service.js';

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

export async function generateInspectiedossier(tenantId: string, schoolId: string): Promise<Buffer> {
  const school = await prisma.school.findFirstOrThrow({ where: { id: schoolId, tenantId } });
  const tenant = await prisma.tenant.findFirstOrThrow({ where: { id: tenantId } });

  const scoreData = await calculateSchoolScore(tenantId, schoolId);
  const gaps = await analyzeSchool(tenantId, schoolId);
  const schooljaar = getCurrentSchoolYear();
  const pdcaStatus = await getPdcaCycleStatus(schoolId, schooljaar);

  const domeinen = await prisma.inspectieDomein.findMany({
    include: {
      standaarden: {
        include: {
          schoolStatuses: { where: { schoolId } },
          documentLinks: { where: { document: { schoolId } }, include: { document: true } },
        },
        orderBy: { code: 'asc' },
      },
    },
    orderBy: { code: 'asc' },
  });

  const documents = await prisma.document.findMany({
    where: { tenantId, schoolId },
    orderBy: { type: 'asc' },
  });

  const now = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });

  const content: Content[] = [
    // Cover
    { text: 'Inspectiedossier', style: 'title', margin: [0, 100, 0, 20] },
    { text: school.naam, style: 'subtitle', margin: [0, 0, 0, 10] },
    { text: `BRIN: ${school.brinCode}`, style: 'normal', margin: [0, 0, 0, 5] },
    { text: `Bestuur: ${tenant.naam}`, style: 'normal', margin: [0, 0, 0, 5] },
    { text: `Datum: ${now}`, style: 'normal', margin: [0, 0, 0, 5] },
    { text: `Schooljaar: ${schooljaar}`, style: 'normal', margin: [0, 0, 0, 40] },

    // Score overview
    { text: `Readiness Score: ${scoreData.totalScore}/100`, style: 'header', pageBreak: 'before' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto'],
        body: [
          [{ text: 'Domein', bold: true }, { text: 'Score', bold: true }],
          ...scoreData.domainScores.map((d) => [d.naam, `${d.score}%`]),
        ],
      },
      margin: [0, 10, 0, 20],
    },

    // Document overview
    { text: 'Beleidsoverzicht', style: 'header' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body: [
          [{ text: 'Document', bold: true }, { text: 'Type', bold: true }, { text: 'Status', bold: true }, { text: 'Versie', bold: true }],
          ...documents.map((d) => [d.titel, d.type, d.status, `v${d.versie}`]),
          ...(documents.length === 0 ? [['Geen documenten', '', '', '']] : []),
        ],
      },
      margin: [0, 10, 0, 20],
    },

    // Per domain
    { text: 'Status per Inspectiedomein', style: 'header', pageBreak: 'before' },
    ...domeinen.flatMap((domein): Content[] => [
      { text: `${domein.code} - ${domein.naam}`, style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto'],
          body: [
            [{ text: 'Code', bold: true }, { text: 'Standaard', bold: true }, { text: 'Status', bold: true }, { text: 'Bewijs', bold: true }],
            ...domein.standaarden.map((s) => {
              const status = s.schoolStatuses[0];
              const docCount = s.documentLinks.length;
              return [
                s.code,
                s.naam,
                status?.status ?? 'ONTBREEKT',
                `${docCount} doc(s)`,
              ];
            }),
          ],
        },
        margin: [0, 5, 0, 10],
      },
    ]),

    // Gap analysis
    { text: 'Gapanalyse', style: 'header', pageBreak: 'before' },
    { text: `Ontbrekende documenten: ${gaps.missingDocuments.length}`, style: 'normal', margin: [0, 5, 0, 2] },
    ...gaps.missingDocuments.map((d): Content => ({ text: `  - ${d.description}`, style: 'normal' })),
    { text: `Ontbrekende evaluaties: ${gaps.missingEvaluations.length}`, style: 'normal', margin: [0, 10, 0, 2] },
    ...gaps.missingEvaluations.map((e): Content => ({ text: `  - ${e.standaardCode}: ${e.standaardNaam}`, style: 'normal' })),
    { text: `Verouderd beleid: ${gaps.outdatedPolicies.length}`, style: 'normal', margin: [0, 10, 0, 2] },
    ...gaps.outdatedPolicies.map((p): Content => ({ text: `  - ${p.titel}`, style: 'normal' })),
    { text: `Standaarden zonder bewijs: ${gaps.standardsWithoutEvidence.length}`, style: 'normal', margin: [0, 10, 0, 2] },

    // AI Evidence section (only if analyses exist)
    ...await buildAiEvidenceSection(tenantId, schoolId),

    // PDCA
    { text: 'PDCA Overzicht', style: 'header', margin: [0, 20, 0, 10] },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body: [
          [{ text: 'Fase', bold: true }, { text: 'Items', bold: true }, { text: 'Afgerond', bold: true }, { text: 'Compleet', bold: true }],
          ...pdcaStatus.map((p) => [p.fase, `${p.totalItems}`, `${p.completedItems}`, p.isComplete ? 'Ja' : 'Nee']),
        ],
      },
      margin: [0, 5, 0, 10],
    },
  ];

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: { font: 'Helvetica' },
    content,
    styles: {
      title: { fontSize: 28, bold: true, color: '#1e3a8a' },
      subtitle: { fontSize: 20, color: '#2563eb' },
      header: { fontSize: 16, bold: true, color: '#1e3a8a', margin: [0, 15, 0, 5] },
      subheader: { fontSize: 13, bold: true, color: '#2563eb' },
      normal: { fontSize: 10 },
    },
    pageMargins: [40, 40, 40, 40],
    footer: (currentPage, pageCount) => ({
      text: `SchoollAIder - Inspectiedossier ${school.naam} | Pagina ${currentPage} van ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      margin: [0, 10, 0, 0],
      color: '#999999',
    }),
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

async function buildAiEvidenceSection(tenantId: string, schoolId: string): Promise<Content[]> {
  try {
    const evidence = await buildEvidencePackage(tenantId, schoolId);
    if (evidence.aiSummaries.length === 0) return [];

    const sections: Content[] = [
      { text: 'AI Borgingsbewijzen', style: 'header', pageBreak: 'before' },
      { text: `AI Compliance Score: ${evidence.complianceMatrix.overallScore}%`, style: 'subheader', margin: [0, 5, 0, 10] },
    ];

    // AI Summaries
    if (evidence.aiSummaries.length > 0) {
      sections.push({ text: 'Documentsamenvatting (AI)', style: 'subheader', margin: [0, 10, 0, 5] });
      for (const summary of evidence.aiSummaries) {
        sections.push(
          { text: `${summary.documentTitel} (${summary.documentType})`, bold: true, fontSize: 10, margin: [0, 5, 0, 2] } as Content,
          { text: summary.summary || 'Geen samenvatting beschikbaar.', fontSize: 9, margin: [0, 0, 0, 5], color: '#444444' } as Content,
        );
      }
    }

    // AI Evidence per standaard
    sections.push({ text: 'Bewijs per Standaard (AI)', style: 'subheader', margin: [0, 15, 0, 5] });
    for (const domein of evidence.complianceMatrix.domeinen) {
      const standaardenMetBewijs = domein.standaarden.filter((s) => s.evidence.length > 0);
      if (standaardenMetBewijs.length === 0) continue;

      sections.push({ text: `${domein.code} - ${domein.naam} (${domein.score}%)`, bold: true, fontSize: 11, margin: [0, 8, 0, 3] } as Content);

      for (const s of standaardenMetBewijs) {
        sections.push(
          { text: `${s.code} ${s.naam} — ${s.status}${s.aiConfidence != null ? ` (${Math.round(s.aiConfidence * 100)}% vertrouwen)` : ''}`, fontSize: 10, bold: true, margin: [10, 3, 0, 1] } as Content,
          { text: `Bronnen: ${s.documenten.join(', ')}`, fontSize: 8, color: '#666666', margin: [10, 0, 0, 2] } as Content,
        );
        for (const ev of s.evidence.slice(0, 2)) {
          sections.push({ text: `→ ${ev}`, fontSize: 8, italics: true, color: '#555555', margin: [15, 0, 0, 1] } as Content);
        }
      }
    }

    // AI detected gaps
    if (evidence.gaps.length > 0) {
      sections.push({ text: 'AI-gedetecteerde Gaps', style: 'subheader', margin: [0, 15, 0, 5] });
      for (const gap of evidence.gaps) {
        sections.push({
          text: `[${gap.ernst.toUpperCase()}] ${gap.standaardCode}: ${gap.beschrijving}`,
          fontSize: 9,
          margin: [0, 2, 0, 0],
          color: gap.ernst === 'hoog' ? '#dc2626' : gap.ernst === 'midden' ? '#d97706' : '#666666',
        } as Content);
      }
    }

    return sections;
  } catch {
    // If evidence building fails, return empty — don't break the PDF
    return [];
  }
}
