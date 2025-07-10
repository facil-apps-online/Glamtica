
import os
from supabase import create_client, Client

url: str = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"

supabase: Client = create_client(url, key)

def apply_migration():
    migration_file_path = "C:/Desarrollos/Glamtica.app/supabase/migrations/20250710180000_multi_tenant_roles.sql"

    # SQL to create the run_sql_query function
    create_rpc_function_sql = """
    CREATE OR REPLACE FUNCTION run_sql_query(sql_query TEXT)
    RETURNS VOID AS $$
    BEGIN
        EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    GRANT EXECUTE ON FUNCTION run_sql_query(TEXT) TO service_role;
    """

    try:
        print("Creating run_sql_query RPC function...")
        # Execute the SQL to create the RPC function
        # Using rpc('sql', ...) is a common way to execute arbitrary SQL via Supabase client
        response = supabase.rpc('sql', {'statement': create_rpc_function_sql}).execute()
        if response.error:
            print(f"Error creating run_sql_query RPC function: {response.error}")
            return
        else:
            print("run_sql_query RPC function created successfully (or already exists).")

        with open(migration_file_path, 'r') as f:
            sql_content = f.read()

        print("Applying main migration directly to Supabase...")
        # Now execute the main migration SQL using the newly created run_sql_query RPC function
        response = supabase.rpc('run_sql_query', {'sql_query': sql_content}).execute()

        if response.error:
            print(f"Error applying main migration: {response.error}")
        else:
            print("Main migration applied successfully.")

    except FileNotFoundError:
        print(f"Error: Migration file not found at {migration_file_path}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    apply_migration()
