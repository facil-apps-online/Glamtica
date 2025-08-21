GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres;

-- Create tv_displays table
CREATE TABLE tv_displays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    registration_code text UNIQUE NOT NULL,
    is_registered boolean NOT NULL DEFAULT FALSE,
    registered_at timestamptz,
    last_heartbeat timestamptz,
    media_playlist_id uuid, -- FK a media_playlists, se añadirá en una migración posterior
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);


-- Create turns table
CREATE TABLE turns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    stylist_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status text NOT NULL, -- Se convertirá a ENUM en esta misma migración
    called_at timestamptz,
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add status enum for turns
DO $$ BEGIN
    CREATE TYPE turn_status AS ENUM ('waiting', 'called', 'in_service', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE turns ALTER COLUMN status TYPE turn_status USING status::turn_status;