-- Create table for extra service sessions
CREATE TABLE IF NOT EXISTS public.extra_service_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extra_service_id UUID NOT NULL REFERENCES public.appointment_extra_services(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extra_service_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Enable all operations for extra_service_sessions" ON public.extra_service_sessions;
CREATE POLICY "Enable all operations for extra_service_sessions" 
ON public.extra_service_sessions 
FOR ALL 
USING (true);

-- Add trigger for automatic duration calculation
DROP TRIGGER IF EXISTS calculate_extra_service_duration ON public.extra_service_sessions;
CREATE TRIGGER calculate_extra_service_duration
  BEFORE UPDATE ON public.extra_service_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_session_duration();

-- Add trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_extra_service_sessions_updated_at ON public.extra_service_sessions;
CREATE TRIGGER update_extra_service_sessions_updated_at
  BEFORE UPDATE ON public.extra_service_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update appointment_evidence table to support extra service evidence
ALTER TABLE public.appointment_evidence
ADD COLUMN IF NOT EXISTS extra_service_session_id UUID REFERENCES public.extra_service_sessions(id) ON DELETE CASCADE;