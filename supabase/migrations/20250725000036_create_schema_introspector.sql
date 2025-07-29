-- Paso 1: Crear un esquema dedicado para las herramientas de introspección.
CREATE SCHEMA IF NOT EXISTS schema_introspector;

-- Paso 2: Eliminar la función RPC anterior que causaba problemas.
DROP FUNCTION IF EXISTS public.execute_sql(TEXT);

-- Paso 3: Crear funciones encapsuladas y robustas para obtener los detalles del esquema.
-- Cada función devuelve un único JSONB para evitar problemas de transmisión.

-- Función para obtener todas las tablas y sus columnas.
CREATE OR REPLACE FUNCTION schema_introspector.get_all_tables()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
    SELECT
        t.table_schema,
        t.table_name,
        c.column_name,
        c.ordinal_position,
        c.data_type,
        c.is_nullable,
        c.column_default
    FROM
        information_schema.tables t
    JOIN
        information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE
        t.table_schema IN ('public', 'storage', 'auth')
        AND t.table_type = 'BASE TABLE'
    ORDER BY
        t.table_schema,
        t.table_name,
        c.ordinal_position
  ) t;
$$;

-- Función para obtener todas las restricciones (PK, FK, etc.).
CREATE OR REPLACE FUNCTION schema_introspector.get_all_constraints()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
    SELECT
        tc.constraint_name,
        tc.constraint_type,
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM
        information_schema.table_constraints AS tc
    JOIN
        information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN
        information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE
        tc.table_schema IN ('public', 'storage', 'auth')
    ORDER BY
        tc.table_schema,
        tc.table_name,
        tc.constraint_name
  ) t;
$$;

-- Función para obtener todas las funciones RPC.
CREATE OR REPLACE FUNCTION schema_introspector.get_all_functions()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
    SELECT
        r.routine_schema,
        r.routine_name,
        r.data_type AS return_type,
        p.parameter_name,
        p.data_type AS parameter_type,
        p.parameter_mode,
        pg_get_functiondef(r.specific_name::regproc) AS function_definition
    FROM
        information_schema.routines r
    LEFT JOIN
        information_schema.parameters p ON r.specific_name = p.specific_name
    WHERE
        r.routine_schema IN ('public') -- Solo nos interesan las RPCs públicas
        AND r.routine_type = 'FUNCTION'
    ORDER BY
        r.routine_schema,
        r.routine_name,
        p.ordinal_position
  ) t;
$$;

-- Función para obtener todos los tipos personalizados (ENUMs).
CREATE OR REPLACE FUNCTION schema_introspector.get_all_types()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
    SELECT
        t.typname AS enum_name,
        e.enumlabel AS enum_value,
        n.nspname AS enum_schema
    FROM
        pg_type t
    JOIN
        pg_enum e ON t.oid = e.enumtypid
    JOIN
        pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE
        n.nspname IN ('public', 'storage', 'auth')
    ORDER BY
        n.nspname,
        t.typname,
        e.enumsortorder
  ) t;
$$;
