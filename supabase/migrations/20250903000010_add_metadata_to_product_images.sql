ALTER TABLE public.product_images
ADD COLUMN mime_type TEXT NULL,
ADD COLUMN file_size BIGINT NULL;
