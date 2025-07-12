-- Drop the pgcrypto extension from its current schema (extensions)
DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- Create the pgcrypto extension in the public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;