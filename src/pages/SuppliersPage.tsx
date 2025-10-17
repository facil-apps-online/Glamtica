import { useState, MouseEvent } from 'react';
import { useNavigate } from "react-router-dom";
import { useSuppliers, useToggleSupplierStatus, useDeleteSupplier } from '@/hooks/useSuppliers';
import { SupplierDialog } from '@/components/SupplierDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, PlusCircle, ArrowLeft, MoreHorizontal, Phone, Mail, FileEdit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useScreenSize } from '@/hooks/useScreenSize';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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

const SupplierCard = ({ supplier, handleToggleStatus, onDelete }) => {
    const navigate = useNavigate();

    const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (
            target.closest('button') ||
            target.closest('[role="switch"]') ||
            target.closest('[data-radix-dropdown-menu-content]') ||
            target.closest('[role="menuitem"]')
        ) {
            return;
        }
        navigate(`/app/inventory/suppliers/edit/${supplier.id}`);
    };

    return (
        <Card onClick={handleCardClick} className="cursor-pointer transition-colors hover:bg-muted/50">
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
                            Edición Rápida
                        </DropdownMenuItem>
                    } />
                    <DropdownMenuItem onClick={() => navigate(`/app/inventory/suppliers/edit/${supplier.id}`)}>
                        <FileEdit className="w-4 h-4 mr-2" />
                        Edición Completa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                    </DropdownMenuItem>
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
};

const SuppliersPage = () => {
  const navigate = useNavigate();
  const { data: suppliers, isLoading, error } = useSuppliers();
  const toggleStatusMutation = useToggleSupplierStatus();
  const deleteMutation = useDeleteSupplier();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const handleToggleStatus = (supplier: Supplier) => {
    toggleStatusMutation.mutate({ id: supplier.id, is_active: !supplier.is_active });
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
      setDeleteTarget(null);
    }
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
        {suppliers.map(supplier => <SupplierCard key={supplier.id} supplier={supplier} handleToggleStatus={handleToggleStatus} onDelete={() => setDeleteTarget(supplier)} />)}
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
            <TableRow 
              key={supplier.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                // Evitar navegar si se hace clic en un botón, un switch, o dentro del menú de acciones
                if (
                  target.closest('button') || 
                  target.closest('[role="switch"]') || 
                  target.closest('[data-radix-dropdown-menu-content]') ||
                  target.closest('[role="menuitem"]')
                ) {
                  return;
                }
                navigate(`/app/inventory/suppliers/edit/${supplier.id}`);
              }}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell>{supplier.identification_type}: {supplier.identification_number}</TableCell>
              <TableCell>
                <div>{supplier.email}</div>
                <div>{supplier.phone}</div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={supplier.is_active}
                  onCheckedChange={() => handleToggleStatus(supplier)}
                />
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
                        Edición Rápida
                      </DropdownMenuItem>
                    } />
                    <DropdownMenuItem onClick={() => navigate(`/app/inventory/suppliers/edit/${supplier.id}`)}>
                        <FileEdit className="w-4 h-4 mr-2" />
                        Edición Completa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(supplier)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
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
        title="Proveedores"
        subtitle="Centraliza la información y el estado de todos tus proveedores."
        backButton={<Button variant="outline" size="icon" onClick={() => navigate('/app/inventory')}><ArrowLeft className="h-4 w-4" /></Button>}
      >
                <SupplierDialog trigger={
          <Button>
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Nuevo Proveedor</span>
          </Button>
        } />
      </PageHeader>

      <Card>
        <CardContent className="p-0 sm:p-6">
          {renderContent()}
        </CardContent>
      </Card>

      <ConfirmationDialog 
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`¿Estás seguro de que deseas eliminar a ${deleteTarget?.name}?`}
        description="Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor y todos sus datos asociados."
      />
    </div>
  );
};

export default SuppliersPage;