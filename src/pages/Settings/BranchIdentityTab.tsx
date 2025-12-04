import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SocialNetworkManager } from '@/components/SocialNetworkManager';
import { Image } from 'lucide-react';
import { GenericRichTextEditor } from '@/components/ui/GenericRichTextEditor';
import { Button } from '@/components/ui/button';
import { useUpdateBranch, useBranches } from '@/hooks/useBranches';
import { toast } from 'sonner';

interface BranchIdentityTabProps {
  branchId: string;
  tenantId: string;
}

export function BranchIdentityTab({ branchId, tenantId }: BranchIdentityTabProps) {
  const { data: branches } = useBranches(tenantId);
  const branchToEdit = branches?.find(b => b.id === branchId);
  const { mutateAsync: updateBranch, isPending: isUpdating } = useUpdateBranch(tenantId);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (branchToEdit?.description) {
      setDescription(branchToEdit.description);
    }
  }, [branchToEdit]);

  const handleSaveDescription = async () => {
    if (!branchToEdit) return;
    try {
      await updateBranch({
        p_branch_id: branchId,
        p_tenant_id: tenantId,
        p_description: description,
      });
      toast.success('Descripción de la sucursal guardada con éxito.');
    } catch (error) {
      toast.error('Error al guardar la descripción de la sucursal.');
      console.error(error);
    }
  };

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
          <CardTitle>Descripción de la Sucursal</CardTitle>
          <CardDescription>
            Esta descripción aparecerá en tu micrositio. Habla sobre lo que hace especial a esta sucursal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenericRichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Describe la sucursal aquí..."
          />
          <Button onClick={handleSaveDescription} disabled={isUpdating} className="mt-4">
            {isUpdating ? 'Guardando...' : 'Guardar Descripción'}
          </Button>
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
