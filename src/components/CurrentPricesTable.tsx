
import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/useScreenSize';
import { usePriceFormat } from '@/hooks/usePriceFormat'; // Importar el hook

export function CurrentPricesTable({ plans, calculatedPrices, isLoading }) {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const { formatPrice } = usePriceFormat(); // Usar el hook
  const { countries, pricesByCountry } = useMemo(() => {
    if (!calculatedPrices || !plans) return { countries: [], pricesByCountry: {} };
    const uniqueCountries = [...new Map(calculatedPrices.map(p => [p.country_id, { id: p.country_id, name: p.country_name }])).values()];
    const groupedByCountry = uniqueCountries.reduce((acc, country) => {
      acc[country.id] = plans
        .sort((a, b) => a.display_order - b.display_order)
        .map(plan => calculatedPrices.find(p => p.country_id === country.id && p.plan_id === plan.id) || null);
      return acc;
    }, {} as Record<string, (typeof calculatedPrices[0] | null)[]>);
    return { countries: uniqueCountries, pricesByCountry: groupedByCountry };
  }, [calculatedPrices, plans]);

  return (
    <Card>
      <CardHeader><CardTitle>Precios Vigentes y Calculados</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          isMobile ? (
            <div className="space-y-4">
              {countries.map(country => (
                <Card key={country.id} className="bg-slate-50">
                  <CardHeader className="p-4"><CardTitle className="text-base">{country.name}</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="space-y-2">
                      {pricesByCountry[country.id]?.map((priceInfo, index) => (
                        priceInfo && (
                          <li key={index} className="flex justify-between items-baseline text-sm">
                            <span className="font-medium">{priceInfo.plan_name}:</span>
                            <div className="text-right">
                              <p>{formatPrice(priceInfo.calculated_price)}</p>
                              <p className="text-xs text-muted-foreground">+ Sucursal: {formatPrice(priceInfo.calculated_extra_branch_price)}</p>
                            </div>
                          </li>
                        )
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">País</TableHead>
                    {plans?.map(plan => <TableHead key={plan.id} className="text-center">{plan.name}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countries.map(country => (
                    <TableRow key={country.id}>
                      <TableCell className="font-medium">{country.name}</TableCell>
                      {pricesByCountry[country.id]?.map((priceInfo, index) => (
                        <TableCell key={index} className="text-center">
                          {priceInfo ? (
                            <div>
                              <p>{formatPrice(priceInfo.calculated_price)}</p>
                              <p className="text-xs text-muted-foreground">+ Sucursal: {formatPrice(priceInfo.calculated_extra_branch_price)}</p>
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
