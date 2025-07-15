import React, { useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/useScreenSize';
import { LocalizationsSettings } from './LocalizationsSettings';
import { CurrenciesSettings } from './CurrenciesSettings';
import { CountriesSettings } from './CountriesSettings';
import { GlobalIntegrationsManager } from './GlobalIntegrationsManager';

import { useTenantById } from '@/hooks/useTenants';
import { MapDisplay } from '@/components/MapDisplay';

const GLOBAL_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export default function GlobalSettings() {
  const screenSize = useScreenSize();

  const { data: globalTenant, isLoading: isLoadingGlobalTenant, isError, error } = useTenantById(GLOBAL_TENANT_ID);

  if (isLoadingGlobalTenant) {
    return <div>Cargando configuración global...</div>;
  }
  if (isError) return <div className="w-full">Error al cargar los datos: {error.message}</div>;

  return (
    <div className="w-full py-4 md:p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold px-4 md:px-0">Configuración Global del Sistema</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className={`w-full ${screenSize === 'mobile' ? 'flex-nowrap overflow-x-auto justify-start' : ''}`}>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="localizations">Localizaciones</TabsTrigger>
          <TabsTrigger value="currencies">Monedas</TabsTrigger>
          <TabsTrigger value="countries">Países</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información de Glamtica</CardTitle>
              <CardDescription>Detalles de contacto y ubicación de la empresa.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <div className="font-semibold text-muted-foreground">Nombre Comercial</div>
                  <div>{globalTenant?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">País</div>
                  <div>{globalTenant?.countries?.name || 'N/A'}</div>
                </div>
                
                
                
                <div>
                  <div className="font-semibold text-muted-foreground">Teléfono de Contacto</div>
                  <div>{globalTenant?.contact_phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">WhatsApp</div>
                  <div>{globalTenant?.whatsapp_phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Email Comercial</div>
                  <div>{globalTenant?.commercial_email || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Razón Social / Nombre Legal</div>
                  <div>{globalTenant?.legal_name || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">ID Fiscal</div>
                  <div>{globalTenant?.tax_id || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Dirección de Facturación</div>
                  <div>{globalTenant?.billing_address || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Email para Facturación Electrónica</div>
                  <div>{globalTenant?.einvoicing_email || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Dirección Física Línea 1</div>
                  <div>{globalTenant?.physical_address_line1 || 'N/A'}</div>
                </div>
                
                <div>
                  <div className="font-semibold text-muted-foreground">Ciudad</div>
                  <div>{globalTenant?.physical_city || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Estado / Provincia</div>
                  <div>{globalTenant?.physical_state || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Código Postal</div>
                  <div>{globalTenant?.physical_postal_code || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Sitio Web</div>
                  <div>{globalTenant?.website || 'N/A'}</div>
                </div>
              </div>
              {globalTenant?.latitude && globalTenant?.longitude && (
                <div className="w-full h-[400px] rounded-lg overflow-hidden mt-6">
                  <MapDisplay latitude={globalTenant.latitude} longitude={globalTenant.longitude} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localizations">
          <LocalizationsSettings />
        </TabsContent>

        <TabsContent value="currencies">
          <CurrenciesSettings />
        </TabsContent>

        <TabsContent value="countries">
          <CountriesSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <GlobalIntegrationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
