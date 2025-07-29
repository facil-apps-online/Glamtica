import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CountriesSettings } from './CountriesSettings';
import { CurrenciesSettings } from './CurrenciesSettings';
import { LocalizationsSettings } from './LocalizationsSettings';

export default function SystemCatalogs() {
  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold">Catálogos del Sistema</h1>
      <p className="text-muted-foreground">
        Gestiona los datos maestros que están disponibles para todas las plataformas del sistema.
      </p>
      <Tabs defaultValue="countries" className="w-full">
        <TabsList>
          <TabsTrigger value="countries">Países</TabsTrigger>
          <TabsTrigger value="currencies">Monedas</TabsTrigger>
          <TabsTrigger value="localizations">Idiomas</TabsTrigger>
        </TabsList>
        <TabsContent value="countries" className="pt-6">
          <CountriesSettings />
        </TabsContent>
        <TabsContent value="currencies" className="pt-6">
          <CurrenciesSettings />
        </TabsContent>
        <TabsContent value="localizations" className="pt-6">
          <LocalizationsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
