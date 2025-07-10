
import os
from supabase import create_client, Client

# Get Supabase credentials from environment variables
url: str = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"

# Create Supabase client
supabase: Client = create_client(url, key)

def get_tables():
    """Fetches all table names from the public schema."""
    try:
        # Supabase Python library doesn't have a direct way to list tables,
        # so we use a remote procedure call to a SQL function.
        tables = supabase.rpc('get_table_names', {}).execute()
        if tables.data:
            # Filter out the 'settings' table and internal Supabase tables
            excluded_tables = {'settings'}
            table_names = [t['table_name'] for t in tables.data if t['table_name'] not in excluded_tables and not t['table_name'].startswith('supabase_')]
            print("Tables to be cleared:")
            for name in table_names:
                print(f"- {name}")
            return table_names
        else:
            print("No tables found or error fetching tables.")
            return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

if __name__ == "__main__":
    # Before we can get the tables, we need to create the RPC function in Supabase
    # This is a one-time setup.
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
        print("Successfully created RPC function 'get_table_names'.")
    except Exception as e:
        # Function might already exist, which is fine.
        if 'already exists' not in str(e):
            print(f"Error creating RPC function: {e}")
        else:
            print("RPC function 'get_table_names' already exists.")

    get_tables()
