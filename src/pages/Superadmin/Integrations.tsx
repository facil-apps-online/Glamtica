import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit } from 'lucide-react';
import { useIntegrationProviders, IntegrationProvider } from '@/hooks/useIntegrationProviders';
import { useCountries, Country } from '@/hooks/useCountries';
import { useIntegrationCategories, IntegrationCategory } from '@/hooks/useIntegrationCategories';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/useScreenSize';

// --- Helper Functions ---
const getCategoryName = (categories: IntegrationCategory[], categoryId: string) => {
  const category = categories.find(c => c.id === categoryId);
  return category ? category.name : 'N/A';
};

// --- Mobile View Components ---

const IntegrationCard = ({ provider, country, categories }) => {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <img src={provider.logo_url} alt={provider.name} className="h-10 w-10 object-contain" />
          {provider.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Categoría</span>
          <Badge variant="outline">{getCategoryName(categories, provider.category_id)}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estado</span>
          <Badge variant={provider.status === 'active' ? 'default' : 'destructive'}>
            {provider.status === 'active' ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => navigate(`/superadmin/integrations/edit/${provider.id}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
};

const IntegrationsMobileView = ({ countriesWithProviders, providersByCountry, categories }) => (
  <div className="space-y-6">
    {countriesWithProviders.map(country => (
      <div key={country.id}>
        <div className="flex items-center gap-2 mb-3">
          {country.iso_code && <img src={`https://flagcdn.com/w20/${country.iso_code.toLowerCase()}.png`} alt={`Bandera de ${country.name}`} className="w-5 h-auto rounded-sm" />}
          <h2 className="text-xl font-semibold">{country.name}</h2>
        </div>
        <div className="space-y-4">
          {providersByCountry[country.id].map(provider => (
            <IntegrationCard key={provider.id} provider={provider} country={country} categories={categories} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// --- Desktop View Components ---

const IntegrationsTable = ({ providers, categories }) => {
  const navigate = useNavigate();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Proveedor</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map((provider: IntegrationProvider) => (
          <TableRow key={provider.id}>
            <TableCell className="font-medium flex items-center gap-3">
              <img src={provider.logo_url} alt={provider.name} className="h-8 w-8 object-contain" />
              {provider.name}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{getCategoryName(categories, provider.category_id)}</Badge>
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
        ))}
      </TableBody>
    </Table>
  );
};

const IntegrationsDesktopView = ({ countriesWithProviders, providersByCountry, categories }) => (
  <Accordion type="multiple" className="w-full space-y-2">
    {countriesWithProviders.map(country => (
      <AccordionItem value={country.id} key={country.id} className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline">
          <div className="flex items-center gap-3">
            {country.iso_code ? (
              <img src={`https://flagcdn.com/w20/${country.iso_code.toLowerCase()}.png`} alt={`Bandera de ${country.name}`} className="w-5 h-auto rounded-sm" />
            ) : (
              <span className="w-5 h-3 bg-gray-200 rounded-sm"></span>
            )}
            {country.name}
            <Badge variant="secondary">{providersByCountry[country.id].length}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-1">
          <IntegrationsTable providers={providersByCountry[country.id]} categories={categories || []} />
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

// --- Main Page Component ---

export default function IntegrationsPage() {
  const { data: providers, isLoading: isLoadingProviders, error: errorProviders } = useIntegrationProviders();
  const { data: countries, isLoading: isLoadingCountries, error: errorCountries } = useCountries();
  const { data: categories, isLoading: isLoadingCategories, error: errorCategories } = useIntegrationCategories();
  const navigate = useNavigate();
  const screenSize = useScreenSize();

  const isLoading = isLoadingProviders || isLoadingCountries || isLoadingCategories;
  const error = errorProviders || errorCountries || errorCategories;

  const providersByCountry = useMemo(() => {
    if (!providers) return {};
    return providers.reduce((acc, provider) => {
      const countryId = provider.country_id;
      if (!acc[countryId]) {
        acc[countryId] = [];
      }
      acc[countryId].push(provider);
      return acc;
    }, {} as Record<string, IntegrationProvider[]>);
  }, [providers]);

  const countriesWithProviders = useMemo(() => {
    if (!countries) return [];
    return countries
      .filter(country => providersByCountry[country.id]?.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, providersByCountry]);

  const viewProps = {
    countriesWithProviders,
    providersByCountry,
    categories: categories || [],
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
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

      <div>
        {isLoading && <p>Cargando...</p>}
        {error && <p className="text-red-500">Error al cargar los datos: {error.message}</p>}
        {!isLoading && !error && (
          countriesWithProviders.length > 0 ? (
            screenSize === 'mobile' ? (
              <IntegrationsMobileView {...viewProps} />
            ) : (
              <IntegrationsDesktopView {...viewProps} />
            )
          ) : (
            <div className="text-center py-10 border rounded-lg">
              <p>No hay proveedores de integración definidos.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
