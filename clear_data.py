import os
from supabase import create_client, Client

url: str = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"

supabase: Client = create_client(url, key)

tables_to_clear = [
    "attention_service_products",
    "attention_products",
    "service_evidence",
    "service_sessions",
    "attention_services",
    "attentions",
    "extra_service_sessions",
    "appointment_evidence",
    "appointment_products",
    "appointment_extra_services",
    "appointment_sessions",
    "appointments",
    "purchase_items",
    "product_stylist_commissions",
    "supplier_products",
    "service_stylist_commissions",
    "stylist_time_off",
    "stylist_schedules",
    "translations",
    "products",
    "brands",
    "purchases",
    "suppliers",
    "schedule_templates",
    "languages",
    "service_categories",
    "clients",
    "services",
    "stylists"
]

def clear_data():
    print("Starting data clearing process...")
    for table in tables_to_clear:
        try:
            print(f"Clearing table: {table}...")
            response = supabase.from_(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            # The execute() method will raise an exception on critical errors.
            # For successful deletions, response.data might be empty or contain metadata.
            # We assume success if no exception is raised.
            print(f"Successfully sent delete command for {table}.")
        except Exception as e:
            print(f"An error occurred while clearing table {table}: {e}")
    print("Data clearing process completed.")

if __name__ == "__main__":
    clear_data()