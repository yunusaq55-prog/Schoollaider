-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIEF', 'GEARCHIVEERD');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SCHOOLPLAN', 'JAARPLAN', 'VEILIGHEIDSBELEID', 'SCHOOLGIDS', 'SOP', 'EVALUATIE', 'OVERIG', 'PEDAGOGISCH_BELEIDSPLAN', 'RESULTATENANALYSE', 'IB_JAARVERSLAG', 'AUDITRAPPORT', 'RIE', 'OUDERCOMMISSIE_REGLEMENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTUEEL', 'VERLOPEN', 'CONCEPT');

-- CreateEnum
CREATE TYPE "BewijsStatus" AS ENUM ('AANTOONBAAR', 'ONVOLLEDIG', 'ONTBREEKT');

-- CreateEnum
CREATE TYPE "PdcaFase" AS ENUM ('PLAN', 'DO', 'CHECK', 'ACT');

-- CreateEnum
CREATE TYPE "PdcaStatus" AS ENUM ('NIET_GESTART', 'BEZIG', 'AFGEROND');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiSourceType" AS ENUM ('MANUAL', 'AI_GENERATED', 'AI_ASSISTED');

-- CreateEnum
CREATE TYPE "HrRisico" AS ENUM ('STABIEL', 'KWETSBAAR', 'HOOG_RISICO');

-- CreateEnum
CREATE TYPE "HrSignaalStatus" AS ENUM ('OPEN', 'IN_BEHANDELING', 'AFGEHANDELD');

-- AlterTable: Add new columns to schools
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "directeur" TEXT NOT NULL DEFAULT '';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "leerling_aantal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIEF';

-- AlterTable: Change documents.type from TEXT to DocumentType enum
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "status" "DocumentStatus" NOT NULL DEFAULT 'CONCEPT';
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "vervalt_datum" TIMESTAMP(3);

-- Cast documents.type from TEXT to DocumentType enum
DO $$
BEGIN
  -- Only alter if column is text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'type' AND data_type = 'text'
  ) THEN
    ALTER TABLE "documents" ALTER COLUMN "type" TYPE "DocumentType" USING "type"::"DocumentType";
  END IF;
END $$;

-- CreateIndex on documents
CREATE INDEX IF NOT EXISTS "documents_tenant_id_school_id_type_idx" ON "documents"("tenant_id", "school_id", "type");

-- AlterTable: Add gewicht to inspectie_standaarden
ALTER TABLE "inspectie_standaarden" ADD COLUMN IF NOT EXISTS "gewicht" INTEGER NOT NULL DEFAULT 1;

-- CreateTable: document_versions
CREATE TABLE IF NOT EXISTS "document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "versie" INTEGER NOT NULL,
    "s3_key" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "opmerking" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: document_standaard_links
CREATE TABLE IF NOT EXISTS "document_standaard_links" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "standaard_id" TEXT NOT NULL,

    CONSTRAINT "document_standaard_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable: school_standaard_statuses
CREATE TABLE IF NOT EXISTS "school_standaard_statuses" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "standaard_id" TEXT NOT NULL,
    "status" "BewijsStatus" NOT NULL DEFAULT 'ONTBREEKT',
    "bewijs" TEXT NOT NULL DEFAULT '',
    "evaluatie" TEXT NOT NULL DEFAULT '',
    "actueel" BOOLEAN NOT NULL DEFAULT false,
    "opmerking" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_standaard_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pdca_items
CREATE TABLE IF NOT EXISTS "pdca_items" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "fase" "PdcaFase" NOT NULL,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL DEFAULT '',
    "status" "PdcaStatus" NOT NULL DEFAULT 'NIET_GESTART',
    "deadline" TIMESTAMP(3),
    "bron" "AiSourceType" NOT NULL DEFAULT 'MANUAL',
    "bron_document_id" TEXT,
    "vertrouwen" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdca_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pdca_suggestions
