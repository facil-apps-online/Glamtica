import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCalculateBatchProration } from '@/hooks/useBranches';
import { useWompiCheckout } from '@/hooks/useWompiCheckout'; // Import new hook
import { useAuth } from '@/contexts/AuthContext';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ActivateBranchesBatchDialog({ isOpen, onOpenChange, branchIds, onSuccess, tenantId }) {
  const { toast } = useToast();
  const { currentAssignment, profile, loading: isAuthLoading } = useAuth(); // Get assignment, profile and loading status
  const { formatPrice } = usePriceFormat();
  const formRef = useRef<HTMLFormElement>(null);

  const wompiCheckoutMutation = useWompiCheckout();

  const { 
    data: calculation, 
    isLoading: isCalculating, 
    isError: isCalculationError, 
    error: calculationError,
  } = useCalculateBatchProration(tenantId, branchIds, { 
    enabled: isOpen && branchIds.length > 0 
  });

  const handleProceedToPayment = async () => {
    if (!profile?.id) {
      toast({ title: 'Error de Autenticación', description: 'No se pudo verificar al usuario. Por favor, recarga la página.', variant: 'destructive' });
      return;
    }

    if (!calculation || !currentAssignment?.tenant_id) {
      toast({ title: 'Error de Contexto', description: 'No se pudo obtener la información del negocio para iniciar el pago.', variant: 'destructive' });
      return;
    }

    const checkoutRequest = {
      tenantId: currentAssignment.tenant_id,
      redirectUrl: `${window.location.origin}/settings?tab=branches&payment_status=success`,
      userId: profile.id,
      amountInCents: Math.round(calculation.total_prorated_amount * 100),
      currency: 'COP',
      actions_on_success: [
        {
          action_type: 'ACTIVATE_BRANCHES',
          payload: { branch_ids: branchIds },
        },
      ],
    };

    wompiCheckoutMutation.mutate(checkoutRequest, {
      onSuccess: (checkoutData) => {
        if (formRef.current) {
          while (formRef.current.firstChild) {
            formRef.current.removeChild(formRef.current.firstChild);
          }
          Object.keys(checkoutData).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = checkoutData[key];
            formRef.current?.appendChild(input);
          });
          formRef.current.submit();
        }
      },
      onError: (error) => {
        toast({
          title: 'Error al Iniciar Pago',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleClose = () => {
    if (wompiCheckoutMutation.isPending) return;
    onOpenChange(false);
  };
  
  const renderContent = () => {
    const isLoading = isCalculating || wompiCheckoutMutation.isPending || isAuthLoading;
    const isError = isCalculationError || wompiCheckoutMutation.isError;
    const error = calculationError || wompiCheckoutMutation.error;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4">{isAuthLoading ? 'Verificando sesión...' : isCalculating ? 'Calculando costos...' : 'Redirigiendo a Wompi...'}</p>
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error?.message}</AlertDescription>
        </Alert>
      );
    }

    if (calculation) {
      return (
        <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Resumen de Cargos</AlertTitle>
              <AlertDescription>
                Se realizará un cargo total de <strong>{formatPrice(calculation.total_prorated_amount)}</strong> por la activación de estas sucursales.
              </AlertDescription>
            </Alert>
            <ScrollArea className="h-40 w-full rounded-md border p-4">
                <div className="space-y-2">
                    {calculation.details.map(detail => (
                        <div key={detail.branch_id} className="text-sm flex justify-between">
                            <span>{detail.branch_name}</span>
                            <span className="font-medium">{formatPrice(detail.prorated_amount)}</span>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
      );
    }

    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Activar Sucursales en Lote</DialogTitle>
          <DialogDescription>
            Revisa los costos prorrateados antes de proceder al pago para activar las {branchIds.length} sucursales.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <form ref={formRef} action="https://checkout.wompi.co/p/" method="GET" style={{ display: 'none' }}></form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={wompiCheckoutMutation.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleProceedToPayment} 
            disabled={isCalculating || isCalculationError || wompiCheckoutMutation.isPending || !calculation || isAuthLoading}
          >
            {wompiCheckoutMutation.isPending ? 'Procesando...' : `Proceder al Pago (${formatPrice(calculation?.total_prorated_amount || 0)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}