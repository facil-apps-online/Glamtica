# Plan de Desarrollo: Sistema de Pantalla de Turnos (TV Turn Display)

## Objetivo
Implementar un sistema que permita a cada sucursal mostrar los turnos de clientes en una pantalla de TV, con la capacidad de que los estilistas llamen a los clientes, y que la TV pueda reproducir contenido multimedia. El registro de la TV se hará mediante un código de activación.

## Fases del Proyecto

### Fase 1: Backend - Gestión Central de Turnos y Registro de TV

- [x] **1.1 Diseño de la Base de Datos (Supabase):**
    - [x] Crear tabla `tv_displays`:
        - `id` (UUID, PK)
        - `branch_id` (UUID, FK a `branches`)
        - `registration_code` (TEXT, UNIQUE, código corto para activación)
        - `is_registered` (BOOLEAN, default FALSE)
        - `registered_at` (TIMESTAMP WITH TIME ZONE, nullable)
        - `last_heartbeat` (TIMESTAMP WITH TIME ZONE, para monitoreo)
        - `media_playlist_id` (UUID, FK a `media_playlists`, nullable)
    - [x] Crear tabla `turns`:
        - `id` (UUID, PK)
        - `branch_id` (UUID, FK a `branches`)
        - `client_id` (UUID, FK a `clients`)
        - `stylist_id` (UUID, FK a `users`)
        - `status` (TEXT, ENUM: 'waiting', 'called', 'in_service', 'completed')
        - `called_at` (TIMESTAMP WITH TIME ZONE, nullable)
        - `created_at` (TIMESTAMP WITH TIME ZONE, default NOW())
    - [x] Crear tabla `media_playlists`:
        - `id` (UUID, PK)
        - `tenant_id` (UUID, FK a `tenants`)
        - `name` (TEXT)
        - `description` (TEXT, nullable)
        - `created_at` (TIMESTAMP WITH TIME ZONE, default NOW())
    - [x] Crear tabla `playlist_items`:
        - `id` (UUID, PK)
        - `playlist_id` (UUID, FK a `media_playlists`)
        - `media_url` (TEXT, URL de YouTube/Spotify)
        - `media_type` (TEXT, ENUM: 'youtube', 'spotify')
        - `item_order` (INTEGER, para el orden de reproducción)
        - `created_at` (TIMESTAMP WITH TIME ZONE, default NOW())

- [x] **1.2 Funciones RPC (Supabase):**
    - [x] `register_tv_display(p_registration_code text)`: Crea un registro `tv_display` con `is_registered = false`.
    - [x] `authorize_tv_display(p_tv_display_id uuid, p_branch_id uuid, p_tenant_id uuid)`: Autoriza una TV.
    - [x] `get_tv_display_by_code(p_registration_code text)`: Obtiene detalles de TV por código.
    - [x] `get_tv_display_settings(p_tv_display_id uuid)`: Obtiene configuración de TV (incluye playlist).
    - [x] `get_playlist_items(p_playlist_id uuid)`: Obtiene ítems de una playlist.
    - [x] `get_current_turns_for_branch(p_branch_id uuid)`: Obtiene turnos 'waiting'/'called'.
    - [x] `add_turn(p_branch_id uuid, p_client_id uuid, p_stylist_id uuid)`: Añade un nuevo turno.
    - [x] `call_turn(p_turn_id uuid)`: Cambia estado a 'called', registra `called_at`.
    - [x] `start_service_for_turn(p_turn_id uuid)`: Cambia estado a 'in_service' o 'completed' (desaparece de TV).
    - [x] `update_tv_heartbeat(p_tv_display_id uuid)`: Actualiza `last_heartbeat`.

- [x] **1.3 Realtime:**
    - [x] Habilitar Realtime para la tabla `turns`.

### Fase 2: Frontend - Interfaz de Administración y Estilista

    - [x] Administración de TVs (Nueva Página `src/pages/TvManagementPage.tsx`):
    - [x] Listar TVs registradas.
    - [x] Formulario para registrar/autorizar TVs con código.
    - [x] CRUD para `media_playlists` y `playlist_items`.
    - [x] Asignar `media_playlist` a `tv_display`.

### Fase 3: Frontend - Aplicación de TV (Integrada en la App Principal)

    - [x] Nuevo Componente (`src/pages/TvDisplayPage.tsx`):
    - [x] Vista de Registro: Muestra código único para activación.
    - [x] Vista Principal:
        - [x] Conexión a Supabase Realtime para `turns`.
        - [x] Muestra turnos 'waiting' y 'called' para la sucursal asignada.
        - [x] Reproducción embebida de YouTube/Spotify (iframes).
        - [x] Lógica para rotación de medios.
        - [x] Animación/sonido para turnos 'called'.

**Proyecto Completado: Sistema de Pantalla de Turnos (TV Turn Display)**
**Fecha de finalización:** jueves, 21 de agosto de 2025