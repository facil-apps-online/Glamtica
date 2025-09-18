import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { BranchSelector } from '@/components/BranchSelector';
import { DatePickerButtonInput } from '@/components/DatePickerButtonInput';
import { useStockByDate, StockSnapshot } from '@/hooks/useStockByDate';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const StockReportPage = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<Date | null>(new Date());
  const { formatPrice } = usePriceFormat();

  const { data: stockData = [], isLoading, error } = useStockByDate(selectedBranchId, reportDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informe de Stock a Fecha"
        subtitle="Consulta el stock y costo de tus productos en una fecha determinada."
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
            <DatePickerButtonInput
              value={reportDate || undefined}
              onChange={(date) => setReportDate(date || null)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Cargando...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stock a la Fecha</TableHead>
                  <TableHead className="text-right">Costo Promedio a la Fecha</TableHead>
                  <TableHead>Último Movimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Selecciona una sucursal y una fecha para ver los resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  stockData.map((item: StockSnapshot) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>{item.product_sku}</TableCell>
                      <TableCell className="text-right">{item.stock_at_date}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.cost_at_date)}</TableCell>
                      <TableCell>{format(new Date(item.last_movement_date), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
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

export default StockReportPage;
