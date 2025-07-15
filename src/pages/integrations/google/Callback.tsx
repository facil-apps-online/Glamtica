import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';

const GoogleCallbackPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Iniciando...');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // --- CONSOLE LOGS PARA DEBUG ---
    console.log('[Callback Page] useEffect triggered.');
    console.log(`[Callback Page] Auth loading state: ${authLoading}`);
    console.log(`[Callback Page] User object:`, user);
    // --- FIN DE CONSOLE LOGS ---

    if (authLoading) {
      console.log('[Callback Page] Auth is loading. Waiting...');
      setMessage('Verificando sesión de superadministrador...');
      return;
    }

    const processAuth = async () => {
      console.log('[Callback Page] Starting processAuth function.');
      if (user?.role !== 'super_admin') {
        console.error(`[Callback Page] Access denied. User role is: '${user?.role}'. Required: 'super_admin'.`);
        setError('Acceso denegado. Debes ser un superadministrador.');
        setMessage('Error de autenticación.');
        return;
      }

      setMessage('Procesando autenticación de Google...');
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (!code || !state) {
        setError('Parámetros de autenticación inválidos o faltantes.');
        setMessage('Error: No se pudo completar la autenticación.');
        return;
      }

      const tenantId = state;

      try {
        setMessage('Intercambiando código por tokens de acceso...');
        
        const { data, error: functionError } = await supabase.functions.invoke('google-oauth-token', {
          body: { code, tenantId },
        });

        if (functionError) {
          console.error("[Callback Page] Raw functionError object:", functionError);
          throw new Error(`Edge Function returned a non-2xx status code. Details: ${functionError.message}`);
        }
        
        setMessage('¡Integración completada exitosamente! Redirigiendo...');
        
        setTimeout(() => {
          navigate(`/superadmin/tenants/${tenantId}`);
        }, 2000);

      } catch (e: any) {
        console.error('Error during token exchange:', e);
        setError(`Error al procesar la autenticación: ${e.message}`);
        setMessage('Ocurrió un error inesperado.');
      }
    };

    processAuth();
  }, [authLoading, user, location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Conectando con Google</h1>
        <p className="text-gray-600 mb-4">{message}</p>
        {error && (
          <div>
            <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>
            <button
              onClick={() => navigate('/superadmin')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Volver al Panel
            </button>
          </div>
        )}
        {!error && (
          <div className="flex justify-center items-center">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
