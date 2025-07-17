import React, { useState, useMemo } from 'react';
import { useCountries, useUpdateCountry, useLocalizations, Country } from '@/hooks/useLocalization';
import { useCurrencies } from '@/hooks/useCurrencies';
import { usePhonePrefixes } from '@/hooks/usePhonePrefixes';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CountryDialog } from './CountryDialog';
import { useScreenSize } from '@/hooks/useScreenSize';

export function CountriesSettings() {
  const { data: countries, isLoading: isLoadingCountries } = useCountries();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();
  const { data: localizations, isLoading: isLoadingLocalizations } = useLocalizations();
  const { data: phonePrefixes, isLoading: isLoadingPrefixes } = usePhonePrefixes();
  
  const updateMutation = useUpdateCountry();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);
  const screenSize = useScreenSize();

  const isLoading = isLoadingCountries || isLoadingCurrencies || isLoadingLocalizations || isLoadingPrefixes;

  const countriesWithDetails = useMemo(() => {
    if (isLoading || !countries) return [];
    return countries.map(country => ({
      ...country,
      currencyName: currencies?.find(c => c.id === country.default_currency_id)?.name || 'N/A',
      localizationName: localizations?.find(l => l.id === country.default_localization_id)?.name || 'N/A',
      prefix: phonePrefixes?.find(p => p.id === country.phone_prefix_id)?.prefix || 'N/A',
    }));
  }, [countries, currencies, localizations, phonePrefixes, isLoading]);

  const handleEdit = (country: Country) => {
    setSelectedCountry(country);
    setIsDialogOpen(true);
  };

  const handleStatusChange = (country: any, newStatus: boolean) => {
    updateMutation.mutate({ id: country.id, is_active: newStatus });
  };

  if (isLoading) {
    return <div className="p-4 text-center">Cargando datos...</div>;
  }

  const renderCountryCard = (country: any) => (
    <Card key={country.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{country.name} ({country.iso_code})</CardTitle>
            <CardDescription>
              {country.currencyName} - {country.localizationName}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor={`status-switch-mobile-${country.id}`} className="text-sm font-medium">
              {country.is_active ? 'Activo' : 'Inactivo'}
            </Label>
            <Switch
              id={`status-switch-mobile-${country.id}`}
              checked={country.is_active}
              onCheckedChange={(newStatus) => handleStatusChange(country, newStatus)}
              disabled={updateMutation.isPending}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div><strong>Prefijo:</strong> {country.prefix}</div>
        <div><strong>Zona Horaria:</strong> {country.timezone || 'N/A'}</div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(country)}>
          Editar
        </Button>
      </CardFooter>
    </Card>
  );

  const renderCountryRow = (country: any) => (
    <TableRow key={country.id}>
      <TableCell>{country.name}</TableCell>
      <TableCell>{country.iso_code}</TableCell>
      <TableCell>
        <Switch
          id={`status-switch-desktop-${country.id}`}
          checked={country.is_active}
          onCheckedChange={(newStatus) => handleStatusChange(country, newStatus)}
          disabled={updateMutation.isPending}
          aria-label="Estado del país"
        />
      </TableCell>
      <TableCell>{country.prefix}</TableCell>
      <TableCell>{country.currencyName}</TableCell>
      <TableCell>{country.localizationName}</TableCell>
      <TableCell>{country.timezone || 'N/A'}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => handleEdit(country)}>
          Editar
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Gestión de Países</CardTitle>
            <CardDescription>Añade o edita los países y sus configuraciones por defecto.</CardDescription>
          </div>
          <Button onClick={() => { setSelectedCountry(undefined); setIsDialogOpen(true); }}>
            Añadir País
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {screenSize === 'mobile' ? (
          <div className="space-y-4">
            {countriesWithDetails.map(renderCountryCard)}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prefijo</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Localización</TableHead>
                  <TableHead>Zona Horaria</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countriesWithDetails.map(renderCountryRow)}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {isDialogOpen && (
        <CountryDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          country={selectedCountry}
        />
      )}
    </Card>
  );
}
