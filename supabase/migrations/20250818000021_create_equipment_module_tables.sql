-- Create equipment_types table
CREATE TABLE equipment_types (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create equipment table
CREATE TABLE equipment (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    name text NOT NULL,
    type_id uuid REFERENCES equipment_types(id),
    brand text,
    model text,
    serial_number text UNIQUE,
    purchase_date date,
    last_maintenance_date date,
    maintenance_frequency integer,
    maintenance_frequency_unit text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create equipment_assignments table
CREATE TABLE equipment_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id uuid NOT NULL REFERENCES equipment(id),
    branch_id uuid NOT NULL REFERENCES branches(id),
    user_id uuid NOT NULL REFERENCES users(id),
    assignment_date date NOT NULL,
    return_date date,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Create equipment_maintenance_history table
CREATE TABLE equipment_maintenance_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id uuid NOT NULL REFERENCES equipment(id),
    maintenance_date date NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);