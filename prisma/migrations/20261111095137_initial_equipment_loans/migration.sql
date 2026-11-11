-- CreateEnum
CREATE TYPE "Category" AS ENUM ('notebook', 'monitor', 'cabo', 'camera');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('disponivel', 'manutencao', 'emprestado');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipments" (
    "id" UUID NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patrimonio" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "Category" NOT NULL,
    "situacao" "EquipmentStatus" NOT NULL,
    "image_url" TEXT NOT NULL,
    "photo_id" INTEGER NOT NULL,
    "photo_sha256" TEXT NOT NULL,
    "photographer" TEXT NOT NULL,
    "photo_page" TEXT NOT NULL,
    "license_url" TEXT NOT NULL,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "equipment_id" UUID NOT NULL,
    "requested_at" TIMESTAMPTZ(3) NOT NULL,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "returned_at" TIMESTAMPTZ(3),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memberships_tenant_id_user_id_key" ON "memberships"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipments_tenant_id_patrimonio_key" ON "equipments"("tenant_id", "patrimonio");

-- CreateIndex
CREATE UNIQUE INDEX "equipments_tenant_id_photo_id_key" ON "equipments"("tenant_id", "photo_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipments_tenant_id_photo_sha256_key" ON "equipments"("tenant_id", "photo_sha256");

-- CreateIndex
CREATE UNIQUE INDEX "equipments_tenant_id_id_key" ON "equipments"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "loans_tenant_id_user_id_returned_at_idx" ON "loans"("tenant_id", "user_id", "returned_at");

-- CreateIndex
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits"("window_start");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_equipment_id_fkey" FOREIGN KEY ("tenant_id", "equipment_id") REFERENCES "equipments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_user_id_fkey" FOREIGN KEY ("tenant_id", "user_id") REFERENCES "memberships"("tenant_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Conflitos e RLS ficam junto do schema, sob Prisma Migrate.
CREATE UNIQUE INDEX loans_one_open_per_equipment
  ON loans (tenant_id, equipment_id) WHERE returned_at IS NULL;
ALTER TABLE loans ADD CONSTRAINT loans_due_after_request CHECK (due_at > requested_at);
ALTER TABLE equipments ADD CONSTRAINT equipment_photo_hash CHECK (photo_sha256 ~ '^[0-9a-f]{64}$');

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY deny_direct_tenants ON tenants FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_direct_memberships ON memberships FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_direct_equipments ON equipments FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_direct_loans ON loans FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_direct_audit ON audit_events FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_direct_rates ON rate_limits FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

CREATE FUNCTION reject_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events é somente de acréscimo';
END;
$$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_change();
