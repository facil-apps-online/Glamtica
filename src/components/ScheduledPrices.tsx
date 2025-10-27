
import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/useScreenSize';
import { format, parseISO, startOfToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeletePlanPrice } from '@/hooks/usePlanPriceHistory';
import { useToast } from '@/hooks/use-toast';
import { usePriceFormat } from '@/hooks/usePriceFormat'; // Importar el hook

export function ScheduledPrices({ isLoading, history }) {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const today = startOfToday();
  const { toast } = useToast();
  const { formatPrice } = usePriceFormat(); // Usar el hook

  const deleteMutation = useDeletePlanPrice();

  const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, priceId: null, planName: '', effectiveDate: '' });

  const futurePrices = useMemo(() => {
    if (!history) return [];
    return history
      .filter(item => parseISO(item.effective_date) > today)
      .sort((a, b) => parseISO(a.effective_date) - parseISO(b.effective_date));
  }, [history]);

  const handleDeleteRequest = (priceId, planName, effectiveDate) => {
    setDeleteAlert({ isOpen: true, priceId, planName, effectiveDate });
  };

  const confirmDelete = () => {
    if (!deleteAlert.priceId) return;

    deleteMutation.mutate(deleteAlert.priceId, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'El precio programado ha sido eliminado.', variant: 'success' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo eliminar: ${error.message}`, variant: 'destructive' });
      },
      onSettled: () => {
        setDeleteAlert({ isOpen: false, priceId: null, planName: '', effectiveDate: '' });
      }
    });
  };

  const renderCard = (item) => (
    <Card key={item.id} className="bg-slate-50/50 dark:bg-slate-800/20">
      <CardHeader className="p-4">
        <CardTitle className="text-base">{item.subscription_plans.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm space-y-1">
        <p><strong>Vigente desde:</strong> {format(parseISO(item.effective_date), 'dd MMM yyyy')}</p>
        <p><strong>Nuevo Precio Base:</strong> {formatPrice(item.base_price_cop)}</p>
        <p><strong>Nuevo Precio Sucursal:</strong> {formatPrice(item.extra_branch_price_cop)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => handleDeleteRequest(item.id, item.subscription_plans.name, format(parseISO(item.effective_date), 'dd MMM yyyy'))}
          disabled={deleteMutation.isPending && deleteMutation.variables === item.id}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar Programación
        </Button>
      </CardFooter>
    </Card>
  );

  const renderTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha Vigencia</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Nuevo Precio Base</TableHead>
          <TableHead>Nuevo Precio Sucursal</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {futurePrices.map(item => (
          <TableRow key={item.id}>
            <TableCell>{format(parseISO(item.effective_date), 'dd MMM yyyy')}</TableCell>
            <TableCell>{item.subscription_plans.name}</TableCell>
            <TableCell>{formatPrice(item.base_price_cop)}</TableCell>
            <TableCell>{formatPrice(item.extra_branch_price_cop)}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRequest(item.id, item.subscription_plans.name, format(parseISO(item.effective_date), 'dd MMM yyyy'))}
                disabled={deleteMutation.isPending && deleteMutation.variables === item.id}
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Precios Programados a Futuro</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            futurePrices.length > 0 ? (
              isMobile ? <div className="space-y-4">{futurePrices.map(renderCard)}</div> : renderTable()
            ) : (
              <p className="text-sm text-muted-foreground">No hay precios programados a futuro.</p>
            )
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteAlert.isOpen} onOpenChange={(isOpen) => setDeleteAlert({ ...deleteAlert, isOpen })}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la programación de precios para el plan <strong>{deleteAlert.planName}</strong> con fecha de vigencia del <strong>{deleteAlert.effectiveDate}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ isOpen: false, priceId: null, planName: '', effectiveDate: '' })}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
