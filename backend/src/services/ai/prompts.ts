/**
 * Prompt templates for AI document analysis.
 * All prompts are in Dutch to match the school inspection framework.
 */

export const INSPECTIEKADER_CONTEXT = `
Je bent een expert op het gebied van het Nederlandse onderwijsinspectiekader (2021).
Je analyseert documenten van basisscholen in het kader van kwaliteitszorg.

De 16 inspectiestandaarden zijn gegroepeerd in 5 domeinen:

DOMEIN OP – Onderwijsproces
- OP1 Aanbod: De school biedt de leerlingen een samenhangend curriculum aan.
- OP2 Zicht op ontwikkeling: De leraren volgen en analyseren de ontwikkeling van leerlingen.
- OP3 Didactisch handelen: De leraren geven de leerlingen duidelijke uitleg en bieden passende werkvormen.
- OP4 Extra ondersteuning: Leerlingen die dat nodig hebben ontvangen extra ondersteuning.
- OP5 Samenwerking: De school werkt samen met relevante partners om het onderwijs te versterken.
- OP6 Pedagogisch handelen: De leraren zorgen voor een respectvolle omgang in de groepen.

DOMEIN OR – Onderwijsresultaten
- OR1 Resultaten: De leerlingen behalen resultaten die passen bij hun ontwikkeling.
- OR2 Sociale competenties: De leerlingen ontwikkelen passende sociale competenties.

DOMEIN VE – Veiligheid en Schoolklimaat
- VE1 Sociale en fysieke veiligheid: De school zorgt voor de sociale en fysieke veiligheid van leerlingen.
- VE2 Pedagogisch klimaat: De school draagt zorg voor een goed pedagogisch klimaat.

DOMEIN KA – Kwaliteitszorg en Ambitie
- KA1 Kwaliteitszorg: De school heeft een stelsel van kwaliteitszorg.
- KA2 Verantwoording en dialoog: De school verantwoordt zich over de kwaliteit van het onderwijs.
- KA3 Ambitie: De school werkt planmatig aan verbeteractiviteiten.

DOMEIN SKA – Sturen, Kwaliteitszorg, Ambitie (Bestuur)
- SKA1 Visie en ambitie bestuur: Het bestuur heeft een heldere visie op de kwaliteit van het onderwijs.
- SKA2 Kwaliteitszorg bestuur: Het bestuur heeft een stelsel van kwaliteitszorg op bestuursniveau.
- SKA3 Financieel beheer: Het bestuur zorgt voor doelmatige inzet van middelen.
`.trim();

export const DOCUMENT_ANALYSIS_PROMPT = `
${INSPECTIEKADER_CONTEXT}

Analyseer het volgende schooldocument en retourneer een JSON-object met deze structuur:

{
  "sections": [
    {
      "titel": "Sectienaam uit het document",
      "inhoud": "Samenvatting van de inhoud (max 500 woorden)",
      "startPagina": 1,
      "eindPagina": 3,
      "standaarden": [
        {
          "code": "OP1",
          "relevance": 0.85,
          "evidence": "Specifiek bewijs uit deze sectie dat relevant is voor deze standaard"
        }
      ]
    }
  ],
  "gaps": [
    {
      "standaardCode": "VE1",
      "beschrijving": "Wat ontbreekt in het document voor deze standaard",
      "ernst": "hoog"
    }
  ],
  "overlaps": [
    {
      "standaardCodes": ["OP1", "KA1"],
      "beschrijving": "Waar secties overlappen voor meerdere standaarden"
    }
  ],
  "summary": "Korte samenvatting van het document (max 200 woorden)"
}

Regels:
- Wees specifiek in evidence: citeer of parafraseer concrete passages.
- relevance is een waarde tussen 0.0 en 1.0 (hoe relevant de sectie is voor de standaard).
- gaps: alleen standaarden die je zou verwachten in dit type document maar die ontbreken of onvoldoende onderbouwd zijn.
- ernst kan zijn: "hoog", "midden", of "laag".
- Gebruik alleen standaardcodes uit de 16 genoemde standaarden.
- Antwoord ALLEEN met valide JSON, geen extra tekst.

DOCUMENTTYPE: {{documentType}}
DOCUMENTTITEL: {{documentTitle}}

DOCUMENTINHOUD:
{{documentText}}
`.trim();

export const PDCA_SUGGESTIONS_PROMPT = `
${INSPECTIEKADER_CONTEXT}

Op basis van de volgende documentanalyses voor een school, genereer concrete PDCA-verbeteracties.

Retourneer een JSON-array met deze structuur:

[
  {
    "fase": "PLAN",
    "titel": "Korte actietitel",
    "beschrijving": "Gedetailleerde beschrijving van de verbeteractie",
    "bronSectie": "Naam van de bronsectie uit de analyse",
    "vertrouwen": 0.8,
    "gerelateerdeStandaarden": ["OP1", "KA1"]
  }
]

Regels:
- Genereer 4-8 suggesties verdeeld over PLAN, DO, CHECK en ACT fasen.
- fase: exact "PLAN", "DO", "CHECK" of "ACT".
- vertrouwen: 0.0-1.0, hoe zeker je bent dat dit een relevante actie is.
- Baseer suggesties op geïdentificeerde gaps en zwakke punten.
- Maak acties SMART: Specifiek, Meetbaar, Acceptabel, Realistisch, Tijdgebonden.
- Antwoord ALLEEN met valide JSON, geen extra tekst.

SCHOOLNAAM: {{schoolName}}
SCHOOLJAAR: {{schoolYear}}

ANALYSERESULTATEN:
{{analysisResults}}
`.trim();

export const COMPLIANCE_SUMMARY_PROMPT = `
${INSPECTIEKADER_CONTEXT}

Op basis van alle beschikbare analyses voor een school, maak een compliance-samenvatting per inspectiestandaard.

Retourneer een JSON-object met deze structuur:

{
  "standaarden": [
    {
      "code": "OP1",
      "status": "AANTOONBAAR",
      "confidence": 0.9,
      "evidence": "Korte samenvatting van het bewijs",
      "bronDocumenten": ["documenttitel 1", "documenttitel 2"],
      "aanbeveling": "Optionele aanbeveling voor verbetering"
    }
  ],
  "overallScore": 0.75,
  "risicoGebieden": ["Korte beschrijving van risico 1"],
  "sterktePunten": ["Korte beschrijving van sterk punt 1"]
}

Regels:
- status: "AANTOONBAAR" (voldoende bewijs), "ONVOLLEDIG" (deels bewijs), "ONTBREEKT" (geen bewijs).
- confidence: 0.0-1.0, hoe zeker je bent over de status.
- overallScore: gewogen gemiddelde (standaarden met gewicht 2 tellen dubbel).
- Wees eerlijk en objectief; geef geen hogere scores dan het bewijs rechtvaardigt.
- Antwoord ALLEEN met valide JSON, geen extra tekst.

SCHOOLNAAM: {{schoolName}}

BESCHIKBARE ANALYSES:
{{analyses}}
`.trim();

/**
 * Fill template placeholders like {{key}} with values.
 */
export function fillPrompt(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
