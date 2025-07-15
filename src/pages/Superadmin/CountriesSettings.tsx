import React, { useState } from 'react';
import { useCountries, Country } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CountryDialog } from './CountryDialog';
import { useScreenSize } from '@/hooks/useScreenSize';

export function CountriesSettings() {
  const { data: countries, isLoading } = useCountries();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);
  const screenSize = useScreenSize();

  const handleEdit = (country: Country) => {
    setSelectedCountry(country);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Cargando países...</div>;
  }

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
            {countries?.map((country) => (
              <Card key={country.id}>
                <CardHeader>
                  <CardTitle>{country.name} ({country.iso_code})</CardTitle>
                  <CardDescription>
                    {country.currencies?.name || 'N/A'} - {country.languages?.name || 'N/A'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div><strong>Prefijo:</strong> {country.phone_prefixes?.prefix || 'N/A'}</div>
                  <div><strong>Zona Horaria:</strong> {country.timezone || 'N/A'}</div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(country)}>
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
                  <TableHead>Prefijo</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Localización</TableHead>
                  <TableHead>Zona Horaria</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries?.map((country) => (
                  <TableRow key={country.id}>
                    <TableCell>{country.name}</TableCell>
                    <TableCell>{country.iso_code}</TableCell>
                    <TableCell>{country.phone_prefixes?.prefix || 'N/A'}</TableCell>
                    <TableCell>{country.currencies?.name || 'N/A'}</TableCell>
                    <TableCell>{country.languages?.name || 'N/A'}</TableCell>
                    <TableCell>{country.timezone || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(country)}>
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
        <CountryDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          country={selectedCountry}
        />
      )}
    </Card>
  );
}
