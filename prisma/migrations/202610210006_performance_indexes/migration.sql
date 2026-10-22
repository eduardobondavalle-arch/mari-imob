BEGIN;

CREATE INDEX "Lead_lastActivityAt_idx" ON "Lead"("lastActivityAt" DESC);

CREATE INDEX "Session_adminId_idx" ON "Session"("adminId");
CREATE INDEX "Session_leadId_idx" ON "Session"("leadId");

CREATE INDEX "Property_status_purpose_featured_createdAt_id_idx"
ON "Property"("status", "purpose", "featured" DESC, "createdAt" DESC, "id");

CREATE INDEX "Property_status_purpose_superFeatured_updatedAt_idx"
ON "Property"("status", "purpose", "superFeatured", "updatedAt" DESC);

CREATE INDEX "Property_status_purpose_price_id_idx"
ON "Property"("status", "purpose", "price", "id");

CREATE INDEX "ContactRequest_status_createdAt_idx"
ON "ContactRequest"("status", "createdAt" DESC);

COMMIT;
