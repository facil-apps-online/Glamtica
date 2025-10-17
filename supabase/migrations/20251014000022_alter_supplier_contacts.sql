-- Alter supplier_contacts table

-- 1. Rename the existing contact_type column
ALTER TABLE public.supplier_contacts RENAME COLUMN contact_type TO contact_type_name_temp;

-- 2. Add the new contact_type_id column
ALTER TABLE public.supplier_contacts ADD COLUMN contact_type_id uuid;

-- 3. Insert missing contact types from supplier_contacts into contact_types
INSERT INTO public.contact_types (tenant_id, name, is_for_supplier, is_for_client)
SELECT DISTINCT sc.tenant_id, sc.contact_type_name_temp, true, false
FROM public.supplier_contacts sc
WHERE sc.contact_type_name_temp IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM public.contact_types ct
    WHERE lower(ct.name) = lower(sc.contact_type_name_temp) AND ct.tenant_id = sc.tenant_id
);

-- 4. Update the new column with the corresponding id from contact_types
UPDATE public.supplier_contacts sc
SET contact_type_id = ct.id
FROM public.contact_types ct
WHERE lower(sc.contact_type_name_temp) = lower(ct.name) AND sc.tenant_id = ct.tenant_id;

-- 5. Add the foreign key constraint
ALTER TABLE public.supplier_contacts
ADD CONSTRAINT supplier_contacts_contact_type_id_fkey
FOREIGN KEY (contact_type_id)
REFERENCES public.contact_types(id)
ON DELETE SET NULL;

-- 6. Make the new column not nullable
ALTER TABLE public.supplier_contacts ALTER COLUMN contact_type_id SET NOT NULL;

-- 7. Drop the temporary old column
ALTER TABLE public.supplier_contacts DROP COLUMN contact_type_name_temp;