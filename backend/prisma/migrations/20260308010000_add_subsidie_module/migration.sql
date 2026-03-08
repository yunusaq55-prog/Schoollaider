-- CreateEnum
CREATE TYPE "SubsidieStatus" AS ENUM ('GESIGNALEERD', 'ORIENTATIE', 'AANVRAAG_IN_VOORBEREIDING', 'INGEDIEND', 'TOEGEKEND', 'LOPEND', 'VERANTWOORDING_VEREIST', 'VERANTWOORD', 'AFGEROND', 'AFGEWEZEN', 'INGETROKKEN');

-- CreateEnum
CREATE TYPE "BestedingsCategorie" AS ENUM ('PERSONEEL', 'MATERIAAL', 'EXTERN_DIENSTEN', 'ICT', 'HUISVESTING', 'OVERHEAD', 'OVERIG');

-- CreateEnum
CREATE TYPE "SubsidieDocumentType" AS ENUM ('AANVRAAGFORMULIER', 'BESCHIKKING', 'VOORTGANGSRAPPORTAGE', 'EINDVERANTWOORDING', 'BIJLAGE', 'OVERIG');

-- CreateEnum
CREATE TYPE "SubsidieSignaalType" AS ENUM ('NIEUWE_SUBSIDIE', 'DEADLINE_AANVRAAG', 'DEADLINE_VERANTWOORDING', 'ONDERBESTEDING', 'BESCHIKKING_ONTVANGEN', 'SUBSIDIE_VERLOPEN', 'VERANTWOORDING_ONVOLLEDIG');

-- CreateEnum
CREATE TYPE "SubsidieUrgentie" AS ENUM ('INFO', 'WAARSCHUWING', 'KRITIEK');

-- CreateTable
CREATE TABLE "subsidie_regelingen" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "financier" TEXT NOT NULL,
    "financier_url" TEXT,
    "beschrijving" TEXT NOT NULL,
    "doelgroep" TEXT NOT NULL,
    "min_bedrag" DOUBLE PRECISION,
    "max_bedrag" DOUBLE PRECISION,
    "bedrag_per_eenheid" TEXT,
    "aanvraag_periode_open" TIMESTAMP(3),
    "aanvraag_periode_sluiting" TIMESTAMP(3),
    "project_periode_start" TIMESTAMP(3),
    "project_periode_einde" TIMESTAMP(3),
    "verantwoording_deadline" TEXT,
    "verantwoording_eisen" TEXT,
    "vereisten" TEXT,
    "tags" TEXT[],
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidie_regelingen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidie_matches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subsidie_id" TEXT NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "match_toelichting" TEXT,
    "gezien" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidie_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidie_dossiers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subsidie_id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "status" "SubsidieStatus" NOT NULL DEFAULT 'GESIGNALEERD',
    "bedrag_aangevraagd" DOUBLE PRECISION,
    "bedrag_toegekend" DOUBLE PRECISION,
    "bedrag_besteed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aanvraag_datum" TIMESTAMP(3),
    "beschikking_datum" TIMESTAMP(3),
    "project_start" TIMESTAMP(3),
    "project_einde" TIMESTAMP(3),
    "verantwoording_deadline" TIMESTAMP(3),
    "beschikkingsnummer" TEXT,
    "referentie" TEXT,
    "school_ids" TEXT[],
    "notities" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "subsidie_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidie_bestedingen" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "school_id" TEXT,
    "datum" TIMESTAMP(3) NOT NULL,
    "bedrag" DOUBLE PRECISION NOT NULL,
    "categorie" "BestedingsCategorie" NOT NULL,
    "omschrijving" TEXT NOT NULL,
    "bon_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "subsidie_bestedingen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidie_documenten" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "type" "SubsidieDocumentType" NOT NULL,
    "naam" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "versie" INTEGER NOT NULL DEFAULT 1,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subsidie_documenten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidie_verantwoordingen" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "checklist_items" JSONB NOT NULL,
    "voortgang_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ai_concept_tekst" TEXT,
    "ingediend_op" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidie_verantwoordingen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidie_signalen" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dossier_id" TEXT,
    "regeling_id" TEXT,
    "type" "SubsidieSignaalType" NOT NULL,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "urgentie" "SubsidieUrgentie" NOT NULL DEFAULT 'INFO',
    "gelezen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subsidie_signalen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subsidie_regelingen_slug_key" ON "subsidie_regelingen"("slug");
CREATE UNIQUE INDEX "subsidie_matches_tenant_id_subsidie_id_key" ON "subsidie_matches"("tenant_id", "subsidie_id");
CREATE INDEX "subsidie_matches_tenant_id_idx" ON "subsidie_matches"("tenant_id");
CREATE INDEX "subsidie_dossiers_tenant_id_idx" ON "subsidie_dossiers"("tenant_id");
CREATE INDEX "subsidie_dossiers_tenant_id_status_idx" ON "subsidie_dossiers"("tenant_id", "status");
CREATE INDEX "subsidie_bestedingen_dossier_id_idx" ON "subsidie_bestedingen"("dossier_id");
CREATE UNIQUE INDEX "subsidie_verantwoordingen_dossier_id_key" ON "subsidie_verantwoordingen"("dossier_id");
CREATE INDEX "subsidie_signalen_tenant_id_gelezen_idx" ON "subsidie_signalen"("tenant_id", "gelezen");

-- AddForeignKey
ALTER TABLE "subsidie_matches" ADD CONSTRAINT "subsidie_matches_subsidie_id_fkey" FOREIGN KEY ("subsidie_id") REFERENCES "subsidie_regelingen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subsidie_dossiers" ADD CONSTRAINT "subsidie_dossiers_subsidie_id_fkey" FOREIGN KEY ("subsidie_id") REFERENCES "subsidie_regelingen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subsidie_bestedingen" ADD CONSTRAINT "subsidie_bestedingen_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "subsidie_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subsidie_documenten" ADD CONSTRAINT "subsidie_documenten_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "subsidie_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subsidie_verantwoordingen" ADD CONSTRAINT "subsidie_verantwoordingen_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "subsidie_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subsidie_signalen" ADD CONSTRAINT "subsidie_signalen_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "subsidie_dossiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
