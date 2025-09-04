CREATE OR REPLACE FUNCTION set_primary_image_for_product(
    p_tenant_id UUID,
    p_product_id UUID,
    p_image_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- First, set all images for the product to is_primary = false
    UPDATE public.product_images
    SET is_primary = false
    WHERE tenant_id = p_tenant_id AND product_id = p_product_id;

    -- Then, set the specified image to is_primary = true
    UPDATE public.product_images
    SET is_primary = true
    WHERE id = p_image_id AND tenant_id = p_tenant_id AND product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;
