-- Migration: Add scheduling fields to attention_services
-- Adds start_time, end_time, and is_parallel to enable advanced scheduling for individual services.

-- Add columns to the attention_services table
ALTER TABLE public.attention_services
ADD COLUMN IF NOT EXISTS start_time TIME WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIME WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS is_parallel BOOLEAN NOT NULL DEFAULT FALSE;