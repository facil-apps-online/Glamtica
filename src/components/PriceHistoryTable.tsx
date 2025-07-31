import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PriceHistory {
  id: string;
  effective_date: string;
  base_price_cop: number;
  extra_branch_price_cop: number;
}

interface PriceHistoryTableProps {
  history: PriceHistory[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

export function PriceHistoryTable({ history, isLoading }: PriceHistoryTableProps) {
  if (isLoading) {
    return <div>Cargando historial...</div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Historial de Precios</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha de Vigencia</TableHead>
              <TableHead>Precio Base</TableHead>
              <TableHead>Precio Sucursal Extra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length > 0 ? (
              history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {format(parseISO(item.effective_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>{formatCurrency(item.base_price_cop)}</TableCell>
                  <TableCell>{formatCurrency(item.extra_branch_price_cop)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No hay historial de precios para este plan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
