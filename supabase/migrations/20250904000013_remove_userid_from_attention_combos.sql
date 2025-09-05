-- Migration: Remove redundant user_id from attention_combos table

ALTER TABLE public.attention_combos
DROP COLUMN IF EXISTS user_id;
