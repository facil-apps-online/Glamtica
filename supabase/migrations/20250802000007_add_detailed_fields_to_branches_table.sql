ALTER TABLE public.branches
ADD COLUMN contact_phone TEXT,
ADD COLUMN whatsapp_phone TEXT,
ADD COLUMN commercial_email TEXT,
ADD COLUMN website TEXT,
ADD COLUMN physical_address_line1 TEXT,
ADD COLUMN physical_address_line2 TEXT,
ADD COLUMN physical_city TEXT,
ADD COLUMN physical_state TEXT,
ADD COLUMN physical_postal_code TEXT,
ADD COLUMN latitude NUMERIC(10, 8),
ADD COLUMN longitude NUMERIC(11, 8);

COMMENT ON COLUMN public.branches.contact_phone IS 'Phone number for general contact of the branch.';
COMMENT ON COLUMN public.branches.whatsapp_phone IS 'WhatsApp number for the branch.';
COMMENT ON COLUMN public.branches.commercial_email IS 'Commercial email address for the branch.';
COMMENT ON COLUMN public.branches.website IS 'Website URL for the branch.';
COMMENT ON COLUMN public.branches.physical_address_line1 IS 'Physical address line 1 of the branch.';
COMMENT ON COLUMN public.branches.physical_address_line2 IS 'Physical address line 2 of the branch (e.g., apartment, office number).';
COMMENT ON COLUMN public.branches.physical_city IS 'City of the branch''s physical address.';
COMMENT ON COLUMN public.branches.physical_state IS 'State or province of the branch''s physical address.';
COMMENT ON COLUMN public.branches.physical_postal_code IS 'Postal code of the branch''s physical address.';
COMMENT ON COLUMN public.branches.latitude IS 'Latitude coordinate of the branch''s physical location.';
COMMENT ON COLUMN public.branches.longitude IS 'Longitude coordinate of the branch''s physical location.';