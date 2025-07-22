// Componente para gestionar los métodos de autenticación.

import React from 'react';
import { useIntegrationAuthMethods } from '@/hooks/useIntegrationAuthMethods';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export const AuthMethodSettings = () => {
  const { data: methods, isLoading, error } = useIntegrationAuthMethods();

  if (isLoading) return <p>Cargando métodos de autenticación...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Métodos de Autenticación</CardTitle>
          <CardDescription>Define los métodos de autenticación disponibles.</CardDescription>
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
