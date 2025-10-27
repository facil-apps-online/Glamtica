import { useState, MouseEvent } from 'react';
import { useNavigate } from "react-router-dom";
import { useSuppliers, useToggleSupplierStatus, useDeleteSupplier } from '@/hooks/useSuppliers';
import { SupplierDialog } from '@/components/SupplierDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, PlusCircle, ArrowLeft, MoreHorizontal, Phone, Mail, FileEdit, Trash2, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
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



const SupplierCard = ({ supplier, handleToggleStatus, onDelete }) => {
    const navigate = useNavigate();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
        if (isDialogOpen) return;

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
                    <SupplierDialog 
                        supplier={supplier} 
                        onOpenChange={setIsDialogOpen}
                        trigger={
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
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const { data: suppliers, isLoading, error } = useSuppliers(confirmedSearchTerm, showInactive);
  const toggleStatusMutation = useToggleSupplierStatus();
  const deleteMutation = useDeleteSupplier();
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
        <CardContent className="py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
               <Input
                  placeholder="Buscar proveedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:col-span-3"
                />
                <Button onClick={() => setConfirmedSearchTerm(searchTerm)} className="md:col-span-1">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={showInactive}
                onCheckedChange={setShowInactive}
                id="show-inactive-suppliers"
              />
              <label htmlFor="show-inactive-suppliers" className="text-sm text-muted-foreground">Mostrar inactivos</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? [...Array(6)].map((_, i) => <SupplierCardSkeleton key={i} />)
          : suppliers?.map(supplier => <SupplierCard key={supplier.id} supplier={supplier} handleToggleStatus={handleToggleStatus} onDelete={() => setDeleteTarget(supplier)} />)
        }
      </div>

      {suppliers?.length === 0 && !isLoading && (
        <EmptyState 
          Icon={PlusCircle} 
          title="No hay proveedores" 
          description="Crea tu primer proveedor para empezar a gestionar compras." 
          action={<SupplierDialog trigger={<Button>Nuevo Proveedor</Button>} />} 
        />
      )}

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