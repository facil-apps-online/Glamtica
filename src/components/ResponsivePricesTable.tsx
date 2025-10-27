
import React from 'react';
import { useScreenSize } from '@/hooks/useScreenSize';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Define the props for the component based on what ProductPricesManager will pass
interface BranchPriceData {
  itemId: string;
  branch_name: string;
  selling_price: number;
  stock_quantity?: number; // Make stock optional
  is_active: boolean;
}

interface ResponsivePricesTableProps {
  branchPrices: BranchPriceData[];
  editedPrices: Record<string, number>;
  selectedItemIds: string[]; // Rename for clarity
  onPriceChange: (itemId: string, value: string) => void;
  onSelectItem: (itemId: string, isChecked: boolean) => void; // Rename for clarity
  formatPrice: (price: number) => string;
  itemType?: 'product' | 'service'; // To handle subtle differences if needed
}

export const ResponsivePricesTable: React.FC<ResponsivePricesTableProps> = ({
  branchPrices,
  editedPrices,
  selectedItemIds,
  onPriceChange,
  onSelectItem,
  formatPrice,
  itemType = 'product',
}) => {
  const screenSize = useScreenSize();
  const isSmallScreen = screenSize === 'sm' || screenSize === 'md';

  const hasStock = branchPrices.some(p => p.stock_quantity !== undefined && p.stock_quantity !== null);

  if (!isSmallScreen) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Seleccionar</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Precio Actual</TableHead>
            <TableHead>Nuevo Precio</TableHead>
            {hasStock && <TableHead>Stock</TableHead>}
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branchPrices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={hasStock ? 6 : 5} className="text-center text-muted-foreground">
                Este {itemType === 'product' ? 'producto' : 'servicio'} no está asignado a ninguna sucursal.
              </TableCell>
            </TableRow>
          ) : (
            branchPrices.map(bp => (
              <TableRow key={bp.itemId}>
                <TableCell>
                  <Checkbox
                    checked={selectedItemIds.includes(bp.itemId)}
                    onCheckedChange={checked => onSelectItem(bp.itemId, !!checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">{bp.branch_name}</TableCell>
                <TableCell>{formatPrice(bp.selling_price)}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={editedPrices[bp.itemId] || ''}
                    onChange={e => onPriceChange(bp.itemId, e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </TableCell>
                {hasStock && <TableCell>{bp.stock_quantity}</TableCell>}
                <TableCell>{bp.is_active ? 'Activo' : 'Inactivo'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  // Mobile view
  return (
    <div className="space-y-4">
      {branchPrices.length === 0 ? (
        <p className="text-center text-muted-foreground">
          Este {itemType === 'product' ? 'producto' : 'servicio'} no está asignado a ninguna sucursal.
        </p>
      ) : (
        branchPrices.map(bp => (
          <Card key={bp.itemId}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">{bp.branch_name}</CardTitle>
              <Checkbox
                checked={selectedItemIds.includes(bp.itemId)}
                onCheckedChange={checked => onSelectItem(bp.itemId, !!checked)}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio Actual:</span>
                  <span>{formatPrice(bp.selling_price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`price-${bp.itemId}`} className="text-muted-foreground">Nuevo Precio:</Label>
                  <Input
                    id={`price-${bp.itemId}`}
                    type="number"
                    value={editedPrices[bp.itemId] || ''}
                    onChange={e => onPriceChange(bp.itemId, e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-32"
                  />
                </div>
                {hasStock && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span>{bp.stock_quantity}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className={bp.is_active ? 'text-green-600' : 'text-red-600'}>
                    {bp.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
