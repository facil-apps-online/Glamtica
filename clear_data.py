import os
from supabase import create_client, Client

# Configuración de Supabase (asegúrate de que estas variables de entorno estén configuradas)
# O reemplaza directamente con tus credenciales si no usas variables de entorno
url: str = os.environ.get("SUPABASE_URL", "https://vtfsbogpkrcbfuhhoepf.supabase.co")
key: str = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg")

supabase: Client = create_client(url, key)

# Tablas de negocio a limpiar (ordenadas por dependencia para evitar errores de FK)
tables_to_clear_business_data = [
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
    "translations", # Asumiendo que las traducciones son específicas de tenants/datos de negocio
    "products",
    "brands",
    "purchases",
    "suppliers",
    "clients",
    "services",
    "stylists",
    "branches", # Las sucursales pertenecen a tenants
    "tenant_subscriptions", # Las suscripciones de tenants
    "audit_logs", # Logs de actividad de tenants
    "error_logs", # Logs de errores de la aplicación
    "performance_metrics", # Métricas de rendimiento de tenants
]

def clear_data():
    print("\n--- Iniciando proceso de limpieza de datos ---")

    # 1. Limpiar tablas de negocio
    for table in tables_to_clear_business_data:
        try:
            print(f"Limpiando tabla: {table}...")
            response = supabase.from_(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            if response.data is not None:
                print(f"  -> Eliminados {len(response.data)} registros de {table}.")
            else:
                print(f"  -> Comando de eliminación enviado para {table}. (Sin datos de respuesta o 0 registros)")
        except Exception as e:
            print(f"  !!! ERROR al limpiar la tabla {table}: {e}")

    # 2. Limpiar usuarios (excepto super_admin)
    super_admin_email = input("Por favor, introduce el correo electrónico del superadministrador para preservarlo: ")
    try:
        print(f"Buscando ID del superadministrador con email: {super_admin_email}...")
        user_response = supabase.from_('users').select('id').eq('email', super_admin_email).single().execute()
        super_admin_id = user_response.data['id']
        print(f"  -> Superadministrador encontrado con ID: {super_admin_id}")

        print("Eliminando usuarios que no son superadministradores...")
        delete_users_response = supabase.from_('users').delete().neq('id', super_admin_id).execute()
        if delete_users_response.data is not None:
            print(f"  -> Eliminados {len(delete_users_response.data)} usuarios no superadministradores.")
        else:
            print(f"  -> Comando de eliminación de usuarios no superadministradores enviado. (Sin datos de respuesta o 0 registros)")

    except Exception as e:
        print(f"  !!! ERROR al limpiar usuarios: {e}")
        print("  !!! Asegúrate de que el correo electrónico del superadministrador sea correcto y que el usuario exista.")

    # 3. Limpiar tenants (todos, ya que el super_admin es global)
    try:
        print("Eliminando todos los tenants...")
        delete_tenants_response = supabase.from_('tenants').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        if delete_tenants_response.data is not None:
            print(f"  -> Eliminados {len(delete_tenants_response.data)} tenants.")
        else:
            print(f"  -> Comando de eliminación de tenants enviado. (Sin datos de respuesta o 0 registros)")
    except Exception as e:
        print(f"  !!! ERROR al limpiar tenants: {e}")

    print("\n--- Proceso de limpieza de datos completado ---")

if __name__ == "__main__":
    clear_data()
