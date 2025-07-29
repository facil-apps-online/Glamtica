-- MIGRATION: Consolidate Stylists into Users
-- Version: 20250724000029
-- Description: This migration merges the 'stylists' table and its related functionalities 
--              into the 'public.users' table. It enriches 'users' with professional profile 
--              data, renames and re-links dependent tables (schedules, commissions), 
--              and finally removes the now-redundant 'stylists' table.

BEGIN;

-- Step 1: Enrich 'public.users' table with professional profile columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS default_commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_schedulable BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Migrate data from 'stylists' to 'public.users'
-- This assumes a 1-to-1 relationship based on the email address.
UPDATE public.users u
SET 
    specialties = s.specialties,
    default_commission_rate = s.commission_rate,
    is_schedulable = s.is_active
FROM public.stylists s
WHERE u.email = s.email;

-- Step 3: Transform 'stylist_schedules' to 'user_schedules'
-- Drop RLS policies that depend on the columns to be dropped
DROP POLICY IF EXISTS tenant_branch_policy_stylist_schedules ON public.stylist_schedules;

ALTER TABLE public.stylist_schedules ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.stylist_schedules ss SET user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = ss.stylist_id);
ALTER TABLE public.stylist_schedules DROP CONSTRAINT IF EXISTS stylist_schedules_stylist_id_fkey;
ALTER TABLE public.stylist_schedules DROP COLUMN IF EXISTS stylist_id;
ALTER TABLE public.stylist_schedules DROP COLUMN IF EXISTS branch_id;
ALTER TABLE public.stylist_schedules DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.stylist_schedules RENAME TO user_schedules;
ALTER TABLE public.user_schedules ADD CONSTRAINT user_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_schedules ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_schedules DROP CONSTRAINT IF EXISTS stylist_schedules_stylist_id_day_of_week_key;
ALTER TABLE public.user_schedules ADD CONSTRAINT user_schedules_user_id_day_of_week_key UNIQUE (user_id, day_of_week);
ALTER TRIGGER audit_stylist_schedules_changes ON public.user_schedules RENAME TO audit_user_schedules_changes;

-- Step 4: Transform 'stylist_time_off' to 'user_time_off'
-- Drop RLS policies that depend on the columns to be dropped
DROP POLICY IF EXISTS tenant_branch_policy_stylist_time_off ON public.stylist_time_off;

ALTER TABLE public.stylist_time_off ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.stylist_time_off sto SET user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = sto.stylist_id);
ALTER TABLE public.stylist_time_off DROP CONSTRAINT IF EXISTS stylist_time_off_stylist_id_fkey;
ALTER TABLE public.stylist_time_off DROP COLUMN IF EXISTS stylist_id;
ALTER TABLE public.stylist_time_off DROP COLUMN IF EXISTS branch_id;
ALTER TABLE public.stylist_time_off DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.stylist_time_off RENAME TO user_time_off;
ALTER TABLE public.user_time_off ADD CONSTRAINT user_time_off_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_time_off ALTER COLUMN user_id SET NOT NULL;
ALTER TRIGGER audit_stylist_time_off_changes ON public.user_time_off RENAME TO audit_user_time_off_changes;

-- Step 5: Transform 'service_stylist_commissions' to 'service_user_commissions'
ALTER TABLE public.service_stylist_commissions ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.service_stylist_commissions ssc SET user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = ssc.stylist_id);
ALTER TABLE public.service_stylist_commissions DROP CONSTRAINT IF EXISTS service_stylist_commissions_stylist_id_fkey;
ALTER TABLE public.service_stylist_commissions DROP COLUMN IF EXISTS stylist_id;
ALTER TABLE public.service_stylist_commissions RENAME TO service_user_commissions;
ALTER TABLE public.service_user_commissions ADD CONSTRAINT service_user_commissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.service_user_commissions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.service_user_commissions DROP CONSTRAINT IF EXISTS service_stylist_commissions_service_id_stylist_id_key;
ALTER TABLE public.service_user_commissions ADD CONSTRAINT service_user_commissions_unique UNIQUE (service_id, user_id, branch_id);
ALTER TRIGGER audit_service_stylist_commissions_changes ON public.service_user_commissions RENAME TO audit_service_user_commissions_changes;

-- Step 6: Transform 'product_stylist_commissions' to 'product_user_commissions'
ALTER TABLE public.product_stylist_commissions ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.product_stylist_commissions psc SET user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = psc.stylist_id);
ALTER TABLE public.product_stylist_commissions DROP CONSTRAINT IF EXISTS product_stylist_commissions_stylist_id_fkey;
ALTER TABLE public.product_stylist_commissions DROP COLUMN IF EXISTS stylist_id;
ALTER TABLE public.product_stylist_commissions RENAME TO product_user_commissions;
ALTER TABLE public.product_user_commissions ADD CONSTRAINT product_user_commissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.product_user_commissions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.product_user_commissions DROP CONSTRAINT IF EXISTS product_stylist_commissions_product_id_stylist_id_key;
ALTER TABLE public.product_user_commissions ADD CONSTRAINT product_user_commissions_unique UNIQUE (product_id, user_id, branch_id);
ALTER TRIGGER audit_product_stylist_commissions_changes ON public.product_user_commissions RENAME TO audit_product_user_commissions_changes;

