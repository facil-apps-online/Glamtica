
-- 1. Crear la tabla para almacenar la participación de los inversores en las plataformas.
CREATE TABLE public.investor_platform_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
    investment_share NUMERIC(5, 4) NOT NULL CHECK (investment_share > 0 AND investment_share <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un inversor solo puede tener una participación por plataforma.
    CONSTRAINT unique_user_platform_share UNIQUE (user_id, platform_id)
);

-- 2. Habilitar RLS y definir políticas.
ALTER TABLE public.investor_platform_shares ENABLE ROW LEVEL SECURITY;

-- 3. Crear un trigger para actualizar 'updated_at'.
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.investor_platform_shares
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- 4. Comentarios para la documentación.
COMMENT ON TABLE public.investor_platform_shares IS 'Almacena el porcentaje de participación que un inversor (usuario) tiene sobre una plataforma específica.';
COMMENT ON COLUMN public.investor_platform_shares.user_id IS 'El ID del usuario inversor.';
COMMENT ON COLUMN public.investor_platform_shares.platform_id IS 'El ID de la plataforma en la que se invierte.';
COMMENT ON COLUMN public.investor_platform_shares.investment_share IS 'El porcentaje de participación, ej. 0.15 para 15%.';

-- 5. Políticas de acceso
-- Solo los superadministradores pueden gestionar las participaciones de los inversores.
-- Se utiliza la función get_current_role_name() que ya existe en el sistema.
CREATE POLICY "Superadmins can manage investor shares"
ON public.investor_platform_shares
FOR ALL
USING (public.get_current_role_name() = 'super_admin')
WITH CHECK (public.get_current_role_name() = 'super_admin');
