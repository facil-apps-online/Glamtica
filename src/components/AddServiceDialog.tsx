import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActiveServices } from "@/hooks/useServices";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";
import { useAddAttentionService } from "@/hooks/useAttentionServices";

interface AddServiceDialogProps {
  children: React.ReactNode;
  attentionId: string;
  attentionDate: string;
  attentionTime: string;
}

export const AddServiceDialog = ({ children, attentionId, attentionDate, attentionTime }: AddServiceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [userId, setUserId] = useState("");
  const [servicePrice, setServicePrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(0);

  const { data: availableServices } = useActiveServices();
  const { data: availableUsers } = useAvailableUsers(serviceId, attentionDate, attentionTime, duration);
  const addServiceMutation = useAddAttentionService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceId || !userId) return;

    try {
      await addServiceMutation.mutateAsync({
        attention_id: attentionId,
        service_id: serviceId,
        user_id: userId,
        service_price: servicePrice,
        notes: notes || undefined
      });
      
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding service:', error);
    }
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
    
    const service = availableServices?.find(s => s.id === value);
    if (service) {
      setServicePrice(service.price);
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
                {availableServices?.map((service) => (
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