import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SocialNetworkManager } from '@/components/SocialNetworkManager';
import { Image } from 'lucide-react';

interface BranchIdentityTabProps {
  branchId: string;
  tenantId: string;
}

export function BranchIdentityTab({ branchId, tenantId }: BranchIdentityTabProps) {

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Image className="h-5 w-5" />
            Fotos de la Sucursal
          </CardTitle>
          <CardDescription>
            Gestiona las fotos que se mostrarán en el micrositio de esta sucursal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for Photo Uploader/Manager */}
          <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
            <p className="text-slate-500">Próximamente: Gestor de Fotos</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociales</CardTitle>
          <CardDescription>
            Añade y gestiona los enlaces a las redes sociales de esta sucursal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialNetworkManager branchId={branchId} />
        </CardContent>
      </Card>
    </div>
  );
}
