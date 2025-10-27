import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, MoreHorizontal } from "lucide-react";
import { usePurchases } from "@/hooks/usePurchases";
import { useCancelPurchase } from "@/hooks/useCancelPurchase";
import { useUpdatePurchasePaymentStatus } from "@/hooks/useUpdatePurchasePaymentStatus";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { ReceivePurchaseDialog } from "@/components/ReceivePurchaseDialog";
import { ViewPurchaseReceptionDetailsDialog } from "@/components/ViewPurchaseReceptionDetailsDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { PageHeader } from "@/components/PageHeader";
import { useScreenSize } from "@/hooks/useScreenSize";
import { PurchaseCard } from "@/components/PurchaseCard";

export function PurchasesPage() {
  const navigate = useNavigate();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { data: purchases, isLoading, error } = usePurchases(tenantId);
  const { formatPrice } = usePriceFormat();
  const cancelPurchaseMutation = useCancelPurchase();
  const updatePaymentStatusMutation = useUpdatePurchasePaymentStatus();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const handleReceiveClick = (purchase: any) => {
    if (purchase.status === 'draft') {
      setSelectedPurchase(purchase);
      setIsReceiveDialogOpen(true);
    } else if (['completed', 'completada_con_incidencias'].includes(purchase.status)) {
      setSelectedPurchase(purchase);
      setIsViewDetailsDialogOpen(true);
    }
  };

  const handleCancelClick = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedPurchase) return;
    cancelPurchaseMutation.mutate({ purchase_id: selectedPurchase.id }, {
      onSuccess: () => {
        setIsCancelDialogOpen(false);
        setSelectedPurchase(null);
      }
    });
  };

  if (isLoading) return <div className="text-center p-8">Cargando compras...</div>;
  if (error) return <div className="text-red-500 text-center p-8">Error al cargar compras: {error.message}</div>;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'completada_con_incidencias': return 'yellow';
      case 'cancelled': return 'destructive';
      case 'draft': return 'secondary';
      default: return 'secondary';
    }
  }

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'pagado': return 'success';
      case 'no_pagado': return 'destructive';
      default: return 'secondary';
    }
  }

  return (
    <>
      <div className="space-y-4">
        <PageHeader 
          title="Gestión de Compras"
          subtitle="Crea, gestiona y registra las compras de tus proveedores."
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate('/app/inventory')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        >
          <PurchaseDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Nueva Compra</span>
                </Button>
              }
            />
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Compras</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {isMobile ? (
              <div className="space-y-4 p-4">
                {purchases && purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <PurchaseCard
                      key={purchase.id}
                      purchase={purchase}
                      formatPrice={formatPrice}
                      onReceiveClick={handleReceiveClick}
                      onCancelClick={handleCancelClick}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay compras registradas.
                  </div>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado Compra</TableHead>
                    <TableHead>Estado Pago</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases && purchases.length > 0 ? (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.supplier?.name || "N/A"}</TableCell>
                        <TableCell>{purchase.branch?.name || "N/A"}</TableCell>
                        <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(purchase.status)}>
                            {purchase.status === 'draft' ? 'Borrador' :
                             purchase.status === 'completed' ? 'Finalizada' :
                             purchase.status === 'completada_con_incidencias' ? 'Finalizada con Incidencias' :
                             purchase.status === 'cancelled' ? 'Cancelada' :
                             purchase.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusVariant(purchase.payment_status)}>
                            {purchase.payment_status === 'pagado' ? 'Pagado' : 'No Pagado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(purchase.total_amount)}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleReceiveClick(purchase)}
                                disabled={purchase.status !== 'draft' && !['completed', 'completada_con_incidencias'].includes(purchase.status)}
                              >
                                {purchase.status === 'draft' ? 'Ver/Recibir' : 'Ver Detalles Recepción'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCancelClick(purchase)}
                                disabled={purchase.status !== 'draft'}
                              >
                                Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay compras registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {selectedPurchase && (
          <ReceivePurchaseDialog
            isOpen={isReceiveDialogOpen}
            onOpenChange={setIsReceiveDialogOpen}
            purchase={selectedPurchase}
          />
        )}
        {selectedPurchase && (
          <ViewPurchaseReceptionDetailsDialog
            isOpen={isViewDetailsDialogOpen}
            onOpenChange={setIsViewDetailsDialogOpen}
            purchase={selectedPurchase}
          />
        )}
      </div>
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La compra será marcada como cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>Confirmar Cancelación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}