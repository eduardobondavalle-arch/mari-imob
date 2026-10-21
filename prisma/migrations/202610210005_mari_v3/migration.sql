ALTER TABLE "Lead" ADD COLUMN "qualified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "superFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "condominiumFee" DECIMAL(14,2), ADD COLUMN "condominiumPeriod" TEXT,
ADD COLUMN "iptuFee" DECIMAL(14,2), ADD COLUMN "iptuPeriod" TEXT,
ADD COLUMN "trashFee" DECIMAL(14,2), ADD COLUMN "trashPeriod" TEXT,
ADD COLUMN "otherFees" DECIMAL(14,2), ADD COLUMN "otherFeesPeriod" TEXT,
ADD COLUMN "otherFeesDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "LeadStage" ADD COLUMN "funnelEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "funnelPosition" INTEGER;

CREATE TABLE "OwnerSubmission" (
  "id" TEXT NOT NULL, "leadId" TEXT NOT NULL, "purpose" TEXT NOT NULL,
  "propertyType" TEXT NOT NULL, "city" TEXT NOT NULL, "neighborhood" TEXT NOT NULL,
  "location" TEXT NOT NULL DEFAULT '', "area" DOUBLE PRECISION, "bedrooms" INTEGER,
  "askingPrice" DECIMAL(14,2), "notes" TEXT NOT NULL DEFAULT '', "status" TEXT NOT NULL DEFAULT 'new',
  "convertedPropertyId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "OwnerSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OwnerSubmission_convertedPropertyId_key" ON "OwnerSubmission"("convertedPropertyId");
CREATE INDEX "OwnerSubmission_status_createdAt_idx" ON "OwnerSubmission"("status", "createdAt");
ALTER TABLE "OwnerSubmission" ADD CONSTRAINT "OwnerSubmission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OwnerSubmission" ADD CONSTRAINT "OwnerSubmission_convertedPropertyId_fkey" FOREIGN KEY ("convertedPropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media" ADD COLUMN "ownerSubmissionId" TEXT;
CREATE INDEX "Media_ownerSubmissionId_idx" ON "Media"("ownerSubmissionId");
ALTER TABLE "Media" ADD CONSTRAINT "Media_ownerSubmissionId_fkey" FOREIGN KEY ("ownerSubmissionId") REFERENCES "OwnerSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "News" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '', "city" TEXT NOT NULL, "coverImage" TEXT NOT NULL DEFAULT '',
  "sourceUrl" TEXT NOT NULL DEFAULT '', "published" BOOLEAN NOT NULL DEFAULT false,
  "featured" BOOLEAN NOT NULL DEFAULT false, "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");
CREATE INDEX "News_published_featured_publishedAt_idx" ON "News"("published", "featured", "publishedAt");

CREATE TABLE "LeadMovement" (
  "id" TEXT NOT NULL, "leadId" TEXT NOT NULL, "fromStageId" TEXT, "toStageId" TEXT NOT NULL,
  "authorId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeadMovement_leadId_createdAt_idx" ON "LeadMovement"("leadId", "createdAt");
CREATE INDEX "LeadMovement_toStageId_createdAt_idx" ON "LeadMovement"("toStageId", "createdAt");
ALTER TABLE "LeadMovement" ADD CONSTRAINT "LeadMovement_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadMovement" ADD CONSTRAINT "LeadMovement_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "LeadStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadMovement" ADD CONSTRAINT "LeadMovement_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "LeadStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeadMovement" ADD CONSTRAINT "LeadMovement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
