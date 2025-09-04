import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductCommissionData, TransformedProductCommissionData } from "@/hooks/useProductCommissionData";
import { useUpdateCommission } from "@/hooks/useUpdateCommission";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Skeleton } from './ui/skeleton';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ManageProductCommissionsDialogProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const ManageProductCommissionsDialog = ({ productId, productName, isOpen, onOpenChange, onSuccess, trigger }: ManageProductCommissionsDialogProps) => {

  const { data: commissionData, isLoading, error, refetch } = useProductCommissionData(isOpen ? productId : undefined);
  const updateCommissionMutation = useUpdateCommission();
  const { toast } = useToast();
  const [localData, setLocalData] = useState<TransformedProductCommissionData[]>([]);

  useEffect(() => {
    if (commissionData) {
      setLocalData(JSON.parse(JSON.stringify(commissionData)));
    }
  }, [commissionData]);

  const handleLocalCommissionChange = (branchIndex: number, userIndex: number, commissionRate: number) => {
    const newData = [...localData];
    newData[branchIndex].users[userIndex].commission_rate = commissionRate;
    setLocalData(newData);
  };

  const handleSaveChanges = (branchIndex: number) => {
    const branch = localData[branchIndex];
    const originalBranch = commissionData?.[branchIndex];

    if (!branch || !originalBranch) return;

    const promises = branch.users.map((user, userIndex) => {
      const originalUser = originalBranch.users[userIndex];
      if (user.commission_rate !== originalUser.commission_rate) {
        return updateCommissionMutation.mutateAsync({
          item_id: productId,
          user_id: user.user_id,
          branch_id: branch.branch_id,
          item_type: 'product',
          commission_rate: user.commission_rate,
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
          <DialogTitle>Comisiones para: {productName}</DialogTitle>
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
                      <div className="grid grid-cols-2 gap-4 font-semibold p-2 border-b">
                        <div>Usuario</div>
                        <div className="text-right">Comisión (%)</div>
                      </div>
                      {branchData.users.map((userData, userIndex) => (
                        <div key={userData.user_id} className="grid grid-cols-2 gap-4 items-center p-2 rounded-lg hover:bg-muted">
                          <div>{userData.user_name}</div>
                          <div className="flex justify-end">
                            <Input
                              type="number"
                              value={userData.commission_rate || 0}
                              onChange={(e) => handleLocalCommissionChange(branchIndex, userIndex, parseFloat(e.target.value) || 0)}
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