import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useActivateBranch } from '@/hooks/useBranches';
import { usePriceFormat } from '@/hooks/usePriceFormat'; // Import the price format hook
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ActivateBranchDialog({ isOpen, onOpenChange, branchId, branchName, onSuccess }) {
  const [result, setResult] = useState(null);
  const { toast } = useToast();
  const activateBranchMutation = useActivateBranch();
  const { formatPrice } = usePriceFormat(); // Use the hook

  const handleActivate = () => {
    activateBranchMutation.mutate(branchId, {
      onSuccess: (data) => {
        if (data.success) {
          setResult(data);
          toast({
            title: '¡Sucursal Activada!',
            description: 'La sucursal ahora está operativa.',
          });
          onSuccess();
        } else {
          toast({
            title: 'Error en la Activación',
            description: data.message || 'Ocurrió un error en el servidor.',
            variant: 'destructive',
          });
        }
      },
      onError: (error) => {
        toast({
          title: 'Error en la Activación',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setResult(null);
      activateBranchMutation.reset();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activar Sucursal: {branchName}</DialogTitle>
          <DialogDescription>
            Estás a punto de activar esta sucursal. Se realizará un cargo prorrateado por el resto de tu ciclo de facturación.
          </DialogDescription>
        </DialogHeader>

        {activateBranchMutation.isPending && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4">Procesando activación...</p>
          </div>
        )}

        {activateBranchMutation.isError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{activateBranchMutation.error.message}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant="success">
            <AlertTitle>Activación Completada</AlertTitle>
            <AlertDescription>
              La sucursal <strong>{branchName}</strong> ha sido activada.
              <br />
              Se ha generado un cargo de <strong>{formatPrice(result.prorated_amount_charged)}</strong>.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose}>
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button onClick={handleActivate} disabled={activateBranchMutation.isPending}>
              {activateBranchMutation.isPending ? 'Activando...' : 'Confirmar y Activar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