CREATE TABLE IF NOT EXISTS "pdca_suggestions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "fase" "PdcaFase" NOT NULL,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL DEFAULT '',
    "bron_document_id" TEXT,
    "bron_sectie" TEXT,
    "vertrouwen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "pdca_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdca_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: readiness_scores
CREATE TABLE IF NOT EXISTS "readiness_scores" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "domain_scores" JSONB NOT NULL,
    "berekend_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable: document_analyses
CREATE TABLE IF NOT EXISTS "document_analyses" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "document_version" INTEGER NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "extracted_text" TEXT,
    "sections" JSONB,
    "mappings" JSONB,
    "gaps" JSONB,
    "overlaps" JSONB,
    "summary" TEXT,
    "token_count" INTEGER,
    "cost_cents" INTEGER,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: document_sections
CREATE TABLE IF NOT EXISTS "document_sections" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "inhoud" TEXT NOT NULL,
    "start_pagina" INTEGER,
    "eind_pagina" INTEGER,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: section_standaard_links
CREATE TABLE IF NOT EXISTS "section_standaard_links" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "standaard_id" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidence" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "section_standaard_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable: analysis_jobs
CREATE TABLE IF NOT EXISTS "analysis_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL DEFAULT 'full_analysis',
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "result_id" TEXT,
    "error_message" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: hr_formatie
CREATE TABLE IF NOT EXISTS "hr_formatie" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "begrote_fte" DOUBLE PRECISION NOT NULL,
    "ingevulde_fte" DOUBLE PRECISION NOT NULL,
    "vacatures" INTEGER NOT NULL DEFAULT 0,
    "tijdelijk_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fte_leerkracht" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fte_oop" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fte_directie" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capaciteits_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_formatie_pkey" PRIMARY KEY ("id")
);

-- CreateTable: hr_verzuim
CREATE TABLE IF NOT EXISTS "hr_verzuim" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "verzuim_pct" DOUBLE PRECISION NOT NULL,
    "kort_verzuim_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lang_verzuim_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ziekte_vervangings_dagen" INTEGER NOT NULL DEFAULT 0,
    "belastbaarheids_index" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_verzuim_pkey" PRIMARY KEY ("id")
);

-- CreateTable: hr_vervanging
CREATE TABLE IF NOT EXISTS "hr_vervanging" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "totaal_vervangings_dagen" INTEGER NOT NULL,
    "niet_vervulde_dagen" INTEGER NOT NULL DEFAULT 0,
    "kosten_vervanging" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totaal_fte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vervangings_index" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_vervanging_pkey" PRIMARY KEY ("id")
);

-- CreateTable: hr_leeftijd
CREATE TABLE IF NOT EXISTS "hr_leeftijd" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "categorie_onder_30" INTEGER NOT NULL DEFAULT 0,
    "categorie_30_tot_40" INTEGER NOT NULL DEFAULT 0,
    "categorie_40_tot_50" INTEGER NOT NULL DEFAULT 0,
    "categorie_50_tot_60" INTEGER NOT NULL DEFAULT 0,
    "categorie_60_plus" INTEGER NOT NULL DEFAULT 0,
    "verwachte_uitstroom_3_jaar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leeftijd_pkey" PRIMARY KEY ("id")
);

-- CreateTable: hr_signalen
CREATE TABLE IF NOT EXISTS "hr_signalen" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "aanbevolen_actie" TEXT NOT NULL DEFAULT '',
    "deadline" TIMESTAMP(3),
    "status" "HrSignaalStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_signalen_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "document_standaard_links_document_id_standaard_id_key" ON "document_standaard_links"("document_id", "standaard_id");
