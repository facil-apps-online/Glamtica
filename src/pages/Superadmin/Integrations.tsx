import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { useIntegrationProviders, IntegrationProvider } from '@/hooks/useIntegrationProviders';
import { useCountries, Country } from '@/hooks/useCountries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';

// Corregido: busca por ID en lugar de ISO code
const getCountryById = (countries: Country[], id: string) => {
  return countries.find(c => c.id === id);
};

const IntegrationsTable = ({ providers, countries }) => {
  const navigate = useNavigate();

  if (!providers || providers.length === 0) {
    return (
      <div className="text-center py-10">
        <p>No hay proveedores de integración definidos.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider: IntegrationProvider) => {
              // Corregido: usa el nuevo ID y la nueva función
              const country = getCountryById(countries, provider.country_id);
              return (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <img src={provider.logoUrl} alt={provider.name} className="h-8 w-8 object-contain" />
                    {provider.name}
                  </TableCell>
                  <TableCell>
                    {country ? country.name : 'País no encontrado'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {provider.category === 'invoicing' ? 'Facturación' : 'Pagos'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={provider.status === 'active' ? 'default' : 'destructive'}>
                      {provider.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/superadmin/integrations/edit/${provider.id}`)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default function IntegrationsPage() {
  const { data: providers, isLoading: isLoadingProviders, error: errorProviders } = useIntegrationProviders();
  const { data: countries, isLoading: isLoadingCountries, error: errorCountries } = useCountries();
  const navigate = useNavigate();

  const isLoading = isLoadingProviders || isLoadingCountries;
  const error = errorProviders || errorCountries;

  return (
    <div className="w-full py-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between px-4 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestor de Integraciones</h1>
          <p className="text-muted-foreground mt-2">
            Añade y configura proveedores de facturación y pagos para cada país.
          </p>
        </div>
        <Button onClick={() => navigate('/superadmin/integrations/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Proveedor
        </Button>
      </div>

      <div className="px-4 md:px-0">
        {isLoading && <p>Cargando...</p>}
        {error && <p className="text-red-500">Error al cargar los datos: {error.message}</p>}
        {!isLoading && !error && (
          <IntegrationsTable providers={providers || []} countries={countries || []} />
        )}
      </div>
    </div>
  );
}
