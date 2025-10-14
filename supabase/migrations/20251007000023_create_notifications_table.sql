-- supabase/migrations/20251007000023_create_notifications_table.sql

-- 1. Define un tipo enumerado para las notificaciones
create type public.notification_type as enum (
    'system_event',
    'mention',
    'task_assigned',
    'new_appointment'
);

-- 2. Crea la tabla de notificaciones
create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    type public.notification_type not null,
    title text not null,
    body text,
    link_to text, -- Almacena una URL relativa, ej: /clients/123
    read_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),

    constraint title_not_empty check (title <> '')
);

-- 3. Añade comentarios para claridad
comment on table public.notifications is 'Almacena notificaciones para los usuarios dentro de un tenant.';
comment on column public.notifications.link_to is 'URL relativa para redirigir al usuario al hacer clic.';
comment on column public.notifications.read_at is 'Timestamp de cuando la notificación fue leída. Si es NULL, está no leída.';

-- 4. Crea índices para mejorar el rendimiento de las consultas
create index idx_notifications_tenant_user on public.notifications(tenant_id, user_id);
create index idx_notifications_user_id on public.notifications(user_id);

-- 5. Habilita la Seguridad a Nivel de Fila (RLS)
alter table public.notifications enable row level security;

-- 6. Define las políticas de RLS para multitenancy

-- Los usuarios pueden ver sus propias notificaciones dentro de su tenant
create policy "Allow users to read their own notifications"
on public.notifications for select
using (
    auth.uid() = user_id and
    (auth.jwt() -> 'app_metadata' -> 'assignments' -> 0 ->> 'tenant_id')::uuid = tenant_id
);

-- Los usuarios pueden marcar sus propias notificaciones como leídas
create policy "Allow users to update their own notifications"
on public.notifications for update
using (
    auth.uid() = user_id and
    (auth.jwt() -> 'app_metadata' -> 'assignments' -> 0 ->> 'tenant_id')::uuid = tenant_id
)
with check (
    auth.uid() = user_id and
    (auth.jwt() -> 'app_metadata' -> 'assignments' -> 0 ->> 'tenant_id')::uuid = tenant_id
);

-- Nota: No se crea una política de INSERT o DELETE para los usuarios.
-- Las notificaciones serán creadas por el sistema usando el rol `service_role` que bypassa RLS.