CREATE UNIQUE INDEX IF NOT EXISTS "school_standaard_statuses_school_id_standaard_id_key" ON "school_standaard_statuses"("school_id", "standaard_id");
CREATE INDEX IF NOT EXISTS "pdca_items_school_id_schooljaar_idx" ON "pdca_items"("school_id", "schooljaar");
CREATE INDEX IF NOT EXISTS "pdca_suggestions_school_id_schooljaar_status_idx" ON "pdca_suggestions"("school_id", "schooljaar", "status");
CREATE INDEX IF NOT EXISTS "readiness_scores_school_id_idx" ON "readiness_scores"("school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "document_analyses_document_id_document_version_key" ON "document_analyses"("document_id", "document_version");
CREATE INDEX IF NOT EXISTS "document_analyses_document_id_idx" ON "document_analyses"("document_id");
CREATE INDEX IF NOT EXISTS "document_sections_analysis_id_idx" ON "document_sections"("analysis_id");
CREATE UNIQUE INDEX IF NOT EXISTS "section_standaard_links_section_id_standaard_id_key" ON "section_standaard_links"("section_id", "standaard_id");
CREATE INDEX IF NOT EXISTS "analysis_jobs_tenant_id_status_idx" ON "analysis_jobs"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "analysis_jobs_document_id_idx" ON "analysis_jobs"("document_id");
CREATE UNIQUE INDEX IF NOT EXISTS "hr_formatie_school_id_schooljaar_key" ON "hr_formatie"("school_id", "schooljaar");
CREATE INDEX IF NOT EXISTS "hr_formatie_school_id_idx" ON "hr_formatie"("school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "hr_verzuim_school_id_periode_key" ON "hr_verzuim"("school_id", "periode");
CREATE INDEX IF NOT EXISTS "hr_verzuim_school_id_idx" ON "hr_verzuim"("school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "hr_vervanging_school_id_schooljaar_key" ON "hr_vervanging"("school_id", "schooljaar");
CREATE INDEX IF NOT EXISTS "hr_vervanging_school_id_idx" ON "hr_vervanging"("school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "hr_leeftijd_school_id_schooljaar_key" ON "hr_leeftijd"("school_id", "schooljaar");
CREATE INDEX IF NOT EXISTS "hr_leeftijd_school_id_idx" ON "hr_leeftijd"("school_id");
CREATE INDEX IF NOT EXISTS "hr_signalen_school_id_status_idx" ON "hr_signalen"("school_id", "status");

-- AddForeignKeys
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_standaard_links" ADD CONSTRAINT "document_standaard_links_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_standaard_links" ADD CONSTRAINT "document_standaard_links_standaard_id_fkey" FOREIGN KEY ("standaard_id") REFERENCES "inspectie_standaarden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_standaard_statuses" ADD CONSTRAINT "school_standaard_statuses_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_standaard_statuses" ADD CONSTRAINT "school_standaard_statuses_standaard_id_fkey" FOREIGN KEY ("standaard_id") REFERENCES "inspectie_standaarden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pdca_items" ADD CONSTRAINT "pdca_items_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pdca_suggestions" ADD CONSTRAINT "pdca_suggestions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pdca_suggestions" ADD CONSTRAINT "pdca_suggestions_pdca_item_id_fkey" FOREIGN KEY ("pdca_item_id") REFERENCES "pdca_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "readiness_scores" ADD CONSTRAINT "readiness_scores_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_analyses" ADD CONSTRAINT "document_analyses_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "document_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "section_standaard_links" ADD CONSTRAINT "section_standaard_links_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "document_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "section_standaard_links" ADD CONSTRAINT "section_standaard_links_standaard_id_fkey" FOREIGN KEY ("standaard_id") REFERENCES "inspectie_standaarden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_formatie" ADD CONSTRAINT "hr_formatie_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_verzuim" ADD CONSTRAINT "hr_verzuim_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_vervanging" ADD CONSTRAINT "hr_vervanging_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_leeftijd" ADD CONSTRAINT "hr_leeftijd_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_signalen" ADD CONSTRAINT "hr_signalen_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