-- Step 7: Update Transactional Tables
-- appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.appointments a SET user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = a.stylist_id);
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_stylist_id_fkey;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS stylist_id;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- service_evidence
ALTER TABLE public.service_evidence ADD COLUMN IF NOT EXISTS uploaded_by_user_id UUID;
UPDATE public.service_evidence se SET uploaded_by_user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = se.uploaded_by);
ALTER TABLE public.service_evidence DROP CONSTRAINT IF EXISTS service_evidence_uploaded_by_fkey;
ALTER TABLE public.service_evidence DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE public.service_evidence RENAME COLUMN uploaded_by_user_id TO uploaded_by;
ALTER TABLE public.service_evidence ADD CONSTRAINT service_evidence_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- attention_services
ALTER TABLE public.attention_services ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.attention_services aset SET user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = aset.stylist_id);
ALTER TABLE public.attention_services DROP CONSTRAINT IF EXISTS attention_services_stylist_id_fkey;
ALTER TABLE public.attention_services DROP COLUMN IF EXISTS stylist_id;
ALTER TABLE public.attention_services ADD CONSTRAINT attention_services_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- attention_service_products
ALTER TABLE public.attention_service_products ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.attention_service_products asp SET user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = asp.stylist_id);
ALTER TABLE public.attention_service_products DROP CONSTRAINT IF EXISTS attention_service_products_stylist_id_fkey;
ALTER TABLE public.attention_service_products DROP COLUMN IF EXISTS stylist_id;
ALTER TABLE public.attention_service_products ADD CONSTRAINT attention_service_products_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

-- appointment_extra_services
ALTER TABLE public.appointment_extra_services ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.appointment_extra_services aes SET user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = aes.stylist_id);
ALTER TABLE public.appointment_extra_services DROP CONSTRAINT IF EXISTS appointment_extra_services_stylist_id_fkey;
ALTER TABLE public.appointment_extra_services DROP COLUMN IF EXISTS stylist_id;
ALTER TABLE public.appointment_extra_services ADD CONSTRAINT appointment_extra_services_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- appointment_evidence (uploaded_by)
-- Assuming uploaded_by should now point to users table
ALTER TABLE public.appointment_evidence ADD COLUMN IF NOT EXISTS uploaded_by_user_id UUID;
UPDATE public.appointment_evidence ae SET uploaded_by_user_id = (SELECT u.id FROM public.users u JOIN public.stylists s ON u.email = s.email WHERE s.id = ae.uploaded_by);
ALTER TABLE public.appointment_evidence DROP CONSTRAINT IF EXISTS appointment_evidence_uploaded_by_fkey;
ALTER TABLE public.appointment_evidence DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE public.appointment_evidence RENAME COLUMN uploaded_by_user_id TO uploaded_by;
ALTER TABLE public.appointment_evidence ADD CONSTRAINT appointment_evidence_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- Step 8: Update and Rename DB Functions
DROP FUNCTION IF EXISTS public.check_stylist_availability(uuid, date, time without time zone, integer);
CREATE OR REPLACE FUNCTION public.check_user_availability(
    p_user_id uuid,
    p_appointment_date date,
    p_appointment_time time without time zone,
    p_duration_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_day_of_week integer;
  v_schedule_exists boolean;
  v_schedule_start time;
  v_schedule_end time;
  v_appointment_end_time time;
  v_time_off_exists boolean;
  v_is_schedulable boolean;
BEGIN
  -- First, check if the user is schedulable at all
  SELECT is_schedulable INTO v_is_schedulable FROM public.users WHERE id = p_user_id;
  IF NOT v_is_schedulable THEN
    RETURN false;
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_appointment_date);
  v_appointment_end_time := p_appointment_time + (p_duration_minutes || ' minutes')::interval;

  -- Check for active schedule for that day
  SELECT 
    EXISTS(SELECT 1 FROM user_schedules 
           WHERE user_id = p_user_id 
           AND day_of_week = v_day_of_week 
           AND is_active = true),
    start_time,
    end_time
  INTO v_schedule_exists, v_schedule_start, v_schedule_end
  FROM user_schedules 
  WHERE user_id = p_user_id 
  AND day_of_week = v_day_of_week 
  AND is_active = true;

  IF NOT v_schedule_exists OR p_appointment_time < v_schedule_start OR v_appointment_end_time > v_schedule_end THEN
    RETURN false;
  END IF;

  -- Check for approved time off
  SELECT EXISTS(
    SELECT 1 FROM user_time_off 
    WHERE user_id = p_user_id 
    AND status = 'approved'
    AND p_appointment_date >= start_date 
    AND p_appointment_date <= end_date
    AND (
      (start_time IS NULL AND end_time IS NULL) OR
      (start_time IS NOT NULL AND end_time IS NOT NULL AND 
       NOT (v_appointment_end_time <= start_time OR p_appointment_time >= end_time))
    )
  ) INTO v_time_off_exists;

  IF v_time_off_exists THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Step 9: Drop the old 'stylists' table
DROP TABLE IF EXISTS public.stylists;

COMMIT;
