-- Migration to add offset_minutes to attention_services table

ALTER TABLE public.attention_services
ADD COLUMN offset_minutes INTEGER NOT NULL DEFAULT 0;
