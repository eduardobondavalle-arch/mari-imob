-- Condominium data is centralized and linked without changing existing listings.
CREATE TABLE "Condominium" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "neighborhood" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "complement" TEXT NOT NULL DEFAULT '',
  "postalCode" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "amenities" JSONB NOT NULL DEFAULT '[]',
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Condominium_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Property" ADD COLUMN "builtArea" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "landArea" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "condominiumId" TEXT;
ALTER TABLE "Media" ADD COLUMN "condominiumId" TEXT;

CREATE INDEX "Condominium_normalizedName_idx" ON "Condominium"("normalizedName");
CREATE INDEX "Condominium_city_neighborhood_idx" ON "Condominium"("city", "neighborhood");
CREATE INDEX "Condominium_archived_name_idx" ON "Condominium"("archived", "name");
CREATE INDEX "Property_condominiumId_idx" ON "Property"("condominiumId");
CREATE INDEX "Media_condominiumId_position_idx" ON "Media"("condominiumId", "position");

ALTER TABLE "Property" ADD CONSTRAINT "Property_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media" ADD CONSTRAINT "Media_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE SET NULL ON UPDATE CASCADE;
