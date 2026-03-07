import OpenAI from 'openai';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { fillPrompt, DOCUMENT_ANALYSIS_PROMPT, PDCA_SUGGESTIONS_PROMPT, COMPLIANCE_SUMMARY_PROMPT } from './prompts.js';

// ─── OpenAI client ─────────────────────────────────────────

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is niet geconfigureerd');
    }
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

// ─── Zod schemas for structured output validation ──────────

const SectionMappingSchema = z.object({
  code: z.string(),
  relevance: z.number().min(0).max(1),
  evidence: z.string(),
});

const SectionSchema = z.object({
  titel: z.string(),
  inhoud: z.string(),
  startPagina: z.number().nullable().optional(),
  eindPagina: z.number().nullable().optional(),
  standaarden: z.array(SectionMappingSchema),
});

const GapSchema = z.object({
  standaardCode: z.string(),
  beschrijving: z.string(),
  ernst: z.enum(['hoog', 'midden', 'laag']),
});

const OverlapSchema = z.object({
  standaardCodes: z.array(z.string()),
  beschrijving: z.string(),
});

export const DocumentAnalysisResultSchema = z.object({
  sections: z.array(SectionSchema),
  gaps: z.array(GapSchema),
  overlaps: z.array(OverlapSchema),
  summary: z.string(),
});

export type DocumentAnalysisResult = z.infer<typeof DocumentAnalysisResultSchema>;

const PdcaSuggestionItemSchema = z.object({
  fase: z.enum(['PLAN', 'DO', 'CHECK', 'ACT']),
  titel: z.string(),
  beschrijving: z.string(),
  bronSectie: z.string().optional().nullable(),
  vertrouwen: z.number().min(0).max(1),
  gerelateerdeStandaarden: z.array(z.string()).optional(),
});

export const PdcaSuggestionsSchema = z.array(PdcaSuggestionItemSchema);
export type PdcaSuggestionsResult = z.infer<typeof PdcaSuggestionsSchema>;

const ComplianceStandaardSchema = z.object({
  code: z.string(),
  status: z.enum(['AANTOONBAAR', 'ONVOLLEDIG', 'ONTBREEKT']),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  bronDocumenten: z.array(z.string()),
  aanbeveling: z.string().optional().nullable(),
});

export const ComplianceSummarySchema = z.object({
  standaarden: z.array(ComplianceStandaardSchema),
  overallScore: z.number().min(0).max(1),
  risicoGebieden: z.array(z.string()),
  sterktePunten: z.array(z.string()),
});

export type ComplianceSummaryResult = z.infer<typeof ComplianceSummarySchema>;

// ─── Token counting helper ─────────────────────────────────

/** Rough token estimate: ~4 chars per token for Dutch text */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── LLM call helper ───────────────────────────────────────

async function callLLM(prompt: string): Promise<{ content: string; tokensUsed: number }> {
  const openai = getClient();

  const inputTokens = estimateTokens(prompt);
  console.log(`[LLM] Prompt tokens (geschat): ${inputTokens}`);

  // Truncate if too large (GPT-4o context is 128k, keep room for output)
  const MAX_INPUT_CHARS = 400_000; // ~100k tokens
  const truncatedPrompt =
    prompt.length > MAX_INPUT_CHARS
      ? prompt.slice(0, MAX_INPUT_CHARS) + '\n\n[TEKST INGEKORT - document te groot]'
      : prompt;

  const response = await openai.chat.completions.create({
    model: env.AI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Je bent een AI-assistent gespecialiseerd in het Nederlandse onderwijsinspectiekader. Antwoord altijd met valide JSON.',
      },
      { role: 'user', content: truncatedPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 8000,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const tokensUsed = response.usage?.total_tokens ?? estimateTokens(content);

  console.log(`[LLM] Tokens gebruikt: ${tokensUsed}`);

  return { content, tokensUsed };
}

// ─── Public API ────────────────────────────────────────────

/**
 * Analyze a document: extract sections, map to standards, find gaps.
 */
export async function analyzeDocument(
  documentText: string,
  documentType: string,
  documentTitle: string,
): Promise<{ result: DocumentAnalysisResult; tokensUsed: number }> {
  const prompt = fillPrompt(DOCUMENT_ANALYSIS_PROMPT, {
    documentType,
    documentTitle: documentTitle,
    documentText,
  });

  const { content, tokensUsed } = await callLLM(prompt);

  const parsed = JSON.parse(content);
  const result = DocumentAnalysisResultSchema.parse(parsed);

  return { result, tokensUsed };
}

/**
 * Generate PDCA improvement suggestions based on document analyses.
 */
export async function generatePdcaSuggestions(
  schoolName: string,
  schoolYear: string,
  analysisResults: string,
): Promise<{ result: PdcaSuggestionsResult; tokensUsed: number }> {
  const prompt = fillPrompt(PDCA_SUGGESTIONS_PROMPT, {
    schoolName,
    schoolYear,
    analysisResults,
  });

  const { content, tokensUsed } = await callLLM(prompt);

  // The response might be { suggestions: [...] } or directly [...]
  let parsed = JSON.parse(content);
  if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
    parsed = parsed.suggestions;
  } else if (!Array.isArray(parsed)) {
    // Try to find any array in the response
    const firstArray = Object.values(parsed).find(Array.isArray);
    if (firstArray) {
      parsed = firstArray;
    } else {
      parsed = [];
    }
  }

  const result = PdcaSuggestionsSchema.parse(parsed);

  return { result, tokensUsed };
}

/**
 * Generate a compliance summary for all standards based on analyses.
 */
export async function generateComplianceSummary(
  schoolName: string,
  analyses: string,
): Promise<{ result: ComplianceSummaryResult; tokensUsed: number }> {
  const prompt = fillPrompt(COMPLIANCE_SUMMARY_PROMPT, {
    schoolName,
    analyses,
  });

  const { content, tokensUsed } = await callLLM(prompt);

  const parsed = JSON.parse(content);
  const result = ComplianceSummarySchema.parse(parsed);

  return { result, tokensUsed };
}
