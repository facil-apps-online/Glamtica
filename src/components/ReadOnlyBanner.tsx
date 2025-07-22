import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export function ReadOnlyBanner() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'tenant_super_admin' || user?.role === 'tenant_admin';

  return (
    <div className="bg-yellow-500 border-b border-yellow-600 text-yellow-900 p-3 text-center text-sm flex items-center justify-center gap-3">
      {isAdmin ? (
        <>
          <AlertTriangle className="h-5 w-5" />
          <div>
            <span className="font-semibold">Tu suscripción requiere atención.</span> Para reactivar todas las funcionalidades, por favor, actualiza tu plan.
          </div>
          <Button asChild size="sm" className="bg-yellow-800 hover:bg-yellow-900 text-white ml-4">
            <Link to="/subscribe">Renovar Suscripción</Link>
          </Button>
        </>
      ) : (
        <>
          <ShieldAlert className="h-5 w-5" />
          <div>
            <span className="font-semibold">Sistema restringido.</span> Comunícate con tu administrador para reactivar el servicio.
          </div>
        </>
      )}
    </div>
  );
}
