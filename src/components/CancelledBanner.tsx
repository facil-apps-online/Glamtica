import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export function CancelledBanner() {
  return (
    <div className="bg-red-600 border-b border-red-700 text-white p-3 text-center text-sm flex items-center justify-center gap-3">
      <XCircle className="h-5 w-5" />
      <div>
        <span className="font-semibold">Tu suscripción ha sido cancelada.</span> Para volver a usar el sistema, necesitas adquirir un nuevo plan.
      </div>
      <Button asChild size="sm" className="bg-red-800 hover:bg-red-900 text-white ml-4">
        <Link to="/subscribe">Ver Planes</Link>
      </Button>
    </div>
  );
}
