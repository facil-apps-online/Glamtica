-- Migration: 20250725000011_deprecate_custom_password_reset.sql
-- Description: Removes the custom password reset functionality (RPC and table)
-- in favor of the native Supabase Auth method.

-- Step 1: Drop the RPC function used to generate tokens.
DROP FUNCTION IF EXISTS public.create_password_reset_token(UUID, TEXT);

-- Step 2: Drop the table that stored the custom reset tokens.
DROP TABLE IF EXISTS public.password_reset_tokens;

-- COMMENT: Deprecates the custom password reset system by removing the create_password_reset_token RPC and the password_reset_tokens table. The system will now use supabase.auth.resetPasswordForEmail.
