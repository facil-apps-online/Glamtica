-- Drop the existing function
DROP FUNCTION IF EXISTS public.set_primary_image_for_product;

-- Recreate the function to correctly return the full updated record
CREATE OR REPLACE FUNCTION public.set_primary_image_for_product(
  p_tenant_id uuid,
  p_product_id uuid,
  p_image_id uuid
)
RETURNS product_images -- The return type is correct
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_image product_images; -- Declare a variable to hold the result
BEGIN
  -- First, set all other images for this product to is_primary = false
  UPDATE public.product_images
  SET is_primary = false
  WHERE tenant_id = p_tenant_id
    AND product_id = p_product_id
    AND id <> p_image_id;

  -- Then, set the specified image to is_primary = true
  UPDATE public.product_images
  SET is_primary = true
  WHERE tenant_id = p_tenant_id
    AND product_id = p_product_id
    AND id = p_image_id;

  -- Select the updated record INTO the variable
  SELECT *
  INTO updated_image
  FROM public.product_images
  WHERE id = p_image_id;

  -- Return the variable
  RETURN updated_image;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.set_primary_image_for_product(uuid, uuid, uuid) TO authenticated;
