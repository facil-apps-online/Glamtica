import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePaymentMethods, PaymentMethod } from '@/hooks/usePaymentMethods';
import { useDeletePaymentMethod } from '@/hooks/useDeletePaymentMethod';
import { PaymentMethodDialog } from './PaymentMethodDialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, CreditCard, Plus, MoreHorizontal } from 'lucide-react';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Skeleton } from '@/components/ui/skeleton';

// --- Skeleton Components ---
const PaymentMethodCardSkeleton = () => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div className="space-y-1.5 w-full">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <div className="space-x-2 flex">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </CardContent>
  </Card>
);

const PaymentMethodTableSkeleton = () => (
  <>
    {[...Array(3)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
        <TableCell className="space-x-2">
          <Skeleton className="h-9 w-9 inline-block" />
          <Skeleton className="h-9 w-9 inline-block" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

// --- Card Component for Mobile View ---
const PaymentMethodCard = ({ method, handleEdit, handleDelete }: { method: PaymentMethod, handleEdit: (method: PaymentMethod) => void, handleDelete: (id: string) => void }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div className="space-y-1.5">
        <p className="font-medium">{method.name}</p>
        <Badge variant={method.is_active ? 'default' : 'outline'}>
          {method.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(method)}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Eliminar</span>
                </DropdownMenuItem>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardContent>
  </Card>
);

interface PaymentMethodsCRUDProps {
  tenantId: string;
}

export const PaymentMethodsCRUD: React.FC<PaymentMethodsCRUDProps> = ({ tenantId }) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CreditCard className="h-5 w-5" />
            Medios de Pago
          </CardTitle>
          <CardDescription className="pt-1">Gestiona los medios de pago aceptados en tu negocio.</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Agregar</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <div className="space-y-3">
            {isLoading 
              ? [...Array(3)].map((_, i) => <PaymentMethodCardSkeleton key={i} />)
              : paymentMethods.map((method) => (
                  <PaymentMethodCard key={method.id} method={method} handleEdit={handleEdit} handleDelete={handleDelete} />
                ))
            }
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{isLoading ? <PaymentMethodTableSkeleton /> : paymentMethods.map((method: PaymentMethod) => (<TableRow key={method.id}><TableCell>{method.name}</TableCell><TableCell>{method.is_active ? 'Sí' : 'No'}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEdit(method)}><Pencil className="mr-2 h-4 w-4" /><span>Editar</span></DropdownMenuItem><AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Eliminar</span></DropdownMenuItem></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el medio de pago.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(method.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
          </Table>
        )}
        <PaymentMethodDialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          paymentMethod={selectedPaymentMethod}
          tenantId={tenantId} 
        />
      </CardContent>
    </Card>
  );
};