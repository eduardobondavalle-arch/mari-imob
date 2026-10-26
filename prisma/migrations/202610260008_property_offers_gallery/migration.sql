-- Add independent commercial offers without duplicating properties.
CREATE TABLE "PropertyOffer" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "price" DECIMAL(14,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyOffer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyOffer_propertyId_purpose_key"
ON "PropertyOffer"("propertyId", "purpose");

CREATE INDEX "PropertyOffer_purpose_active_price_idx"
ON "PropertyOffer"("purpose", "active", "price");

ALTER TABLE "PropertyOffer"
ADD CONSTRAINT "PropertyOffer_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve every existing listing as its first active offer.
INSERT INTO "PropertyOffer" ("id", "propertyId", "purpose", "price", "active", "createdAt", "updatedAt")
SELECT 'offer-' || "id", "id", "purpose", "price", true, "createdAt", "updatedAt"
FROM "Property"
ON CONFLICT ("propertyId", "purpose") DO NOTHING;

ALTER TABLE "SelectionItem" ADD COLUMN "purpose" TEXT;

-- The tag remains managed by the existing configurable tag system.
INSERT INTO "Tag" ("id", "name", "key")
VALUES ('tag-installment', 'Aceita parcelamento', 'installment')
ON CONFLICT ("name") DO UPDATE SET "key" = COALESCE("Tag"."key", EXCLUDED."key");
