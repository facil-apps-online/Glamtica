ALTER TABLE public.product_images
ADD COLUMN google_drive_file_id TEXT NULL,
ADD COLUMN file_name TEXT NULL;

-- Actualizar la URL de la imagen para que use el file ID de Google Drive
-- Esto es un cambio retroactivo para asegurar que las URLs son consistentes
UPDATE public.product_images
SET image_url = 'https://drive.google.com/uc?id=' || google_drive_file_id
WHERE google_drive_file_id IS NOT NULL;
