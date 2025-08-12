-- Drop existing constraints if they exist
ALTER TABLE product_user_commissions
DROP CONSTRAINT IF EXISTS unique_product_user_branch_tenant;

ALTER TABLE service_user_commissions
DROP CONSTRAINT IF EXISTS unique_service_user_branch_tenant;

-- Add unique constraints
ALTER TABLE product_user_commissions
ADD CONSTRAINT unique_product_user_branch_tenant UNIQUE (product_id, user_id, branch_id, tenant_id);

ALTER TABLE service_user_commissions
ADD CONSTRAINT unique_service_user_branch_tenant UNIQUE (service_id, user_id, branch_id, tenant_id);