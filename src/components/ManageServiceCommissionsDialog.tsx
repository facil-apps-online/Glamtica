import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useServiceCommissionData, ServiceCommissionData } from "@/hooks/useServiceCommissionData";
import { useUpdateCommission } from "@/hooks/useUpdateCommission";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Skeleton } from './ui/skeleton';
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Nueva interfaz para la estructura de datos transformada (agrupada por sucursal)
interface TransformedServiceCommissionData {
  branch_id: string;
  branch_name: string;
  users: {
    user_id: string;
    user_name: string;
    commission_rate: number | null;
    can_perform: boolean | null;
    commission_id: string | null;
  }[];
}

interface ManageServiceCommissionsDialogProps {
  serviceId: string;
  serviceName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const ManageServiceCommissionsDialog = ({ serviceId, serviceName, isOpen, onOpenChange, onSuccess, trigger }: ManageServiceCommissionsDialogProps) => {

  const { data: commissionData, isLoading, error, refetch } = useServiceCommissionData(isOpen ? serviceId : undefined);
  const updateCommissionMutation = useUpdateCommission();
  const { toast } = useToast();
  const [localData, setLocalData] = useState<TransformedServiceCommissionData[]>([]);

  useEffect(() => {
    if (commissionData) {
      // Transformar los datos para agrupar por sucursal
      const transformed: { [branchId: string]: TransformedServiceCommissionData } = {};

      commissionData.forEach(userData => {
        userData.branches.forEach(branchData => {
          if (!transformed[branchData.branch_id]) {
            transformed[branchData.branch_id] = {
              branch_id: branchData.branch_id,
              branch_name: branchData.branch_name,
              users: [],
            };
          }
          transformed[branchData.branch_id].users.push({
            user_id: userData.user_id,
            user_name: userData.user_name,
            commission_rate: branchData.commission_rate,
            can_perform: branchData.can_perform,
            commission_id: branchData.commission_id,
          });
        });
      });
      setLocalData(Object.values(transformed));
    }
  }, [commissionData]);

  const handleLocalCommissionChange = (branchIndex: number, userIndex: number, value: number | boolean, field: 'commission_rate' | 'can_perform') => {
    const newData = [...localData];
    if (field === 'commission_rate') {
      newData[branchIndex].users[userIndex].commission_rate = value as number;
    } else if (field === 'can_perform') {
      newData[branchIndex].users[userIndex].can_perform = value as boolean;
    }
    setLocalData(newData);
  };

  const handleSaveChanges = (branchIndex: number) => {
    const branch = localData[branchIndex];
    // Necesitamos los datos originales para comparar y enviar solo los cambios
    // Esto es un poco más complejo ya que la estructura original es diferente.
    // Para simplificar, asumiremos que `commissionData` es la fuente original
    // y buscaremos los valores originales por user_id y branch_id.

    const promises = branch.users.map((user, userIndex) => {
      // Encontrar el valor original de la comisión para este usuario en esta sucursal
      const originalUserEntry = commissionData?.find(u => u.user_id === user.user_id);
      const originalBranchEntry = originalUserEntry?.branches.find(b => b.branch_id === branch.branch_id);

      const changes: any = {};
      let hasChanges = false;

      if (originalBranchEntry && user.commission_rate !== originalBranchEntry.commission_rate) {
        changes.commission_rate = user.commission_rate;
        hasChanges = true;
      }
      if (originalBranchEntry && user.can_perform !== originalBranchEntry.can_perform) {
        changes.can_perform = user.can_perform;
        hasChanges = true;
      }

      if (hasChanges) {
        return updateCommissionMutation.mutateAsync({
          item_id: serviceId,
          user_id: user.user_id,
          branch_id: branch.branch_id,
          item_type: 'service',
          ...changes,
        });
      }
      return Promise.resolve();
    });

    Promise.all(promises)
      .then(() => {
        toast({
          title: "Comisiones actualizadas",
          description: `Las comisiones para la sucursal ${branch.branch_name} se han guardado correctamente.`,
          variant: "success",
        });
        refetch(); // Refrescar los datos para obtener el estado más reciente
        onSuccess?.();
      })
      .catch((error) => {
        toast({
          title: "Error al actualizar",
          description: `Hubo un problema al guardar las comisiones: ${error.message}`,
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comisiones para: {serviceName}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-4">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {error && <p className="text-red-500">Error al cargar los datos: {error.message}</p>}
          {localData && (
            <Accordion type="single" collapsible className="w-full">
              {localData.map((branchData, branchIndex) => (
                <AccordionItem value={branchData.branch_id} key={branchData.branch_id}>
                  <AccordionTrigger>{branchData.branch_name}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-4 font-semibold p-2 border-b">
                        <div>Usuario</div>
                        <div className="text-center">Puede Realizar</div>
                        <div className="text-right">Comisión (%)</div>
                      </div>
                      {branchData.users.map((userData, userIndex) => (
                        <div key={userData.user_id} className="grid grid-cols-3 gap-4 items-center p-2 rounded-lg hover:bg-muted">
                          <div>{userData.user_name}</div>
                          <div className="flex justify-center">
                            <Switch
                              checked={userData.can_perform || false}
                              onCheckedChange={(checked) => handleLocalCommissionChange(branchIndex, userIndex, checked, 'can_perform')}
                              disabled={updateCommissionMutation.isPending}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Input
                              type="number"
                              value={userData.commission_rate || 0}
                              onChange={(e) => handleLocalCommissionChange(branchIndex, userIndex, parseFloat(e.target.value) || 0, 'commission_rate')}
                              className="w-24 text-right"
                              disabled={updateCommissionMutation.isPending}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={() => handleSaveChanges(branchIndex)}
                          disabled={updateCommissionMutation.isPending}
                        >
                          {updateCommissionMutation.isPending ? 'Guardando...' : 'Guardar Comisiones'}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};