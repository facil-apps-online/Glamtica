ALTER TABLE equipment
ADD COLUMN brand_id UUID REFERENCES equipment_brands(id);

-- IMPORTANT: If there's existing data in the 'brand' column that needs to be migrated
-- to 'brand_id', a data migration step would go here.
-- For example:
-- UPDATE equipment e
-- SET brand_id = eb.id
-- FROM equipment_brands eb
-- WHERE e.brand = eb.name;
-- (This assumes 'e.brand' stores the name of the brand and 'eb.name' is unique)

ALTER TABLE equipment
DROP COLUMN brand;