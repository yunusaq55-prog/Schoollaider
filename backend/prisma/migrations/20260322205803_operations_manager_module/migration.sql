-- CreateEnum
CREATE TYPE "ActieStatus" AS ENUM ('OPEN', 'IN_BEHANDELING', 'AFGEROND', 'GEANNULEERD');

-- CreateEnum
CREATE TYPE "ActiePrioriteit" AS ENUM ('LAAG', 'MIDDEL', 'HOOG', 'KRITIEK');

-- CreateEnum
CREATE TYPE "ActieBron" AS ENUM ('HR_SIGNAAL', 'SUBSIDIE_SIGNAAL', 'PDCA_SUGGESTION', 'COMPLIANCE', 'HANDMATIG');

-- CreateEnum
CREATE TYPE "VergaderingStatus" AS ENUM ('CONCEPT', 'DEFINITIEF', 'AFGEROND');

-- CreateEnum
CREATE TYPE "BeleidsDocumentStatus" AS ENUM ('ACTIEF', 'VERLOPEN', 'ARCHIEF');

-- CreateEnum
CREATE TYPE "CommunicatieKanaal" AS ENUM ('EMAIL', 'BRIEF', 'NIEUWSBRIEF');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OPERATIONEEL_MANAGER';

-- CreateTable
CREATE TABLE "acties" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "school_id" TEXT,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "prioriteit" "ActiePrioriteit" NOT NULL DEFAULT 'MIDDEL',
    "status" "ActieStatus" NOT NULL DEFAULT 'OPEN',
    "bron" "ActieBron" NOT NULL DEFAULT 'HANDMATIG',
    "bron_signaal_id" TEXT,
    "bron_signaal_type" TEXT,
    "toegewezen_aan" TEXT,
    "deadline" TIMESTAMP(3),
    "afgeronden_op" TIMESTAMP(3),
    "concept_email" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "morning_briefs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "brief_json" JSONB NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "morning_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vergaderingen" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "locatie" TEXT NOT NULL DEFAULT '',
    "status" "VergaderingStatus" NOT NULL DEFAULT 'CONCEPT',
    "agenda_json" JSONB,
    "samenvatting" TEXT,
    "notulen_tekst" TEXT,
    "ai_gegenereerd" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vergaderingen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communicatie_drafts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "school_id" TEXT,
    "actie_id" TEXT,
    "kanaal" "CommunicatieKanaal" NOT NULL DEFAULT 'EMAIL',
    "onderwerp" TEXT NOT NULL,
    "ontvanger_naam" TEXT NOT NULL DEFAULT '',
    "ontvanger_email" TEXT,
    "intentie" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "definitief" BOOLEAN NOT NULL DEFAULT false,
    "verstuurd_op" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communicatie_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beleids_documenten" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "school_id" TEXT,
    "titel" TEXT NOT NULL,
    "domein" TEXT NOT NULL,
    "status" "BeleidsDocumentStatus" NOT NULL DEFAULT 'ACTIEF',
    "vastgesteld_datum" TIMESTAMP(3),
    "evaluatie_datum" TIMESTAMP(3),
    "volgend_evaluatie_datum" TIMESTAMP(3),
    "herinnering_dagen" INTEGER NOT NULL DEFAULT 30,
    "voortgang_notes" TEXT NOT NULL DEFAULT '',
    "document_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beleids_documenten_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acties_tenant_id_status_idx" ON "acties"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "acties_tenant_id_school_id_idx" ON "acties"("tenant_id", "school_id");

-- CreateIndex
CREATE INDEX "acties_tenant_id_deadline_idx" ON "acties"("tenant_id", "deadline");

-- CreateIndex
CREATE INDEX "morning_briefs_tenant_id_idx" ON "morning_briefs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "morning_briefs_tenant_id_datum_key" ON "morning_briefs"("tenant_id", "datum");

-- CreateIndex
CREATE INDEX "vergaderingen_tenant_id_datum_idx" ON "vergaderingen"("tenant_id", "datum");

-- CreateIndex
CREATE INDEX "communicatie_drafts_tenant_id_idx" ON "communicatie_drafts"("tenant_id");

-- CreateIndex
CREATE INDEX "communicatie_drafts_tenant_id_school_id_idx" ON "communicatie_drafts"("tenant_id", "school_id");

-- CreateIndex
CREATE INDEX "beleids_documenten_tenant_id_idx" ON "beleids_documenten"("tenant_id");

-- CreateIndex
CREATE INDEX "beleids_documenten_tenant_id_volgend_evaluatie_datum_idx" ON "beleids_documenten"("tenant_id", "volgend_evaluatie_datum");

-- AddForeignKey
ALTER TABLE "acties" ADD CONSTRAINT "acties_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acties" ADD CONSTRAINT "acties_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acties" ADD CONSTRAINT "acties_toegewezen_aan_fkey" FOREIGN KEY ("toegewezen_aan") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acties" ADD CONSTRAINT "acties_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morning_briefs" ADD CONSTRAINT "morning_briefs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vergaderingen" ADD CONSTRAINT "vergaderingen_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vergaderingen" ADD CONSTRAINT "vergaderingen_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communicatie_drafts" ADD CONSTRAINT "communicatie_drafts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communicatie_drafts" ADD CONSTRAINT "communicatie_drafts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communicatie_drafts" ADD CONSTRAINT "communicatie_drafts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beleids_documenten" ADD CONSTRAINT "beleids_documenten_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beleids_documenten" ADD CONSTRAINT "beleids_documenten_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beleids_documenten" ADD CONSTRAINT "beleids_documenten_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beleids_documenten" ADD CONSTRAINT "beleids_documenten_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
