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

// ─── Operations Manager Prompts ────────────────────────────

export const MORNING_BRIEF_PROMPT = `
Je bent een operationeel manager bij een Nederlands schoolbestuur (primair onderwijs).
Je taak is om de dagelijkse prioriteitsbrief samen te stellen op basis van openstaande signalen.

Retourneer een JSON-object met deze structuur:

{
  "datum": "2024-01-15",
  "samenvatting": "Korte executive summary van de situatie (2-3 zinnen in professioneel Nederlands)",
  "aantalKritiek": 2,
  "aantalHoog": 5,
  "items": [
    {
      "prioriteit": "KRITIEK",
      "titel": "Korte titel van het signaal",
      "schoolNaam": "Naam van de school",
      "actie": "Concrete aanbevolen actie (1 zin)",
      "kanSluitenVandaag": false,
      "bron": "HR",
      "signaalId": "uuid-hier",
      "signaalType": "HrSignaal"
    }
  ],
  "kanVandaagAfsluiten": ["Titel van actie die vandaag afgesloten kan worden"]
}

Regels:
- Rangschik items op prioriteit: KRITIEK → HOOG → MIDDEL → LAAG
- bron is één van: "HR", "Subsidie", "PDCA", "Compliance"
- kanSluitenVandaag: true als het signaal eenvoudig bevestigd/afgesloten kan worden
- Schrijf alles in professioneel Nederlands
- Antwoord ALLEEN met valide JSON, geen extra tekst

DATUM: {{datum}}

OPENSTAANDE SIGNALEN:
{{signalen}}
`.trim();

export const ACTION_DRAFT_PROMPT = `
Je bent een operationeel manager bij een Nederlands schoolbestuur.
Op basis van een signaal, maak een conceptactie aan inclusief een concept-e-mail aan de schoolleider.

Retourneer een JSON-object met deze structuur:

{
  "titel": "Korte actietitel (max 80 tekens)",
  "beschrijving": "Gedetailleerde beschrijving van de actie en wat er van de schoolleider verwacht wordt",
  "prioriteit": "HOOG",
  "deadlineDagen": 14,
  "aanbevolenRol": "Schoolleider",
  "conceptEmail": {
    "onderwerp": "E-mail onderwerp",
    "tekst": "Volledige e-mailtekst in formeel Nederlands. Begin met een aanhef, eindigt met een afsluiting."
  }
}

Regels:
- prioriteit: "LAAG", "MIDDEL", "HOOG" of "KRITIEK"
- deadlineDagen: aantal dagen vanaf vandaag (KRITIEK=3, HOOG=7, MIDDEL=14, LAAG=30)
- conceptEmail.tekst: schrijf een volledige professionele e-mail, verwijs naar het signaal, vraag om concrete actie
- Antwoord ALLEEN met valide JSON, geen extra tekst

SIGNAAL:
{{signaal}}

SCHOOLNAAM: {{schoolNaam}}
DATUM: {{datum}}
`.trim();

export const AGENDA_PROMPT = `
Je bent een operationeel manager bij een Nederlands schoolbestuur.
Genereer een agenda voor een bestuursvergadering op basis van openstaande acties, signalen en beleidsevaluaties.

Retourneer een JSON-object met deze structuur:

{
  "items": [
    {
      "volgorde": 1,
      "titel": "Agendapunt titel",
      "toelichting": "Korte toelichting op het agendapunt",
      "type": "besluitvorming",
      "verantwoordelijke": "Rol of naam van verantwoordelijke",
      "duurMinuten": 15
    }
  ],
  "totaalDuurMinuten": 90,
  "samenvatting": "Korte samenvatting van de vergadering"
}

Regels:
- type: "besluitvorming", "informatie", "actie" of "rondvraag"
- Begin altijd met "Opening" (5 min) en eindig met "Rondvraag & Sluiting" (10 min)
- Prioriteer kritieke signalen en aankomende deadlines
- Maximaal 8 agendapunten
- Antwoord ALLEEN met valide JSON, geen extra tekst

VERGADERDATUM: {{vergaderdatum}}
VERGADERTITEL: {{vergadertitel}}

OPENSTAANDE ACTIES:
{{openActies}}

ACTUELE SIGNALEN:
{{signalen}}

AANKOMENDE BELEIDSEVALUATIES:
{{beleidsEvaluaties}}
`.trim();

