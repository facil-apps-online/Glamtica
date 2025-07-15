import React, { useState } from 'react';
import { useLocalizations, Localization } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LocalizationDialog } from './LocalizationDialog';
import { useScreenSize } from '@/hooks/useScreenSize';

export function LocalizationsSettings() {
  const { data: localizations, isLoading } = useLocalizations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLocalization, setSelectedLocalization] = useState<Localization | undefined>(undefined);
  const screenSize = useScreenSize();

  const handleEdit = (localization: Localization) => {
    setSelectedLocalization(localization);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Cargando localizaciones...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Gestión de Localizaciones</CardTitle>
            <CardDescription>Añade o edita los idiomas disponibles en el sistema.</CardDescription>
          </div>
          <Button onClick={() => { setSelectedLocalization(undefined); setIsDialogOpen(true); }}>
            Añadir Localización
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {screenSize === 'mobile' ? (
          <div className="space-y-4">
            {localizations?.map((localization) => (
              <Card key={localization.id} className="flex justify-between items-center p-4">
                <div>
                  <p className="font-semibold">{localization.name}</p>
                  <p className="text-sm text-muted-foreground">{localization.iso_code}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(localization)}>
                  Editar
                </Button>
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
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localizations?.map((localization) => (
                  <TableRow key={localization.id}>
                    <TableCell>{localization.name}</TableCell>
                    <TableCell>{localization.iso_code}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(localization)}>
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
        <LocalizationDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          localization={selectedLocalization}
        />
      )}
    </Card>
  );
}
