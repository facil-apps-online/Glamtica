
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useSuppliers, useToggleSupplierStatus } from '@/hooks/useSuppliers';
import { SupplierDialog } from '@/components/SupplierDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, PlusCircle, ArrowLeft } from 'lucide-react';

// Interfaz para que coincida con los datos del hook
interface Supplier {
  id: string;
  name: string;
  identification_type: string;
  identification_number: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const { data: suppliers, isLoading, error } = useSuppliers();
  const toggleStatusMutation = useToggleSupplierStatus();

  const handleToggleStatus = (supplier: Supplier) => {
    toggleStatusMutation.mutate({ id: supplier.id, is_active: !supplier.is_active });
  };

  if (isLoading) return <div>Cargando proveedores...</div>;
  if (error) return <div>Error al cargar los proveedores: {error.message}</div>;

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-primary">Gestión de Proveedores</h1>
        </div>
        <SupplierDialog 
          trigger={
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          }
        />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.identification_type}: {supplier.identification_number}</TableCell>
                  <TableCell>
                    <div>{supplier.email}</div>
                    <div>{supplier.phone}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={supplier.is_active ? 'success' : 'destructive'}>
                      {supplier.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <SupplierDialog 
                      supplier={supplier}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Switch
                      checked={supplier.is_active}
                      onCheckedChange={() => handleToggleStatus(supplier)}
                      aria-label={`Activar o desactivar a ${supplier.name}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
