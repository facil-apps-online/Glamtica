import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combo, useGetComboBranchDetails, useUpdateComboBranchPrices, PriceOverride } from "@/hooks/useCombos";
import { Branch } from "@/hooks/useBranches";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComboBranchPriceDialogProps {
  combo: Combo | null;
  branch: Branch | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ComboBranchPriceDialog = ({ combo, branch, isOpen, onOpenChange }: ComboBranchPriceDialogProps) => {
  const { formatPrice } = usePriceFormat();
  const { data: details, isLoading } = useGetComboBranchDetails(combo?.id || "", branch?.id || "");
  const { mutate: updatePrices, isPending } = useUpdateComboBranchPrices();
  const screenSize = useScreenSize();
  const isSmallScreen = screenSize === 'sm' || screenSize === 'md';

  const [priceOverrides, setPriceOverrides] = useState<Record<string, number | string>>({});

  useEffect(() => {
    if (details?.items) {
      const initialOverrides: Record<string, number> = {};
      details.items.forEach(item => {
        const itemId = item.product_id || item.service_id;
        if (itemId) {
          initialOverrides[itemId] = item.final_price;
        }
      });
      setPriceOverrides(initialOverrides);
    }
  }, [details]);

  const handlePriceChange = (itemId: string, newPrice: string) => {
    setPriceOverrides(prev => ({ ...prev, [itemId]: newPrice }));
  };

  const handleSubmit = () => {
    if (!combo || !branch) return;

    const payload: PriceOverride[] = Object.entries(priceOverrides).map(([key, value]) => {
        const item = details?.items.find(i => (i.product_id || i.service_id) === key);
        return {
            product_id: item?.product_id,
            service_id: item?.service_id,
            price: Number(value)
        }
    });

    updatePrices({ combo_id: combo.id, branch_id: branch.id, price_overrides: payload }, {
        onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Precios de "{combo?.name}"</DialogTitle>
          <DialogDescription>Sucursal: {branch?.name}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <p>Cargando detalles...</p>
          ) : !isSmallScreen ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ítem</TableHead>
                  <TableHead>Precio Base</TableHead>
                  <TableHead>Precio en Sucursal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details?.items.map(item => {
                  const itemId = item.product_id || item.service_id;
                  if (!itemId) return null;

                  return (
                    <TableRow key={itemId}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{formatPrice(item.base_price)}</TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          value={priceOverrides[itemId] ?? ''}
                          onChange={(e) => handlePriceChange(itemId, e.target.value)}
                          placeholder="Precio..."
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-4">
              {details?.items.map(item => {
                const itemId = item.product_id || item.service_id;
                if (!itemId) return null;

                return (
                  <Card key={itemId}>
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Precio Base</Label>
                        <span>{formatPrice(item.base_price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`price-${itemId}`}>Precio en Sucursal</Label>
                        <Input 
                          id={`price-${itemId}`}
                          type="number"
                          value={priceOverrides[itemId] ?? ''}
                          onChange={(e) => handlePriceChange(itemId, e.target.value)}
                          placeholder="Precio..."
                          className="w-32"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "Guardando..." : "Guardar Precios"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
