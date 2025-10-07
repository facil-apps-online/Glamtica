import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useSuppliers, useToggleSupplierStatus } from '@/hooks/useSuppliers';
import { SupplierDialog } from '@/components/SupplierDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, PlusCircle, ArrowLeft, MoreHorizontal, Trash2, Phone, Mail } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useScreenSize } from '@/hooks/useScreenSize';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

interface Supplier {
  id: string;
  name: string;
  identification_type: string;
  identification_number: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

const SupplierCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-8" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <div className="h-10 w-full mt-4 rounded-md border flex items-center justify-between p-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
    </CardContent>
  </Card>
);

const SupplierTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Nombre</TableHead>
        <TableHead>Identificación</TableHead>
        <TableHead>Contacto</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const SupplierCard = ({ supplier, handleToggleStatus }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle>{supplier.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <SupplierDialog supplier={supplier} trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
            } />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {supplier.identification_type}: {supplier.identification_number}
      </div>
      {supplier.phone && (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4" /> {supplier.phone}
        </div>
      )}
      {supplier.email && (
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4" /> {supplier.email}
        </div>
      )}
      <div className="flex items-center justify-between rounded-md border p-3 mt-4">
        <label className="text-sm font-medium">Activo</label>
        <Switch
          checked={supplier.is_active}
          onCheckedChange={() => handleToggleStatus(supplier)}
        />
      </div>
    </CardContent>
  </Card>
);

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const { data: suppliers, isLoading, error } = useSuppliers();
  const toggleStatusMutation = useToggleSupplierStatus();
  const { isMobile } = useScreenSize();

  const handleToggleStatus = (supplier: Supplier) => {
    toggleStatusMutation.mutate({ id: supplier.id, is_active: !supplier.is_active });
  };

  const renderContent = () => {
    if (isLoading) {
      return isMobile ? <div className="space-y-4 p-4">{[...Array(5)].map((_, i) => <SupplierCardSkeleton key={i} />)}</div> : <SupplierTableSkeleton />;
    }

    if (!suppliers || suppliers.length === 0) {
      return <EmptyState Icon={PlusCircle} title="No hay proveedores" description="Crea tu primer proveedor para empezar a gestionar compras." action={<SupplierDialog trigger={<Button>Nuevo Proveedor</Button>} />} />;
    }

    return isMobile ? (
      <div className="space-y-4 p-4">
        {suppliers.map(supplier => <SupplierCard key={supplier.id} supplier={supplier} handleToggleStatus={handleToggleStatus} />)}
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Identificación</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell>{supplier.identification_type}: {supplier.identification_number}</TableCell>
              <TableCell>
                <div>{supplier.email}</div>
                <div>{supplier.phone}</div>
              </TableCell>
              <TableCell>
                <Badge variant={supplier.is_active ? 'success' : 'destructive'}>
                  {supplier.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <SupplierDialog supplier={supplier} trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    } />
                    <DropdownMenuItem onClick={() => handleToggleStatus(supplier)}>
                      <Switch checked={supplier.is_active} className="mr-2 h-4 w-7" />
                      <span>{supplier.is_active ? 'Desactivar' : 'Activar'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Gestión de Proveedores"
        subtitle="Centraliza la información y el estado de todos tus proveedores."
        backButton={<Button variant="outline" size="icon" onClick={() => navigate('/inventory')}><ArrowLeft className="h-4 w-4" /></Button>}
      >
        <SupplierDialog trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Nuevo Proveedor</Button>} />
      </PageHeader>

      <Card>
        <CardContent className="p-0 sm:p-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};