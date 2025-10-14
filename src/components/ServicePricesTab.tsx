
import React, { useState, useEffect } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { useServiceBranchPrices, useUpdateBranchService, MasterService } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useQueryClient } from "@tanstack/react-query";

interface ServicePricesTabProps {
  service: MasterService;
}

export const ServicePricesTab: React.FC<ServicePricesTabProps> = ({ service }) => {
  const { toast } = useToast();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();

  const { data: branchPrices, isLoading, refetch } = useServiceBranchPrices(service.id);
  const { mutate: updateBranchService, isPending: isUpdating } = useUpdateBranchService();

  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [uniformPrice, setUniformPrice] = useState<string>("");
  const [selectedBranchServiceIds, setSelectedBranchServiceIds] = useState<string[]>([]);

  useEffect(() => {
    if (branchPrices) {
      const initialPrices: Record<string, number> = {};
      branchPrices.forEach(bp => {
        initialPrices[bp.branch_service_id] = bp.selling_price;
      });
      setEditedPrices(initialPrices);
      // Reset selection when data reloads
      setSelectedBranchServiceIds([]);
    }
  }, [branchPrices]);

  const handlePriceChange = (branchServiceId: string, value: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [branchServiceId]: parseFloat(value) || 0,
    }));
  };

  const handleUniformPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUniformPrice(e.target.value);
  };

  const handleApplyUniformPrice = () => {
    const price = parseFloat(uniformPrice);
    if (isNaN(price)) {
      toast({ title: "Error", description: "Por favor, introduce un precio válido.", variant: "destructive" });
      return;
    }

    const newEditedPrices = { ...editedPrices };
    selectedBranchServiceIds.forEach(id => {
      newEditedPrices[id] = price;
    });
    setEditedPrices(newEditedPrices);
    toast({ title: "Precio Unificado Aplicado", description: "El precio se ha aplicado a los servicios seleccionados.", variant: "success" });
  };

  const handleSelectBranchService = (branchServiceId: string, isChecked: boolean) => {
    setSelectedBranchServiceIds(prev => 
      isChecked ? [...prev, branchServiceId] : prev.filter(id => id !== branchServiceId)
    );
  };

  const handleSave = () => {
    const mutations = Object.keys(editedPrices).map(branchServiceId => {
      const originalPrice = branchPrices?.find(bp => bp.branch_service_id === branchServiceId)?.selling_price;
      const newPrice = editedPrices[branchServiceId];
      if (originalPrice !== newPrice) {
        return new Promise<void>((resolve, reject) => {
          updateBranchService({
            id: branchServiceId,
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
        queryClient.invalidateQueries({ queryKey: ['branch_services'] });
        refetch(); // Refetch the prices for this service
      })
      .catch((error) => {
        toast({ title: "Error al Guardar Precios", description: error.message, variant: "destructive" });
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Label htmlFor="uniform-price" className="whitespace-nowrap">Precio Unificado:</Label>
        <Input
          id="uniform-price"
          type="number"
          value={uniformPrice}
          onChange={handleUniformPriceChange}
          placeholder="Ej: 19.99"
          min="0"
          step="0.01"
          className="w-40"
        />
        <Button onClick={handleApplyUniformPrice} disabled={selectedBranchServiceIds.length === 0 || isNaN(parseFloat(uniformPrice))}>
          Aplicar a Seleccionados
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center">Cargando precios por sucursal...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Seleccionar</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Precio Actual</TableHead>
              <TableHead>Nuevo Precio</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchPrices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Este servicio no está asignado a ninguna sucursal.
                </TableCell>
              </TableRow>
            ) : (
              branchPrices?.map(bp => (
                <TableRow key={bp.branch_service_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedBranchServiceIds.includes(bp.branch_service_id)}
                      onCheckedChange={(checked) => handleSelectBranchService(bp.branch_service_id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{bp.branch_name}</TableCell>
                  <TableCell>{formatPrice(bp.selling_price)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editedPrices[bp.branch_service_id] ?? ''}
                      onChange={(e) => handlePriceChange(bp.branch_service_id, e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>{bp.is_active ? "Activo" : "Inactivo"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
};
