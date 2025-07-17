import React, { useState } from 'react';
import { useLocalizations, useUpdateLocalization, Localization } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LocalizationDialog } from './LocalizationDialog';
import { useScreenSize } from '@/hooks/useScreenSize';

export function LocalizationsSettings() {
  const { data: localizations, isLoading } = useLocalizations();
  const updateMutation = useUpdateLocalization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLocalization, setSelectedLocalization] = useState<Localization | undefined>(undefined);
  const screenSize = useScreenSize();

  const handleEdit = (localization: Localization) => {
    setSelectedLocalization(localization);
    setIsDialogOpen(true);
  };

  const handleStatusChange = (localization: Localization, newStatus: boolean) => {
    updateMutation.mutate({ id: localization.id, is_active: newStatus });
  };

  if (isLoading) {
    return <div className="p-4 text-center">Cargando idiomas...</div>;
  }

  const renderLocalizationCard = (localization: Localization) => (
    <Card key={localization.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{localization.name}</CardTitle>
            <CardDescription>{localization.iso_code}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor={`status-switch-mobile-${localization.id}`} className="text-sm font-medium">
              {localization.is_active ? 'Activo' : 'Inactivo'}
            </Label>
            <Switch
              id={`status-switch-mobile-${localization.id}`}
              checked={localization.is_active}
              onCheckedChange={(newStatus) => handleStatusChange(localization, newStatus)}
              disabled={updateMutation.isPending}
            />
          </div>
        </div>
      </CardHeader>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(localization)}>
          Editar
        </Button>
      </CardFooter>
    </Card>
  );

  const renderLocalizationRow = (localization: Localization) => (
    <TableRow key={localization.id}>
      <TableCell>{localization.name}</TableCell>
      <TableCell>{localization.iso_code}</TableCell>
      <TableCell>
        <Switch
          id={`status-switch-desktop-${localization.id}`}
          checked={localization.is_active}
          onCheckedChange={(newStatus) => handleStatusChange(localization, newStatus)}
          disabled={updateMutation.isPending}
          aria-label="Estado del idioma"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => handleEdit(localization)}>
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
            <CardTitle>Gestión de Idiomas</CardTitle>
            <CardDescription>Añade o edita los idiomas disponibles en el sistema.</CardDescription>
          </div>
          <Button onClick={() => { setSelectedLocalization(undefined); setIsDialogOpen(true); }}>
            Añadir Idioma
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {screenSize === 'mobile' ? (
          <div className="space-y-4">
            {localizations?.map(renderLocalizationCard)}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localizations?.map(renderLocalizationRow)}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {isDialogOpen && (
        <LocalizationDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          localization={selectedLocalization}
        />
      )}
    </Card>
  );
}
