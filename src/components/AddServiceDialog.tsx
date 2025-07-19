import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActiveServices } from "@/hooks/useServices";
import { useAvailableStylists } from "@/hooks/useAvailableStylists";
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
  const [stylistId, setStylistId] = useState("");
  const [servicePrice, setServicePrice] = useState(0);
  const [notes, setNotes] = useState("");

  const { data: availableServices } = useActiveServices();
  const appointmentDate = attentionDate ? new Date(attentionDate) : undefined;
  const { data: availableStylists } = useAvailableStylists(serviceId, appointmentDate, attentionTime, true);
  const addServiceMutation = useAddAttentionService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceId || !stylistId) {
      return;
    }

    try {
      await addServiceMutation.mutateAsync({
        attention_id: attentionId,
        service_id: serviceId,
        stylist_id: stylistId,
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
    setStylistId("");
    setServicePrice(0);
    setNotes("");
  };

  const handleServiceChange = (value: string) => {
    setServiceId(value);
    setStylistId(""); // Reset stylist when service changes
    
    // Update price when service changes
    const service = availableServices?.find(s => s.id === value);
    if (service) {
      setServicePrice(service.price);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Servicio Adicional</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Servicio</Label>
            <Select value={serviceId} onValueChange={handleServiceChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {availableServices?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - ${service.price} ({service.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceId && (
            <div className="space-y-2">
              <Label htmlFor="stylist">Estilista</Label>
              <Select value={stylistId} onValueChange={setStylistId} required>
                <SelectTrigger>
                  <SelectValue placeholder={
                    availableStylists?.length && availableStylists.length > 0 
                      ? "Selecciona un estilista" 
                      : "No hay estilistas disponibles"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableStylists?.map((commission) => (
                    <SelectItem key={commission.stylist_id} value={commission.stylist_id}>
                      {commission.stylists?.name} - Comisión: {commission.commission_rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableStylists?.length === 0 && serviceId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>No hay estilistas disponibles</strong> para este servicio en la fecha y hora seleccionada.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={servicePrice}
              onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas específicas para este servicio..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addServiceMutation.isPending || !serviceId || !stylistId}
            >
              Agregar Servicio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};