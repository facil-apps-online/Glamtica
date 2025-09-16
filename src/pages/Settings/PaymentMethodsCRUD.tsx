import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePaymentMethods, PaymentMethod } from '@/hooks/usePaymentMethods';
import { useDeletePaymentMethod } from '@/hooks/useDeletePaymentMethod';
import { PaymentMethodDialog } from './PaymentMethodDialog';
import { Pencil, Trash2 } from 'lucide-react';

interface PaymentMethodsCRUDProps {
  tenantId: string;
}

export const PaymentMethodsCRUD: React.FC<PaymentMethodsCRUDProps> = ({ tenantId }) => {
  const { data: paymentMethods = [], isLoading } = usePaymentMethods(tenantId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const deletePaymentMethodMutation = useDeletePaymentMethod(tenantId);

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPaymentMethod(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deletePaymentMethodMutation.mutate(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Medios de Pago</h3>
          <p className="text-sm text-muted-foreground">Gestiona los medios de pago aceptados en tu negocio.</p>
        </div>
        <Button onClick={handleCreate}>Agregar Medio de Pago</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3}>Cargando...</TableCell>
            </TableRow>
          ) : (
            paymentMethods.map((method: PaymentMethod) => (
              <TableRow key={method.id}>
                <TableCell>{method.name}</TableCell>
                <TableCell>{method.is_active ? 'Sí' : 'No'}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(method)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el medio de pago.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(method.id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <PaymentMethodDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        paymentMethod={selectedPaymentMethod}
        tenantId={tenantId} 
      />
    </div>
  );
};