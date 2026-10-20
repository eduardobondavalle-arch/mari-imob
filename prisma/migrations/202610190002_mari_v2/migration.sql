BEGIN;
CREATE TABLE "City" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "state" TEXT NOT NULL DEFAULT 'SC');
INSERT INTO "City" (id,name) VALUES ('balneario-camboriu-sc','Balneário Camboriú'),('itajai-sc','Itajaí'),('camboriu-sc','Camboriú');
ALTER TABLE "Property" ADD COLUMN "cityId" TEXT REFERENCES "City"(id) ON DELETE SET NULL, ADD COLUMN "bathrooms" INTEGER;
UPDATE "Property" p SET "cityId" = c.id FROM "City" c WHERE lower(trim(p.city)) = lower(c.name);
CREATE INDEX "Property_cityId_idx" ON "Property"("cityId");
ALTER TABLE "Tag" ADD COLUMN "key" TEXT;
CREATE UNIQUE INDEX "Tag_key_key" ON "Tag"("key");
UPDATE "Tag" SET "key" = 'trade_in' WHERE id = (SELECT id FROM "Tag" WHERE lower(trim(name)) = 'aceita permuta' ORDER BY id LIMIT 1);
INSERT INTO "Tag" (id,name,"key") SELECT 'tag-trade-in','Aceita permuta','trade_in' WHERE NOT EXISTS (SELECT 1 FROM "Tag" WHERE "key"='trade_in');
INSERT INTO "Taxonomy" (id,kind,name) SELECT 'situation-off-plan','situation','Na planta' WHERE NOT EXISTS (SELECT 1 FROM "Taxonomy" WHERE kind='situation' AND lower(name)='na planta');
INSERT INTO "CustomField" (id,label,type,required,public,filterable,archived,"createdAt")
SELECT id,label,'boolean',false,true,true,false,CURRENT_TIMESTAMP FROM (VALUES
 ('field-furnished','Mobiliado'),('field-part-furnished','Semimobiliado'),('field-sea-view','Vista para o mar'),
 ('field-pool','Piscina'),('field-barbecue','Churrasqueira'),('field-balcony','Sacada'),('field-gourmet-balcony','Varanda gourmet'),('field-leisure','Área de lazer')
) AS f(id,label) WHERE NOT EXISTS (SELECT 1 FROM "CustomField" c WHERE lower(c.label)=lower(f.label) AND NOT c.archived);

CREATE TABLE "LeadStage" (id TEXT PRIMARY KEY,name TEXT NOT NULL,position INTEGER NOT NULL DEFAULT 0,"isDefault" BOOLEAN NOT NULL DEFAULT false);
INSERT INTO "LeadStage" (id,name,"isDefault") VALUES ('stage-new-lead','Novo Lead',true);
CREATE UNIQUE INDEX "LeadStage_one_default" ON "LeadStage"("isDefault") WHERE "isDefault";
ALTER TABLE "Lead" ADD COLUMN "stageId" TEXT NOT NULL DEFAULT 'stage-new-lead' REFERENCES "LeadStage"(id) ON DELETE RESTRICT, ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ALTER COLUMN "consentAt" DROP NOT NULL;
CREATE INDEX "Lead_stageId_position_idx" ON "Lead"("stageId",position);
WITH ranked AS (SELECT id, row_number() OVER (ORDER BY "createdAt",id)-1 AS n FROM "Lead") UPDATE "Lead" l SET position=r.n FROM ranked r WHERE l.id=r.id;
CREATE TABLE "LeadComment" (
 id TEXT PRIMARY KEY,text TEXT NOT NULL,"leadId" TEXT NOT NULL REFERENCES "Lead"(id) ON DELETE CASCADE,
 "authorId" TEXT NOT NULL REFERENCES "Admin"(id) ON DELETE RESTRICT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "LeadComment_leadId_createdAt_idx" ON "LeadComment"("leadId","createdAt");
CREATE TABLE "AppointmentType" (id TEXT PRIMARY KEY,name TEXT NOT NULL);
INSERT INTO "AppointmentType" VALUES ('visit','Visita ao imóvel'),('meeting','Reunião'),('call','Ligação'),('follow-up','Retorno'),('other','Outro');
CREATE TABLE "Appointment" (
 id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',"startsAt" TIMESTAMPTZ(3) NOT NULL,"endsAt" TIMESTAMPTZ(3) NOT NULL,
 status TEXT NOT NULL DEFAULT 'scheduled',"typeId" TEXT NOT NULL REFERENCES "AppointmentType"(id) ON DELETE RESTRICT,
 "leadId" TEXT REFERENCES "Lead"(id) ON DELETE SET NULL,"propertyId" TEXT REFERENCES "Property"(id) ON DELETE SET NULL,
 "authorId" TEXT NOT NULL REFERENCES "Admin"(id) ON DELETE RESTRICT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Appointment_positive_interval" CHECK ("endsAt">"startsAt"), CONSTRAINT "Appointment_status" CHECK (status IN ('scheduled','cancelled'))
);
CREATE INDEX "Appointment_startsAt_endsAt_idx" ON "Appointment"("startsAt","endsAt");
CREATE INDEX "Appointment_leadId_startsAt_idx" ON "Appointment"("leadId","startsAt");

ALTER TABLE "Selection" ADD COLUMN "clientLeadId" TEXT, ADD COLUMN title TEXT NOT NULL DEFAULT 'Minha seleção', ADD COLUMN origin TEXT NOT NULL DEFAULT 'client', ADD COLUMN revision INTEGER NOT NULL DEFAULT 0, ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Selection" SET "clientLeadId"="leadId";
DROP INDEX "Selection_leadId_key";
CREATE UNIQUE INDEX "Selection_clientLeadId_key" ON "Selection"("clientLeadId");
CREATE INDEX "Selection_leadId_idx" ON "Selection"("leadId");
ALTER TABLE "Selection" ADD CONSTRAINT "Selection_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "Lead"(id) ON DELETE CASCADE;
ALTER TABLE "Selection" ADD CONSTRAINT "Selection_owner_integrity" CHECK ((origin='client' AND "clientLeadId" IS NOT NULL AND "clientLeadId"="leadId") OR (origin='admin' AND "clientLeadId" IS NULL));
ALTER TABLE "SelectionItem" ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
COMMIT;
