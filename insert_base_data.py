
import os
from supabase import create_client, Client

url: str = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"

supabase: Client = create_client(url, key)

DEFAULT_TENANT_ID = "60fbe916-6b20-4cfa-8378-abd6018251ea"
DEFAULT_BRANCH_ID = "fc7052bf-f01e-48d6-af0a-5dde9099c56a"

def insert_base_data():
    print("Inserting base data (clients, stylists, services)...")

    # Insert clients
    clients_data = [
        {"name": "María González", "phone": "+34 666 123 456", "email": "maria@email.com", "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID},
        {"name": "Carlos Ruiz", "phone": "+34 666 789 012", "email": "carlos@email.com", "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID},
        {"name": "Laura García", "phone": "+34 666 345 678", "email": "laura@email.com", "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID}
    ]
    try:
        response = supabase.from_('clients').insert(clients_data).execute()
        if response.data:
            print(f"Inserted {len(response.data)} clients.")
        if response.error:
            print(f"Error inserting clients: {response.error}")
    except Exception as e:
        print(f"An error occurred inserting clients: {e}")

    # Insert stylists
    stylists_data = [
        {"name": "Ana Martín", "specialties": ["Corte", "Tinte", "Peinado"], "phone": "+34 666 111 222", "email": "ana@salon.com", "commission_rate": 55.00, "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID},
        {"name": "Pedro López", "specialties": ["Corte Masculino", "Barba"], "phone": "+34 666 333 444", "email": "pedro@salon.com", "commission_rate": 50.00, "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID},
        {"name": "Carmen Vila", "specialties": ["Manicure", "Pedicure", "Uñas"], "phone": "+34 666 555 666", "email": "carmen@salon.com", "commission_rate": 45.00, "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID}
    ]
    try:
        response = supabase.from_('stylists').insert(stylists_data).execute()
        if response.data:
            print(f"Inserted {len(response.data)} stylists.")
        if response.error:
            print(f"Error inserting stylists: {response.error}")
    except Exception as e:
        print(f"An error occurred inserting stylists: {e}")

    # Insert services
    services_data = [
        {"name": "Corte y Tinte", "description": "Corte de cabello y aplicación de tinte", "price": 85.00, "duration_minutes": 90, "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID},
        {"name": "Corte Masculino", "description": "Corte de cabello para hombre", "price": 25.00, "duration_minutes": 30, "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID},
        {"name": "Manicure", "description": "Cuidado completo de uñas de manos", "price": 35.00, "duration_minutes": 45, "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID},
        {"name": "Peinado", "description": "Peinado especial para eventos", "price": 45.00, "duration_minutes": 60, "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID},
        {"name": "Barba", "description": "Recorte y arreglo de barba", "price": 15.00, "duration_minutes": 20, "tenant_id": DEFAULT_TENANT_ID, "branch_id": DEFAULT_BRANCH_ID}
    ]
    try:
        response = supabase.from_('services').insert(services_data).execute()
        if response.data:
            print(f"Inserted {len(response.data)} services.")
        if response.error:
            print(f"Error inserting services: {response.error}")
    except Exception as e:
        print(f"An error occurred inserting services: {e}")

    print("Base data insertion completed.")

if __name__ == "__main__":
    insert_base_data()
