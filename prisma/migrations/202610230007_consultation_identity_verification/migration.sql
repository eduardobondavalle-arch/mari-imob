-- Public consultation submissions do not prove ownership of the supplied phone.
ALTER TABLE "Consultation"
ADD COLUMN "identityVerified" BOOLEAN NOT NULL DEFAULT false;
