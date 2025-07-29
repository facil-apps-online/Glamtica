import os
from pathlib import Path
from supabase import create_client, Client
from collections import defaultdict

# --- Configuración ---
SUPABASE_URL = "https://vtfsbogpkrcbfuhhoepf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg"
DOCS_ROOT = Path("schema_docs")

def setup_directories():
    """Limpia y crea la estructura de directorios para la documentación."""
    print("Configurando directorios...")
    if DOCS_ROOT.exists():
        for root, dirs, files in os.walk(DOCS_ROOT, topdown=False):
            for name in files:
                try:
                    os.remove(os.path.join(root, name))
                except OSError as e:
                    print(f"Error eliminando archivo {os.path.join(root, name)}: {e}")
            for name in dirs:
                try:
                    os.rmdir(os.path.join(root, name))
                except OSError as e:
                    print(f"Error eliminando directorio {os.path.join(root, name)}: {e}")
    
    (DOCS_ROOT / "tables").mkdir(parents=True, exist_ok=True)
    (DOCS_ROOT / "functions").mkdir(parents=True, exist_ok=True)
    (DOCS_ROOT / "types").mkdir(parents=True, exist_ok=True)
    print("Directorios listos.")

def fetch_schema_data(supabase: Client):
    """Llama a las funciones RPC de introspección y devuelve los datos."""
    print("Obteniendo datos del esquema a través de las funciones RPC...")
    try:
        print("Llamando a get_all_tables...")
        tables_res = supabase.rpc('get_all_tables', {}).execute()
        tables_data = tables_res.data if tables_res.data else []

        print("Llamando a get_all_constraints...")
        constraints_res = supabase.rpc('get_all_constraints', {}).execute()
        constraints_data = constraints_res.data if constraints_res.data else []

        print("Llamando a get_all_functions...")
        functions_res = supabase.rpc('get_all_functions', {}).execute()
        functions_data = functions_res.data if functions_res.data else []
        
        print("Llamando a get_all_types...")
        types_res = supabase.rpc('get_all_types', {}).execute()
        types_data = types_res.data if types_res.data else []

        print("Datos del esquema obtenidos correctamente.")
        return tables_data, constraints_data, functions_data, types_data
    except Exception as e:
        print(f"Error al llamar a las funciones RPC de introspección: {e}")
        raise

def process_and_write_docs(tables_data, constraints_data, functions_data, types_data):
    """Procesa los datos y escribe los archivos Markdown."""
    print("Procesando y escribiendo documentación...")

    # --- Procesar Tablas ---
    tables = defaultdict(list)
    for col in tables_data:
        tables[(col['table_schema'], col['table_name'])].append(col)
    
    constraints = defaultdict(list)
    for const in constraints_data:
        constraints[(const['table_schema'], const['table_name'])].append(const)

    for (schema, name), columns in tables.items():
        md_content = f"# Tabla: `{schema}.{name}`\n\n"
        md_content += "## Columnas\n\n"
        md_content += "| Nombre | Tipo | Nulable | Default |\n"
        md_content += "|---|---|---|---|\n"
        for col in sorted(columns, key=lambda x: x['ordinal_position']):
            md_content += f"| `{col['column_name']}` | `{col['data_type']}` | {col['is_nullable'] == 'YES'} | `{col['column_default'] or ''}` |\n"
        
        table_constraints = constraints.get((schema, name), [])
        if table_constraints:
            md_content += "\n## Restricciones\n\n"
            md_content += "| Nombre | Tipo | Columnas | Referencia Externa |\n"
            md_content += "|---|---|---|---|\n"
            for const in table_constraints:
                ref = f"`{const['foreign_table_schema']}.{const['foreign_table_name']}({const['foreign_column_name']})`" if const['foreign_table_name'] else ''
                md_content += f"| `{const['constraint_name']}` | `{const['constraint_type']}` | `{const['column_name']}` | {ref} |\n"

        with open(DOCS_ROOT / "tables" / f"{schema}.{name}.md", "w", encoding="utf-8") as f:
            f.write(md_content)

    # --- Procesar Funciones ---
    functions = defaultdict(list)
    for func in functions_data:
        functions[(func['routine_schema'], func['routine_name'])].append(func)

    for (schema, name), params in functions.items():
        definition = params[0]['function_definition'] or ''
        return_type = params[0]['return_type']
        md_content = f"# Función: `{schema}.{name}`\n\n"
        md_content += f"**Retorna:** `{return_type}`\n\n"
        
        if any(p['parameter_name'] for p in params):
            md_content += "## Parámetros\n\n"
            md_content += "| Nombre | Tipo | Modo |\n"
            md_content += "|---|---|---|\n"
            for p in params:
                if p['parameter_name']:
                    md_content += f"| `{p['parameter_name']}` | `{p['parameter_type']}` | `{p['parameter_mode']}` |\n"
        
        if definition:
            md_content += "\n## Definición Completa\n\n"
            md_content += f"```sql\n{definition}\n```\n"
        
        with open(DOCS_ROOT / "functions" / f"{schema}.{name}.md", "w", encoding="utf-8") as f:
            f.write(md_content)

    # --- Procesar Tipos ---
    types = defaultdict(list)
    for type_ in types_data:
        types[(type_['enum_schema'], type_['enum_name'])].append(type_['enum_value'])

    for (schema, name), values in types.items():
        md_content = f"# Tipo ENUM: `{schema}.{name}`\n\n"
        md_content += "## Valores Posibles\n\n"
        for val in values:
            md_content += f"- `{val}`\n"
        
        with open(DOCS_ROOT / "types" / f"{schema}.{name}.md", "w", encoding="utf-8") as f:
            f.write(md_content)
    
    print("Archivos de documentación generados.")

def generate_index():
    """Genera el archivo _index.md con enlaces a todos los documentos."""
    print("Generando archivo de índice...")
    md_content = "# Diccionario de Datos de la Aplicación\n\n"
    md_content += "Este documento es generado automáticamente y refleja el estado actual del esquema de la base de datos.\n\n"

    for doc_type in ["tables", "functions", "types"]:
        md_content += f"## {doc_type.capitalize()}\n\n"
        folder = DOCS_ROOT / doc_type
        files = sorted(os.listdir(folder))
        if not files:
            md_content += "_No se encontraron elementos de este tipo._\n\n"
        else:
            for f in files:
                md_content += f"- [{f.replace('.md', '')}](./{doc_type}/{f})\n"
            md_content += "\n"
            
    with open(DOCS_ROOT / "_index.md", "w", encoding="utf-8") as f:
        f.write(md_content)
    print("Índice `_index.md` generado.")

def main():
    """Función principal que orquesta todo el proceso."""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        setup_directories()
        tables, constraints, functions, types = fetch_schema_data(supabase)
        process_and_write_docs(tables, constraints, functions, types)
        generate_index()
        print("\n¡Proceso completado exitosamente!")

    except Exception as e:
        print(f"\nOcurrió un error durante la generación de la documentación: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()