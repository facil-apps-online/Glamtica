
import os
from supabase import create_client, Client

url: str = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"

supabase: Client = create_client(url, key)

def get_default_tenant_and_branch_ids():
    try:
        # Fetch default tenant ID
        tenant_response = supabase.from_('tenants').select('id').eq('name', 'Glamtica Default Tenant').single().execute()
        if tenant_response.data:
            default_tenant_id = tenant_response.data['id']
        else:
            print("Error: 'Glamtica Default Tenant' not found.")
            return None, None

        # Fetch default branch ID
        branch_response = supabase.from_('branches').select('id').eq('name', 'Main Branch').eq('tenant_id', default_tenant_id).single().execute()
        if branch_response.data:
            default_branch_id = branch_response.data['id']
        else:
            print("Error: 'Main Branch' not found for 'Glamtica Default Tenant'.")
            return None, None

        return default_tenant_id, default_branch_id

    except Exception as e:
        print(f"An error occurred while fetching default tenant/branch IDs: {e}")
        return None, None

if __name__ == "__main__":
    default_tenant_id, default_branch_id = get_default_tenant_and_branch_ids()
    if default_tenant_id and default_branch_id:
        print(f"Default Tenant ID: {default_tenant_id}")
        print(f"Default Branch ID: {default_branch_id}")
    else:
        print("Could not retrieve default tenant and branch IDs.")
