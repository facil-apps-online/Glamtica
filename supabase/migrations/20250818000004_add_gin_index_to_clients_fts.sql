
CREATE INDEX clients_fts_gin_idx ON public.clients USING gin(fts);
