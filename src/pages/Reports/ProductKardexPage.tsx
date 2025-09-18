import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { BranchSelector } from '@/components/BranchSelector';
import { FilterableSelect } from '@/components/FilterableSelect'; // Assuming a generic component to search/select products
import { useProductKardex, ProductMovement } from '@/hooks/useProductKardex';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMasterProducts } from '@/hooks/useMasterProducts'; // Assuming a hook to get all products for the select

const ProductKardexPage = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { formatPrice } = usePriceFormat();

  // Assuming a hook to fetch products for the selector
  const { data: products = [] } = useMasterProducts('', true); // Fetch all products
  const productOptions = products.map(p => ({ value: p.id, label: p.name }));

  const { data: kardexData = [], isLoading, error } = useProductKardex(selectedBranchId, selectedProductId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kardex de Producto"
        subtitle="Consulta el historial de movimientos de un producto específico."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros del Informe</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <BranchSelector
              selectedBranchId={selectedBranchId || ''}
              onBranchChange={setSelectedBranchId}
            />
          </div>
          <div className="w-full md:w-1/3">
            <FilterableSelect
              options={productOptions}
              value={selectedProductId}
              onChange={setSelectedProductId}
              placeholder="Selecciona un producto..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Cargando...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Stock Resultante</TableHead>
                  <TableHead className="text-right">Costo del Movimiento</TableHead>
                  <TableHead className="text-right">Costo Promedio Resultante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kardexData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Selecciona una sucursal y un producto para ver su kardex.
                    </TableCell>
                  </TableRow>
                ) : (
                  kardexData.map((item: ProductMovement) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.movement_date), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                      <TableCell>{item.movement_type}</TableCell>
                      <TableCell>{item.reference_type} - {item.reference_id?.substring(0, 8)}</TableCell>
                      <TableCell className={`text-right font-medium ${item.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.quantity_change}
                      </TableCell>
                      <TableCell className="text-right">{item.stock_after_movement}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.cost_of_change)}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.cost_after_movement)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductKardexPage;
