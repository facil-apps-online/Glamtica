ALTER TABLE public.turns
ADD COLUMN attention_id UUID REFERENCES public.attentions(id) ON DELETE SET NULL;
