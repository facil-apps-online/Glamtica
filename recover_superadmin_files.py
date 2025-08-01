import os
import subprocess
import shutil # Importar shutil para mover archivos

def recover_files_from_git_history(file_commits_path, output_base_dir):
    with open(file_commits_path, 'r') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line:
            continue

        try:
            file_path, commit_hash = line.split(': ')
            file_path = file_path.strip()
            commit_hash = commit_hash.strip()

            # Convert file_path to use forward slashes for git commands
            git_file_path = file_path.replace(os.sep, '/')

            output_full_path = os.path.join(output_base_dir, file_path)
            output_dir = os.path.dirname(output_full_path)

            if not os.path.exists(output_dir):
                os.makedirs(output_dir)

            print(f"Intentando recuperar '{file_path}' del commit '{commit_hash}'...")

            try:
                # 1. Restaurar temporalmente el archivo en su ubicación original
                checkout_command = f"git checkout {commit_hash} -- \"{git_file_path}\"";
                subprocess.run(checkout_command, shell=True, check=True, capture_output=True, text=True, encoding='utf-8')

                # 2. Mover el archivo restaurado a la carpeta de backup
                shutil.move(file_path, output_full_path)
                print(f"  Recuperado y movido: '{file_path}'")

                # 3. Deshacer el checkout para limpiar el directorio de trabajo
                restore_command = f"git restore --staged --worktree \"{git_file_path}\"";
                subprocess.run(restore_command, shell=True, check=True, capture_output=True, text=True, encoding='utf-8')
                # No print for successful restore
            except subprocess.CalledProcessError as e:
                print(f"ERROR: No se pudo recuperar '{file_path}' del commit '{commit_hash}'.")
                print(f"  Mensaje de error de Git: {e.stderr.strip()}")
                # Intentar restaurar el archivo original si el checkout falló y dejó algo
                try:
                    restore_command = f"git restore --staged --worktree \"{git_file_path}\"";
                    subprocess.run(restore_command, shell=True, check=False, capture_output=True, text=True, encoding='utf-8')
                except Exception as restore_e:
                    print(f"  Advertencia: Fallo al intentar restaurar el archivo original después del error: {restore_e}")
            except FileNotFoundError:
                print(f"ERROR: El archivo '{file_path}' no se encontró en el directorio de trabajo después del checkout. Posiblemente la ruta en el commit no es la esperada.")
            except Exception as e:
                print(f"ERROR INESPERADO al procesar '{file_path}': {e}")

        except Exception as e:
            print(f"ERROR: Fallo al procesar la línea '{line.strip()}'. Mensaje: {e}")

# Uso del script:
# Asegúrate de que este script se ejecute en el directorio raíz de tu repositorio Git.
file_commits_file = "Superadmin_Backup/file_commits.txt"
output_directory = "Superadmin_Backup"
recover_files_from_git_history(file_commits_file, output_directory)