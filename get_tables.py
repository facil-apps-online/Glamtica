
import os
from supabase import create_client, Client

# Get Supabase credentials from environment variables
url: str = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"

# Create Supabase client
supabase: Client = create_client(url, key)

def get_functions():
    """Fetches all function names and their argument types from the public schema."""
    try:
        # Supabase Python library doesn't have a direct way to list functions,
        # so we use a remote procedure call to a SQL function.
        # We need to create a temporary function to get function details.
        supabase.rpc('sql', {
            'statement': """
            CREATE OR REPLACE FUNCTION get_function_signatures()
            RETURNS TABLE(function_name TEXT, argument_types TEXT) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    p.proname AS function_name,
                    pg_get_function_arguments(p.oid) AS argument_types
                FROM
                    pg_proc p
                JOIN
                    pg_namespace n ON n.oid = p.pronamespace
                WHERE
                    n.nspname = 'public' AND p.proname = 'set_session_context';
            END;
            $$ LANGUAGE plpgsql;
            """
        }).execute()

        functions = supabase.rpc('get_function_signatures', {}).execute()
        if functions.data:
            print("Functions in database:")
            for func in functions.data:
                print(f"- {func['function_name']}({func['argument_types']})")
            return functions.data
        else:
            print("No functions found or error fetching functions.")
            return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

if __name__ == "__main__":
    get_functions()
