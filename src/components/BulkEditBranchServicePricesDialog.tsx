import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useUpdateBranchService, BranchService } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useQueryClient } from "@tanstack/react-query";

interface BulkEditBranchServicePricesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  branchId: string;
  branchServices: BranchService[];
  onSuccess: () => void;
}

const BulkEditBranchServicePricesDialog: React.FC<BulkEditBranchServicePricesDialogProps> = ({
  isOpen,
  onOpenChange,
  branchId,
  branchServices,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();

  const { mutate: updateBranchService, isPending: isUpdating } = useUpdateBranchService();

  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [priceAdjustment, setPriceAdjustment] = useState<string>("");

  useEffect(() => {
    if (branchServices) {
      const initialPrices: Record<string, number> = {};
      branchServices.forEach(bs => {
        initialPrices[bs.branch_service_id] = bs.selling_price;
      });
      setEditedPrices(initialPrices);
    }
  }, [branchServices]);

  const handlePriceChange = (branchServiceId: string, value: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [branchServiceId]: parseFloat(value) || 0,
    }));
  };

  const handleAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceAdjustment(e.target.value);
  };

  const handleApplyAdjustment = () => {
    const adjustmentValue = parseFloat(priceAdjustment);
    if (isNaN(adjustmentValue)) {
      toast({ title: "Error", description: "Por favor, introduce un valor numérico válido para el ajuste.", variant: "destructive" });
      return;
    }

    const newEditedPrices = { ...editedPrices };
    branchServices.forEach(bs => {
      newEditedPrices[bs.branch_service_id] = bs.selling_price + adjustmentValue;
    });
    setEditedPrices(newEditedPrices);
    toast({ title: "Ajuste Aplicado", description: "El ajuste de precio se ha aplicado a todos los servicios.", variant: "success" });
  };

  const handleSave = () => {
    const mutations = branchServices.map(bs => {
      const newPrice = editedPrices[bs.branch_service_id];
      if (bs.selling_price !== newPrice) {
        return new Promise<void>((resolve, reject) => {
          updateBranchService({
            id: bs.branch_service_id,
            updates: { selling_price: newPrice },
          }, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      }
      return Promise.resolve();
    }).filter(Boolean);

    Promise.all(mutations)
      .then(() => {
        toast({ title: "Precios Actualizados", description: "Los precios de los servicios han sido guardados.", variant: "success" });
        queryClient.invalidateQueries({ queryKey: ['branch_services', branchId] });
        onSuccess();
        onOpenChange(false);
      })
      .catch((error) => {
        toast({ title: "Error al Guardar Precios", description: error.message, variant: "destructive" });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edición Masiva de Precios para Servicios en Sucursal</DialogTitle>
          <DialogDescription>
            Ajusta los precios de venta de todos los servicios en esta sucursal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="price-adjustment" className="whitespace-nowrap">Ajuste Global (+/-):</Label>
            <Input
              id="price-adjustment"
              type="number"
              value={priceAdjustment}
              onChange={handleAdjustmentChange}
              placeholder="Ej: 5.00 o -2.50"
              step="0.01"
              className="w-40"
            />
            <Button onClick={handleApplyAdjustment}>
              Aplicar Ajuste
            </Button>
          </div>

          {branchServices.length === 0 ? (
            <div className="text-center">No hay servicios para editar en esta sucursal.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Precio Actual</TableHead>
                  <TableHead>Nuevo Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchServices.map(bs => (
                  <TableRow key={bs.branch_service_id}>
                    <TableCell className="font-medium">{bs.name}</TableCell>
                    <TableCell>{formatPrice(bs.selling_price)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editedPrices[bs.branch_service_id] || ''}
                        onChange={(e) => handlePriceChange(bs.branch_service_id, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditBranchServicePricesDialog;
