import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Mail, Edit, Trash2, Search } from "lucide-react";
import { ClientDialog } from "@/components/ClientDialog";
import { useClients, useDeleteClient } from "@/hooks/useClients";
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
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { data: clients, isLoading } = useClients(confirmedSearchTerm, showInactive);
  const { t } = useTranslation();
  const deleteMutation = useDeleteClient();
  const { selectedBranchId } = useBranchFilterStore();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </ClientDialog>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Clientes
          </h1>
          <p className="text-slate-600 mt-2">
            Gestiona la información de tus clientes
          </p>
        </div>
        <AddClientButton />
      </div>

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

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s ease-in-out' }}>
        {sortedClients.map((client) => {
          const isAssociatedWithSelectedBranch = client.branches?.some(b => b.id === selectedBranchId);
          const cardStyle = selectedBranchId !== 'all' && !isAssociatedWithSelectedBranch
            ? { opacity: 0.6, borderStyle: 'dashed' as const }
            : {};

          return (
            <Card key={client.id} style={cardStyle} className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-primary">{client.name}</CardTitle>
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

                <div className="flex gap-2 pt-2">
                  <ClientDialog 
                    client={client} 
                    isEdit 
                    initialBranchIds={client.branches?.map(b => b.id) || []}
                  >
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </ClientDialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[95vw] sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Estás seguro de que quieres eliminar a <strong>{client.name}</strong>? 
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(client.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {clients?.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No hay clientes</h3>
          <p className="text-slate-600 mb-4">Comienza agregando tu primer cliente</p>
          <AddClientButton />
        </div>
      )}
    </div>
  );
}