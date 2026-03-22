-- CreateTable
CREATE TABLE "ops_signalen" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WAARSCHUWING',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "opgelost" BOOLEAN NOT NULL DEFAULT false,
    "aangemeld_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ops_signalen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "snapdatum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ops_signalen_tenant_id_opgelost_idx" ON "ops_signalen"("tenant_id", "opgelost");

-- CreateIndex
CREATE UNIQUE INDEX "ops_signalen_school_id_type_opgelost_key" ON "ops_signalen"("school_id", "type", "opgelost");

-- CreateIndex
CREATE INDEX "metric_snapshots_school_id_snapdatum_idx" ON "metric_snapshots"("school_id", "snapdatum");

-- AddForeignKey
ALTER TABLE "ops_signalen" ADD CONSTRAINT "ops_signalen_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_signalen" ADD CONSTRAINT "ops_signalen_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
