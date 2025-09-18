
ALTER TABLE public.invoices
ADD COLUMN attention_id UUID;

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_attention_id_fkey
FOREIGN KEY (attention_id) REFERENCES public.attentions(id) ON DELETE SET NULL;
