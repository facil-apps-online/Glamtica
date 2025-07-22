// Componente para gestionar los formatos de cuerpo de solicitud.

import React from 'react';
import { useIntegrationBodyFormats } from '@/hooks/useIntegrationBodyFormats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export const BodyFormatSettings = () => {
  const { data: formats, isLoading, error } = useIntegrationBodyFormats();

  if (isLoading) return <p>Cargando formatos...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Formatos de Cuerpo</CardTitle>
          <CardDescription>Define los formatos de cuerpo de solicitud disponibles.</CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Formato
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Formato</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formats?.map((format) => (
              <TableRow key={format.id}>
                <TableCell className="font-medium">{format.format}</TableCell>
                <TableCell>{format.description}</TableCell>
                <TableCell className="text-right">
                  {/* Acciones (Editar/Eliminar) irán aquí */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
