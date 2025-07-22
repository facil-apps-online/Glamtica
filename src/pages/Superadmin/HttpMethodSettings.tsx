// Este será el componente para gestionar los métodos HTTP.
// Por ahora, lo crearé con una estructura básica.
// La implementación completa (diálogos de edición/creación, etc.) vendrá después.

import React from 'react';
import { useIntegrationHttpMethods } from '@/hooks/useIntegrationHttpMethods';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export const HttpMethodSettings = () => {
  const { data: methods, isLoading, error } = useIntegrationHttpMethods();

  if (isLoading) return <p>Cargando métodos HTTP...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Métodos HTTP</CardTitle>
          <CardDescription>Define los métodos HTTP disponibles para las integraciones.</CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Método
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods?.map((method) => (
              <TableRow key={method.id}>
                <TableCell className="font-medium">{method.method}</TableCell>
                <TableCell>{method.description}</TableCell>
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
