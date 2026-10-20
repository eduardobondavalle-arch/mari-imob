-- Preserve other municipalities already registered before the city relation existed.
INSERT INTO "City" (id, name)
SELECT 'city-' || md5(trim(p.city)), trim(p.city) FROM "Property" p
WHERE NOT EXISTS (SELECT 1 FROM "City" c WHERE lower(c.name)=lower(trim(p.city)))
GROUP BY trim(p.city)
ON CONFLICT DO NOTHING;
UPDATE "Property" p SET "cityId"=c.id FROM "City" c WHERE p."cityId" IS NULL AND lower(trim(p.city))=lower(c.name);
