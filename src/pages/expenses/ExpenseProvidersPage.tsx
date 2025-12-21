import React, { useState, useMemo, MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Eye, Ban, ArrowLeft, Phone, Mail, FileEdit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ExpenseProviderDialog } from "@/components/expenses/ExpenseProviderDialog";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/ui/EmptyState';


interface ExpenseProvider {
  id: string;
  name: string;
  identification_number: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  document_types: { name: string } | null;
}

const ExpenseProviderCardSkeleton = () => (
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

const ExpenseProviderCard = ({ provider, onToggleStatus, onDelete }) => {
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
        navigate(`/app/expenses/providers/edit/${provider.id}`);
    };

    return (
        <Card onClick={handleCardClick} className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle>{provider.name}</CardTitle>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <ExpenseProviderDialog 
                        provider={provider} 
                        onOpenChange={setIsDialogOpen}
                        trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edición Rápida
                        </DropdownMenuItem>
                    } />
                    <DropdownMenuItem onClick={() => navigate(`/app/expenses/providers/edit/${provider.id}`)}>
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
                {(provider.document_types?.name || 'N/A')}: {provider.identification_number}
            </div>
            {provider.phone && (
                <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" /> {provider.phone}
                </div>
            )}
            {provider.email && (
                <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" /> {provider.email}
                </div>
            )}
            <div className="flex items-center justify-between rounded-md border p-3 mt-4">
                <label className="text-sm font-medium">Activo</label>
                <Switch
                checked={provider.is_active}
                onCheckedChange={() => onToggleStatus(provider)}
                />
            </div>
            </CardContent>
        </Card>
    );
};


export default function ExpenseProvidersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ExpenseProvider | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseProvider | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: providers, isLoading } = useQuery<ExpenseProvider[]>({
    queryKey: ["expenseProviders", { showInactive, confirmedSearchTerm }],
    queryFn: async () => {
      const data = await fetchTenantAction("list-expense-providers", { filters: { showInactive, searchTerm: confirmedSearchTerm } });
      return data;
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      fetchTenantAction("update-expense-provider", { id, ...updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseProviders"] });
      toast({ title: "Proveedor de Gasto actualizado exitosamente.", variant: "success" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar proveedor de gasto.",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      fetchTenantAction("toggle-expense-provider-status", { id, is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseProviders"] });
      toast({ title: "Estado del proveedor de gasto actualizado.", variant: "success" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al cambiar estado del proveedor de gasto.",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: (id: string) =>
      fetchTenantAction("delete-expense-provider", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseProviders"] });
      toast({ title: "Proveedor de Gasto eliminado exitosamente.", variant: "success" });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar proveedor de gasto.",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
      setDeleteTarget(null);
    },
  });

  const handleToggleStatus = (provider: ExpenseProvider) => {
    toggleStatusMutation.mutate({ id: provider.id, is_active: !provider.is_active });
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteProviderMutation.mutateAsync(deleteTarget.id);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Proveedores de Gastos"
        description="Gestiona los proveedores de los gastos del estudio."
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate('/app/expenses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      >
        <ExpenseProviderDialog
            trigger={
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Proveedor
                </Button>
            }
        />
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
                id="show-inactive-providers"
              />
              <label htmlFor="show-inactive-providers" className="text-sm text-muted-foreground">Mostrar inactivos</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? [...Array(6)].map((_, i) => <ExpenseProviderCardSkeleton key={i} />)
          : providers?.map(provider => <ExpenseProviderCard key={provider.id} provider={provider} onToggleStatus={handleToggleStatus} onDelete={() => setDeleteTarget(provider)} />)
        }
      </div>

       {providers?.length === 0 && !isLoading && (
        <EmptyState 
          Icon={PlusCircle} 
          title="No hay proveedores de gastos" 
          description="Crea tu primer proveedor para empezar a registrar gastos." 
          action={<ExpenseProviderDialog trigger={<Button>Nuevo Proveedor</Button>} />} 
        />
      )}

      <ConfirmationDialog 
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`¿Estás seguro de que deseas eliminar a ${deleteTarget?.name}?`}
        description="Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor."
      />
    </div>
  );
}