import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Mail, Edit, Trash2, Search, MoreHorizontal, FileEdit } from "lucide-react";
import { ClientDialog } from "@/components/ClientDialog";
import { useClients, useDeleteClient, useUpdateClient } from "@/hooks/useClients";
import { useTranslation } from "@/hooks/useTranslations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ClientCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="h-8 w-8" />
      </div>
      <Skeleton className="h-6 w-3/4 mt-2" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="h-10 w-full mt-4 rounded-md border flex items-center justify-between p-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
    </CardContent>
  </Card>
);

const ClientCard = ({ client, handleDelete, handleToggleStatus }) => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isAssociatedWithSelectedBranch = true; // Placeholder
  const cardStyle = {}; // Placeholder

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDialogOpen) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="switch"]') ||
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="dialog"]')
    ) {
      return;
    }
    navigate(`/app/clients/${client.id}`);
  };

  return (
    <Card 
      onClick={handleCardClick}
      style={cardStyle} 
      className="cursor-pointer backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{client.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ClientDialog 
                client={client} 
                isEdit 
                initialBranchIds={client.branches?.map(b => b.id) || []}
                onOpenChange={setIsDialogOpen}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edición rápida
                </DropdownMenuItem>
              </ClientDialog>
              <DropdownMenuItem onClick={() => navigate(`/app/clients/${client.id}`)}>
                <FileEdit className="w-4 h-4 mr-2" />
                Edición Completa
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que quieres eliminar a <strong>{client.name}</strong>? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(client.id)} className="bg-red-600 hover:bg-red-700">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {client.parent_client_id && client.parent_client?.name && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>Hijo de: {client.parent_client.name}</span>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-500" />
            <span className="text-sm">{client.phone}</span>
          </div>
          {client.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span className="text-sm">{client.email}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between rounded-md border p-3 mt-4">
          <label className="text-sm font-medium">Activo</label>
          <Switch
            checked={client.is_active}
            onCheckedChange={() => handleToggleStatus(client)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { data: clients, isLoading } = useClients(confirmedSearchTerm, showInactive);
  const { t } = useTranslation();
  const deleteMutation = useDeleteClient();
  const updateMutation = useUpdateClient();
  const { selectedBranchId } = useBranchFilterStore();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggleStatus = (client) => {
    updateMutation.mutate({ id: client.id, is_active: !client.is_active });
  };

  const sortedClients = useMemo(() => {
    if (!clients) return [];
    if (selectedBranchId === 'all') {
      return [...clients].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...clients].sort((a, b) => {
      const aIsAssociated = a.branches?.some(b => b.id === selectedBranchId);
      const bIsAssociated = b.branches?.some(b => b.id === selectedBranchId);

      if (aIsAssociated && !bIsAssociated) return -1;
      if (!aIsAssociated && bIsAssociated) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [clients, selectedBranchId]);

  const AddClientButton = () => {
    const initialIds = selectedBranchId === 'all' ? [] : [selectedBranchId];
    return (
      <ClientDialog initialBranchIds={initialIds}>
        <Button size="sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Nuevo Cliente</span>
        </Button>
      </ClientDialog>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Clientes" subtitle="Gestiona la información de tus clientes">
        <AddClientButton />
      </PageHeader>

      <Card className="mt-4">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
               <Input
                  placeholder="Buscar clientes..."
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
                id="show-inactive-clients"
              />
              <label htmlFor="show-inactive-clients" className="text-sm text-muted-foreground">Mostrar inactivos</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? [...Array(6)].map((_, i) => <ClientCardSkeleton key={i} />)
          : sortedClients.map((client) => (
              <ClientCard 
                key={client.id} 
                client={client} 
                handleDelete={handleDelete} 
                handleToggleStatus={handleToggleStatus} 
              />
            ))}
      </div>

      {clients?.length === 0 && !isLoading && (
        <EmptyState
          Icon={User}
          title="No hay clientes"
          description="Comienza agregando tu primer cliente"
          action={<AddClientButton />}
        />
      )}
    </div>
  );
}