
import os
import subprocess

# Database connection details for the pooler
DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"
DB_USER = "postgres.vtfsbogpkrcbfuhhoepf"
DB_PASSWORD = "3nt3patatA*.*"

migration_file_path = "C:/Desarrollos/Glamtica.app/supabase/migrations/20250710180000_multi_tenant_roles.sql"
PSQL_PATH = "C:/Program Files/PostgreSQL/17/bin/psql.exe"

def apply_migration_with_psql():
    print("Applying migration using psql...")

    # Set PGPASSWORD environment variable for psql
    env = os.environ.copy()
    env["PGPASSWORD"] = DB_PASSWORD

    # Construct the psql command
    psql_command = [
        PSQL_PATH,
        "-h", DB_HOST,
        "-p", DB_PORT,
        "-d", DB_NAME,
        "-U", DB_USER,
        "-f", migration_file_path # -f option to execute commands from file
    ]

    try:
        # Execute the psql command
        process = subprocess.run(psql_command, env=env, capture_output=True, text=True, check=True)
        
        print("Migration applied successfully.")
        if process.stdout:
            print("STDOUT:")
            print(process.stdout)
        if process.stderr:
            print("STDERR:")
            print(process.stderr)

    except FileNotFoundError:
        print("Error: psql command not found at the specified path. Please check PSQL_PATH.")
    except subprocess.CalledProcessError as e:
        print(f"Error applying migration with psql. Exit code: {e.returncode}")
        print("STDOUT:")
        print(e.stdout)
        print("STDERR:")
        print(e.stderr)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    apply_migration_with_psql()
