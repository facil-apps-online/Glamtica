import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Store } from "lucide-react";
import { useBranches } from "@/hooks/useBranches";
import {
  MasterService,
  BranchService,
  useBranchServices,
  useAssignServiceToBranch,
  useUpdateBranchService,
  useRemoveServiceFromBranch
} from "@/hooks/useServices";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useToast } from "@/hooks/use-toast";

interface ManageServiceInBranchDialogProps {
  service: MasterService; // El servicio maestro que estamos gestionando
  trigger?: React.ReactNode;
}

export const ManageServiceInBranchDialog = ({ service, trigger }: ManageServiceInBranchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [sellingPrice, setSellingPrice] = useState<number | string>("");
  const [durationMinutes, setDurationMinutes] = useState<number | string>("");
  const [isActiveInBranch, setIsActiveInBranch] = useState(false);
  const [assignToAll, setAssignToAll] = useState(false);

  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const { data: branchServicesAndCombos, isLoading: isLoadingBranchServices, refetch: refetchBranchServices } = useBranchServicesAndCombos();
  const branchServices = branchServicesAndCombos?.filter(item => item.type === 'service') || [];
  const { mutate: assignService, isPending: isAssigning } = useAssignServiceToBranch();
  const { mutate: updateBranchService, isPending: isUpdatingBranchService } = useUpdateBranchService();
  const { mutate: removeServiceFromBranch, isPending: isRemoving } = useRemoveServiceFromBranch();
  const { formatPrice } = usePriceFormat();
  const { toast } = useToast();

  const serviceInSelectedBranch = branchServices?.find(
    (bs) => bs.id === service.id && bs.branch_id === selectedBranchId
  );

  useEffect(() => {
    if (serviceInSelectedBranch) {
      setSellingPrice(serviceInSelectedBranch.selling_price);
      setDurationMinutes(serviceInSelectedBranch.duration_minutes || "");
      setIsActiveInBranch(serviceInSelectedBranch.is_branch_active);
    } else {
      // Resetear campos si el servicio no está en la sucursal seleccionada
      setSellingPrice("");
      setDurationMinutes("");
      setIsActiveInBranch(true); // Por defecto activo al asignar
    }
  }, [selectedBranchId, serviceInSelectedBranch]);

  useEffect(() => {
    if (open) {
      refetchBranchServices();
    }
  }, [open, refetchBranchServices]);

  const handleAssignOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !sellingPrice || !durationMinutes) {
      toast({ title: "Error", description: "Por favor, complete todos los campos requeridos.", variant: "destructive" });
      return;
    }

    const commonData = {
      selling_price: Number(sellingPrice),
      duration_minutes: Number(durationMinutes),
      is_active: isActiveInBranch,
    };

    try {
      if (serviceInSelectedBranch) {
        // Actualizar servicio existente en la sucursal
        await updateBranchService({
          id: serviceInSelectedBranch.branch_service_id,
          updates: commonData,
        });
        toast({ title: "Servicio Actualizado", description: "El servicio ha sido actualizado en la sucursal.", variant: "success" });
      } else {
        // Asignar nuevo servicio a la(s) sucursal(es)
        const targetBranchIds = assignToAll ? (branches?.map(b => b.id) || []) : [selectedBranchId];

        if (targetBranchIds.length === 0) {
          toast({ title: "Error", description: "No hay sucursales para asignar el servicio.", variant: "destructive" });
          return;
        }

        await assignService({
          service_id: service.id,
          branch_ids: targetBranchIds,
          defaults: commonData,
        });
        toast({ title: "Servicio Asignado", description: `El servicio ha sido asignado a ${targetBranchIds.length} sucursal(es).`, variant: "success" });
      }
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo guardar el servicio en la sucursal.", variant: "destructive" });
    }
  };

  const handleRemoveFromBranch = async () => {
    if (serviceInSelectedBranch && confirm(`¿Estás seguro de que quieres desvincular ${service.name} de esta sucursal?`)) {
      try {
        await removeServiceFromBranch(serviceInSelectedBranch.branch_service_id);
        toast({ title: "Servicio Desvinculado", description: "El servicio ha sido desvinculado de la sucursal.", variant: "success" });
        setOpen(false);
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "No se pudo desvincular el servicio.", variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button variant="outline" size="sm"><Store className="w-4 h-4" /></Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestionar "{service.name}" en Sucursal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAssignOrUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch_select">Seleccionar Sucursal</Label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId} disabled={isLoadingBranches}>
              <SelectTrigger id="branch_select">
                <SelectValue placeholder="Elige una sucursal" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingBranches ? (
                  <SelectItem value="loading" disabled>Cargando sucursales...</SelectItem>
                ) : (
                  branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedBranchId && selectedBranchId !== 'all' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selling_price">Precio de Venta</Label>
                  <Input id="selling_price" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duración (minutos)</Label>
                  <Input id="duration_minutes" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="is_active_in_branch" checked={isActiveInBranch} onCheckedChange={setIsActiveInBranch} />
                <Label htmlFor="is_active_in_branch">Activo en esta sucursal</Label>
              </div>

              {!serviceInSelectedBranch && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="assignToAll" checked={assignToAll} onCheckedChange={() => setAssignToAll(!assignToAll)} />
                  <Label htmlFor="assignToAll">Asignar a TODAS las sucursales</Label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                {serviceInSelectedBranch && (
                  <Button type="button" variant="destructive" onClick={handleRemoveFromBranch} disabled={isRemoving}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Desvincular de Sucursal
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isAssigning || isUpdatingBranchService}>
                  {serviceInSelectedBranch ? "Actualizar" : "Asignar"}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
