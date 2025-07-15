
import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/useScreenSize';
import { format, parseISO, startOfToday } from 'date-fns';

export function ScheduledPrices({ isLoading, history }) {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';
  const today = startOfToday();

  const futurePrices = useMemo(() => {
    if (!history) return [];
    return history.filter(item => parseISO(item.effective_date) > today);
  }, [history]);

  return (
    <Card>
      <CardHeader><CardTitle>Precios Programados a Futuro</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          futurePrices.length > 0 ? (
            isMobile ? (
              <div className="space-y-4">
                {futurePrices.map(item => (
                  <Card key={item.id} className="bg-slate-50">
                    <CardHeader className="p-4"><CardTitle className="text-base">{item.subscription_plans.name}</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-sm space-y-1">
                      <p><strong>Vigente desde:</strong> {format(parseISO(item.effective_date), 'dd MMM yyyy')}</p>
                      <p><strong>Nuevo Precio Base:</strong> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.base_price_cop)}</p>
                      <p><strong>Nuevo Precio Sucursal:</strong> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.extra_branch_price_cop)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Vigencia</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Nuevo Precio Base (COP)</TableHead>
                    <TableHead>Nuevo Precio Sucursal Extra (COP)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {futurePrices.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{format(parseISO(item.effective_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{item.subscription_plans.name}</TableCell>
                      <TableCell>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.base_price_cop)}</TableCell>
                      <TableCell>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.extra_branch_price_cop)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <p className="text-sm text-muted-foreground">No hay precios programados a futuro.</p>
          )
        )}
      </CardContent>
    </Card>
  );
};