export const COMMUNICATIE_PROMPT = `
Je bent een operationeel manager bij een Nederlands schoolbestuur.
Schrijf een professionele communicatie op basis van de gegeven intentie.

Retourneer een JSON-object met deze structuur:

{
  "onderwerp": "E-mail of brief onderwerp",
  "concept": "Volledige tekst van de communicatie in formeel Nederlands"
}

Regels:
- Schrijf in formeel, zakelijk Nederlands passend bij schoolbesturen
- Begin met een passende aanhef (bijv. "Geachte [naam],")
- Eindig met een professionele afsluiting
- De tekst moet direct bruikbaar zijn, geen placeholders
- Antwoord ALLEEN met valide JSON, geen extra tekst

INTENTIE VAN DE AFZENDER:
{{intentie}}

CONTEXT:
- School: {{schoolNaam}}
- Ontvanger: {{ontvangerNaam}} ({{ontvangerRol}})
- Datum: {{datum}}

{{stijlVoorbeelden}}
`.trim();

export const PREDICTIVE_BRIEF_PROMPT = `
Je bent een data-analist gespecialiseerd in HR-trends bij Nederlandse basisscholen.
Analyseer de historische verzuimdata en geef voorspellende inzichten.

Retourneer een JSON-object met deze structuur:

{
  "inzichten": [
    {
      "schoolNaam": "Naam van de school",
      "schoolId": "uuid",
      "type": "STIJGEND_VERZUIM",
      "beschrijving": "Duidelijke beschrijving van de trend in begrijpelijk Nederlands",
      "aanbeveling": "Concrete aanbeveling voor de operationeel manager",
      "waarschijnlijkheid": 0.75,
      "tijdshorizonWeken": 4
    }
  ]
}

Regels:
- type: "STIJGEND_VERZUIM", "UITSTROOM_RISICO", "KAPACITEITS_TEKORT", "STABIEL"
- waarschijnlijkheid: 0.0-1.0
- Alleen inzichten rapporteren waar een duidelijke trend zichtbaar is (>= 3 opeenvolgende perioden)
- Schrijf in professioneel Nederlands
- Antwoord ALLEEN met valide JSON, geen extra tekst

HISTORISCHE VERZUIMDATA PER SCHOOL:
{{verzuimData}}
`.trim();

export const DOCUMENT_SEARCH_PROMPT = `
Je bent een assistent van een operationeel manager bij een Nederlands schoolbestuur.
Beantwoord de vraag op basis van de beschikbare documentsecties.

Retourneer een JSON-object met deze structuur:

{
  "antwoord": "Duidelijk antwoord op de vraag in het Nederlands. Als het antwoord niet gevonden kan worden, zeg dat expliciet.",
  "gevonden": true,
  "bronnen": [
    {
      "documentTitel": "Titel van het brondocument",
      "sectionTitel": "Titel van de sectie",
      "datum": "2024-01-15",
      "relevantie": 0.9,
      "citaat": "Relevant citaat of parafrase uit de sectie (max 200 woorden)"
    }
  ]
}

Regels:
- Antwoord direct en concreet
- Verwijs altijd naar de bron(nen)
- Als geen relevant document gevonden: stel "gevonden": false en leg uit wat ontbreekt
- Antwoord ALLEEN met valide JSON, geen extra tekst

VRAAG: {{vraag}}

BESCHIKBARE DOCUMENTSECTIES:
{{secties}}
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
