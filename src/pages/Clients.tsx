import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Mail, Edit, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const { t } = useTranslation();
  const deleteMutation = useDeleteClient();
  const { selectedBranchId } = useBranchFilterStore();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const isAllBranchesSelected = selectedBranchId === 'all';

  if (isLoading) {
    return <div className="p-8">Cargando clientes...</div>;
  }

  const AddClientButton = () => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            <ClientDialog initialBranchId={selectedBranchId}>
              <Button disabled={isAllBranchesSelected}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </ClientDialog>
          </div>
        </TooltipTrigger>
        {isAllBranchesSelected && (
          <TooltipContent>
            <p>Por favor, selecciona una sucursal para agregar un nuevo cliente.</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients?.map((client) => (
          <Card key={client.id} className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-primary">{client.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  initialBranchId={client.client_branches?.[0]?.branches?.id || selectedBranchId}
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
        ))}
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