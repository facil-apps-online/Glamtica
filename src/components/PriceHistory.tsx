
import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/useScreenSize';
import { format, subDays, parseISO, startOfToday } from 'date-fns';
import { usePriceFormat } from '@/hooks/usePriceFormat'; // Importar el hook

export function PriceHistory({ isLoading, history }) {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const today = startOfToday();
  const { formatPrice } = usePriceFormat(); // Usar el hook

  const previousPrices = useMemo(() => {
    if (!history) return [];
    const priceMap = new Map();
    history
      .filter(item => parseISO(item.effective_date) < today)
      .forEach(item => {
        if (!priceMap.has(item.subscription_plan_id) || parseISO(item.effective_date) > parseISO(priceMap.get(item.subscription_plan_id).effective_date)) {
          priceMap.set(item.subscription_plan_id, item);
        }
      });
    return Array.from(priceMap.values());
  }, [history]);

  return (
    <Card>
      <CardHeader><CardTitle>Último Precio Anterior</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          isMobile ? (
            <div className="space-y-4">
              {previousPrices.map(item => (
                <Card key={item.id} className="bg-slate-50">
                  <CardHeader className="p-4"><CardTitle className="text-base">{item.subscription_plans.name}</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 text-sm space-y-1">
                    <p><strong>Vigente hasta:</strong> {format(subDays(parseISO(item.effective_date), 1), 'dd MMM yyyy')}</p>
                    <p><strong>Precio Base:</strong> {formatPrice(item.base_price_cop)}</p>
                    <p><strong>Precio Sucursal:</strong> {formatPrice(item.extra_branch_price_cop)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio Base (COP)</TableHead>
                  <TableHead>Precio Sucursal Extra (COP)</TableHead>
                  <TableHead>Vigente Hasta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previousPrices.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.subscription_plans.name}</TableCell>
                    <TableCell>{formatPrice(item.base_price_cop)}</TableCell>
                    <TableCell>{formatPrice(item.extra_branch_price_cop)}</TableCell>
                    <TableCell>{format(subDays(parseISO(item.effective_date), 1), 'dd MMM yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </CardContent>
    </Card>
  );
};
