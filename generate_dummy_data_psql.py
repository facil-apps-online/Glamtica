import os
import subprocess

# Database connection details for the pooler
DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"
DB_USER = "postgres.vtfsbogpkrcbfuhhoepf"
DB_PASSWORD = "3nt3patatA*.*"

dummy_data_file_path = "C:/Desarrollos/Glamtica.app/supabase/migrations/20250630050708_patient_pine.sql"
PSQL_PATH = "C:/Program Files/PostgreSQL/17/bin/psql.exe"

def generate_dummy_data_with_psql():
    print("Generating dummy data using psql...")

    # Set PGPASSWORD environment variable for psql
    env = os.environ.copy()
    env["PGPASSWORD"] = DB_PASSWORD

    try:
        with open(dummy_data_file_path, 'r') as f:
            sql_content = f.read()

        # Replace the incorrect dollar-quoting termination
        sql_content = sql_content.replace('END $;\n', 'END $$;\n')

        # Construct the psql command
        psql_command = [
            PSQL_PATH,
            "-h", DB_HOST,
            "-p", DB_PORT,
            "-d", DB_NAME,
            "-U", DB_USER,
        ]

        # Execute the psql command, passing SQL content via stdin
        process = subprocess.run(psql_command, input=sql_content, env=env, capture_output=True, text=True, check=True)
        
        print("Dummy data generated successfully.")
        if process.stdout:
            print("STDOUT:")
            print(process.stdout)
        if process.stderr:
            print("STDERR:")
            print(process.stderr)

    except FileNotFoundError:
        print("Error: psql command not found at the specified path. Please check PSQL_PATH.")
    except subprocess.CalledProcessError as e:
        print(f"Error generating dummy data with psql. Exit code: {e.returncode}")
        print("STDOUT:")
        print(e.stdout)
        print("STDERR:")
        print(e.stderr)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    generate_dummy_data_with_psql()