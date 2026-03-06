-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'BESTUUR_ADMIN', 'BESTUUR_GEBRUIKER', 'SCHOOL_DIRECTEUR', 'SCHOOL_GEBRUIKER');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "brin_code" TEXT NOT NULL,
    "adres" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SCHOOL_GEBRUIKER',
    "school_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "versie" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspectie_domeinen" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "versie" TEXT NOT NULL,

    CONSTRAINT "inspectie_domeinen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspectie_standaarden" (
    "id" TEXT NOT NULL,
    "domein_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "toelichting" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "inspectie_standaarden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "inspectie_domeinen_code_key" ON "inspectie_domeinen"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inspectie_standaarden_code_key" ON "inspectie_standaarden"("code");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspectie_standaarden" ADD CONSTRAINT "inspectie_standaarden_domein_id_fkey" FOREIGN KEY ("domein_id") REFERENCES "inspectie_domeinen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
