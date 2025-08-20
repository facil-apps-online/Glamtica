ALTER TABLE user_time_off
ADD COLUMN tenant_id UUID REFERENCES tenants(id);

UPDATE user_time_off uto
SET tenant_id = (
    SELECT (user_assignment->>'tenant_id')::uuid
    FROM auth.users u,
         jsonb_array_elements(u.raw_app_meta_data->'assignments') as user_assignment
    WHERE u.id = uto.user_id
    LIMIT 1
);

ALTER TABLE user_time_off
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE user_time_off
ADD COLUMN branch_id UUID REFERENCES branches(id);

UPDATE user_time_off uto
SET branch_id = (
    SELECT (user_assignment->>'branch_id')::uuid
    FROM auth.users u,
         jsonb_array_elements(u.raw_app_meta_data->'assignments') as user_assignment
    WHERE u.id = uto.user_id
    LIMIT 1
);

ALTER TABLE user_time_off
ALTER COLUMN branch_id SET NOT NULL;
