import React, { useState } from 'react';
import { useCurrencies, useUpdateCurrency, Currency } from '@/hooks/useCurrencies';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CurrencyDialog } from './CurrencyDialog';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScreenSize } from '@/hooks/useScreenSize';

// Función de utilidad para formatear el número de ejemplo
const formatCurrencyExample = (currency: Currency) => {
  const number = 1234.56;
  const [integerPart, decimalPart] = number.toFixed(currency.decimal_places).split('.');

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousands_separator);

  const formattedNumber = currency.decimal_places > 0
    ? `${formattedInteger}${currency.decimal_separator}${decimalPart}`
    : formattedInteger;

  return currency.symbol_position === 'before'
    ? `${currency.symbol}${formattedNumber}`
    : `${formattedNumber}${currency.symbol}`;
};

export function CurrenciesSettings() {
  const { data: currencies, isLoading } = useCurrencies();
  const updateMutation = useUpdateCurrency();
  const screenSize = useScreenSize();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | undefined>(undefined);

  const handleEdit = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsDialogOpen(true);
  };

  const handleToggleActive = (currency: Currency) => {
    updateMutation.mutate({ id: currency.id, is_active: !currency.is_active });
  };

  if (isLoading) {
    return <div className="p-4 text-center">Cargando monedas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Gestión de Monedas</CardTitle>
            <CardDescription>Añade, edita y gestiona las monedas del sistema.</CardDescription>
          </div>
          <Button onClick={() => { setSelectedCurrency(undefined); setIsDialogOpen(true); }}>
            Añadir Moneda
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {screenSize === 'mobile' ? (
          <div className="space-y-4">
            {currencies?.map((currency) => (
              <Card key={currency.id}>
                <CardHeader>
                  <CardTitle>{currency.name} ({currency.code})</CardTitle>
                  <CardDescription>Símbolo: {currency.symbol}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {formatCurrencyExample(currency)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={currency.is_active}
                      onCheckedChange={() => handleToggleActive(currency)}
                    />
                    <span className={currency.is_active ? 'text-green-600' : 'text-red-600'}>
                      {currency.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(currency)}>
                    Editar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Símbolo</TableHead>
                  <TableHead>Formato de Ejemplo</TableHead>
                  <TableHead>Activa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies?.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.code}</TableCell>
                    <TableCell>{currency.symbol}</TableCell>
                    <TableCell>
                      {formatCurrencyExample(currency)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={currency.is_active}
                        onCheckedChange={() => handleToggleActive(currency)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(currency)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {isDialogOpen && (
        <CurrencyDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          currency={selectedCurrency}
        />
      )}
    </Card>
  );
}
