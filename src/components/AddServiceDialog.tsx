
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBranchServices } from "@/hooks/useServices";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";
import { useAddAttentionService } from "@/hooks/useAttentionServices";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";

interface AddServiceDialogProps {
  children: React.ReactNode;
  attentionId: string;
}

export const AddServiceDialog = ({ children, attentionId }: AddServiceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [userId, setUserId] = useState("");
  const [servicePrice, setServicePrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(0);

  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const { data: branchServices } = useBranchServices();
  // TODO: La fecha y hora de la atención deben pasarse como props
  const { data: availableUsers } = useAvailableUsers(serviceId, new Date().toISOString(), "12:00", duration);
  const addServiceMutation = useAddAttentionService();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !userId || !currentAssignment || !selectedBranchId || selectedBranchId === 'all') return;

    addServiceMutation.mutate({
      attention_id: attentionId,
      service_id: serviceId,
      user_id: userId,
      service_price: servicePrice,
      notes: notes || undefined,
      tenant_id: currentAssignment.tenant_id,
      branch_id: selectedBranchId,
    }, {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setServiceId("");
    setUserId("");
    setServicePrice(0);
    setNotes("");
    setDuration(0);
  };

  const handleServiceChange = (value: string) => {
    setServiceId(value);
    setUserId("");
    
    const service = branchServices?.find(s => s.id === value);
    if (service) {
      setServicePrice(service.selling_price);
      setDuration(service.duration_minutes);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Servicio Adicional</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Servicio</Label>
            <Select value={serviceId} onValueChange={handleServiceChange} required>
              <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
              <SelectContent>
                {branchServices?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceId && (
            <div className="space-y-2">
              <Label htmlFor="user">Usuario</Label>
              <Select value={userId} onValueChange={setUserId} required>
                <SelectTrigger>
                  <SelectValue placeholder={
                    availableUsers?.length ? "Selecciona un usuario" : "No hay usuarios disponibles"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers?.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.users?.name} - Comisión: {user.commission_rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Precio</Label>
            <Input id="price" type="number" value={servicePrice} onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={addServiceMutation.isPending || !serviceId || !userId}>
              Agregar Servicio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};