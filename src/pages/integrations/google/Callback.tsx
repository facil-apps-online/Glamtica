import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';

const GoogleCallbackPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Iniciando...');
  const location = useLocation();
  const { currentAssignment, loading: authLoading } = useAuth();

    useEffect(() => {
        const postMessageAndClose = (success: boolean, error?: string) => {
            if (window.opener) {
                window.opener.postMessage({ type: 'google-auth-callback', success, error }, window.location.origin);
                window.close();
            }
        };

        const processAuth = async () => {
      setMessage('Procesando autenticación de Google...');
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state');
      const authError = params.get('error');

      if (authError) {
        setError(`Error de Google: ${authError}`);
        postMessageAndClose(false, `Error de Google: ${authError}`);
        return;
      }

      if (!code || !state) {
        const paramError = 'Parámetros de autenticación inválidos o faltantes.';
        setError(paramError);
        setMessage('Error: No se pudo completar la autenticación.');
        postMessageAndClose(false, paramError);
        return;
      }

      const stateParts = state.split(':');
      if (stateParts.length !== 2) {
        const stateError = 'El parámetro de estado es inválido.';
        setError(stateError);
        setMessage('Error: Estado de autenticación corrupto.');
        postMessageAndClose(false, stateError);
        return;
      }

      const [tenantId, provider] = stateParts;

      try {
        setMessage('Intercambiando código por tokens de acceso...');
        const { error: functionError } = await supabase.functions.invoke('google-oauth-token', {
          body: { code, tenantId, provider },
        });

        if (functionError) {
          throw new Error(`La función de Supabase falló: ${functionError.message}`);
        }
        
        setMessage('¡Integración completada exitosamente!');
        postMessageAndClose(true);

      } catch (e: any) {
        console.error('Error during token exchange:', e);
        setError(`Error al procesar la autenticación: ${e.message}`);
        setMessage('Ocurrió un error inesperado.');
        postMessageAndClose(false, e.message);
      }
    };

    processAuth();
  }, [authLoading, currentAssignment, location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Conectando con Google</h1>
        <p className="text-gray-600 mb-4">{message}</p>
        {error && (
          <div>
            <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Cerrar Ventana
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
