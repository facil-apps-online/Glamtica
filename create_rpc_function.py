
import os
from supabase import create_client, Client

# Get Supabase credentials from environment variables
url: str = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"

# Create Supabase client
supabase: Client = create_client(url, key)

def create_get_table_names_function():
    """Creates or replaces the get_table_names RPC function in Supabase."""
    try:
        supabase.rpc('sql', {
            'statement': """
            CREATE OR REPLACE FUNCTION get_table_names()
            RETURNS TABLE(table_name TEXT) AS $$
            BEGIN
                RETURN QUERY
                SELECT t.table_name
                FROM information_schema.tables t
                WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE';
            END;
            $$ LANGUAGE plpgsql;
            """
        }).execute()
        print("Successfully created or replaced RPC function 'get_table_names'.")
    except Exception as e:
        print(f"Error creating RPC function: {e}")

if __name__ == "__main__":
    create_get_table_names_function()
