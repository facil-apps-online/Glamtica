import os
import uuid
import datetime
from faker import Faker
from supabase import create_client, Client

# Initialize Faker
faker = Faker('es_ES')

# Supabase credentials
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_dummy_data(num_tenants=5, num_users_per_tenant=10, num_alerts=10, num_errors=20, num_metrics=30):
    print("Generating dummy data...")

    # Fetch existing roles
    res = supabase.table('roles').select('id, name').execute()
    roles = {role['name']: role['id'] for role in res.data}

    super_admin_role_id = roles.get('super_admin')
    tenant_super_admin_role_id = roles.get('tenant_super_admin')
    tenant_admin_role_id = roles.get('tenant_admin')
    tenant_user_role_id = roles.get('tenant_user')

    if not all([super_admin_role_id, tenant_super_admin_role_id, tenant_admin_role_id, tenant_user_role_id]):
        print("Error: One or more required roles (super_admin, tenant_super_admin, tenant_admin, tenant_user) not found.")
        return

    # Generate Tenants
    tenants_data = []
    for _ in range(num_tenants):
        tenants_data.append({
            "id": str(uuid.uuid4()),
            "name": faker.company(),
            "subscription_status": faker.random_element(elements=('active', 'inactive', 'trial')),
            "contact_person": faker.name(),
            "contact_email": faker.email(),
            "contact_phone": faker.phone_number(),
            "address": faker.address(),
            "city": faker.city(),
            "country_id": str(uuid.uuid4()), # Placeholder, ideally fetch from countries table
            "is_active": faker.boolean(),
            "logo_url": faker.image_url(),
            "notes": faker.text(),
            "default_language_code": faker.random_element(elements=('es', 'en')),
            "default_currency_id": str(uuid.uuid4()), # Placeholder, ideally fetch from currencies table
            "default_timezone": faker.timezone(),
        })
    
    # Insert Tenants
    print(f"Inserting {len(tenants_data)} tenants...")
    for tenant in tenants_data:
        try:
            supabase.table('tenants').insert(tenant).execute()
        except Exception as e:
            print(f"Error inserting tenant {tenant['name']}: {e}")

    # Generate Users and Branches
    users_data = []
    branches_data = []
    for tenant in tenants_data:
        # Create one branch per tenant
        branch_id = str(uuid.uuid4())
        branches_data.append({
            "id": branch_id,
            "tenant_id": tenant['id'],
            "name": "Sede Principal",
            "address": tenant['address'],
            "language_code": tenant['default_language_code'],
            "currency_id": tenant['default_currency_id'],
            "timezone": tenant['default_timezone'],
        })

        # Create users for each tenant
        for i in range(num_users_per_tenant):
            role_id = tenant_user_role_id
            if i == 0: # First user is tenant_super_admin
                role_id = tenant_super_admin_role_id
            elif i == 1: # Second user is tenant_admin
                role_id = tenant_admin_role_id

            users_data.append({
                "id": str(uuid.uuid4()),
                "email": faker.email(),
                "password_hash": faker.password(), # In real app, hash this
                "role_id": role_id,
                "tenant_id": tenant['id'],
                "branch_id": branch_id,
                "is_active": faker.boolean(),
                "language_code": tenant['default_language_code'],
                "currency_id": tenant['default_currency_id'],
                "timezone": tenant['default_timezone'],
            })
    
    # Insert Branches
    print(f"Inserting {len(branches_data)} branches...")
    for branch in branches_data:
        try:
            supabase.table('branches').insert(branch).execute()
        except Exception as e:
            print(f"Error inserting branch {branch['name']}: {e}")

    # Insert Users
    print(f"Inserting {len(users_data)} users...")
    for user in users_data:
        try:
            supabase.table('users').insert(user).execute()
        except Exception as e:
            print(f"Error inserting user {user['email']}: {e}")

    # Generate System Alerts
    alerts_data = []
    for _ in range(num_alerts):
        alerts_data.append({
            "id": str(uuid.uuid4()),
            "title": faker.sentence(nb_words=5),
            "message": faker.paragraph(nb_sentences=2),
            "severity": faker.random_element(elements=('info', 'warning', 'error', 'critical')),
            "is_active": faker.boolean(),
            "created_at": faker.date_time_this_year().isoformat(),
        })
    
    # Insert System Alerts
    print(f"Inserting {len(alerts_data)} system alerts...")
    for alert in alerts_data:
        try:
            supabase.table('system_alerts').insert(alert).execute()
        except Exception as e:
            print(f"Error inserting system alert {alert['title']}: {e}")

    # Generate Error Logs
    error_logs_data = []
    for _ in range(num_errors):
        error_logs_data.append({
            "id": str(uuid.uuid4()),
            "tenant_id": faker.random_element(elements=[t['id'] for t in tenants_data]),
            "user_id": faker.random_element(elements=[u['id'] for u in users_data]),
            "error_message": faker.sentence(nb_words=10),
            "stack_trace": faker.text(max_nb_chars=200),
            "error_code": faker.word().upper(),
            "severity": faker.random_element(elements=('error', 'critical')),
            "created_at": faker.date_time_this_year().isoformat(),
        })
    
    # Insert Error Logs
    print(f"Inserting {len(error_logs_data)} error logs...")
    for error_log in error_logs_data:
        try:
            supabase.table('error_logs').insert(error_log).execute()
        except Exception as e:
            print(f"Error inserting error log: {e}")

    # Generate Performance Metrics
    performance_metrics_data = []
    for _ in range(num_metrics):
        performance_metrics_data.append({
            "id": str(uuid.uuid4()),
            "metric_name": faker.random_element(elements=('cpu_usage', 'memory_usage', 'disk_io', 'network_latency')),
            "metric_value": faker.random_int(min=1, max=100),
            "timestamp": faker.date_time_this_year().isoformat(),
            "tenant_id": faker.random_element(elements=[t['id'] for t in tenants_data]),
        })
    
    # Insert Performance Metrics
    print(f"Inserting {len(performance_metrics_data)} performance metrics...")
    for metric in performance_metrics_data:
        try:
            supabase.table('performance_metrics').insert(metric).execute()
        except Exception as e:
            print(f"Error inserting performance metric: {e}")

    print("Dummy data generation complete.")

if __name__ == "__main__":
    generate_dummy_data()
