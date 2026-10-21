CREATE TABLE "Consultation" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Consultation_leadId_completedAt_idx" ON "Consultation"("leadId", "completedAt");
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
