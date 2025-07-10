import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/useClients";
import { useActiveServices } from "@/hooks/useServices";
import { useAvailableStylists } from "@/hooks/useAvailableStylists";
import { useCreateAttention } from "@/hooks/useAttentions";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttentionDialogProps {
  children: React.ReactNode;
}

interface ServiceForm {
  service_id: string;
  stylist_id: string;
  service_price: number;
  notes?: string;
}

export const AttentionDialog = ({ children }: AttentionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [attentionDate, setAttentionDate] = useState("");
  const [attentionTime, setAttentionTime] = useState("");
  const [notes, setNotes] = useState("");
  const [services, setServices] = useState<ServiceForm[]>([
    { service_id: "", stylist_id: "", service_price: 0, notes: "" }
  ]);

  const { data: clients } = useClients();
  const { data: availableServices } = useActiveServices();
  const createAttentionMutation = useCreateAttention();

  const addService = () => {
    setServices([...services, { service_id: "", stylist_id: "", service_price: 0, notes: "" }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof ServiceForm, value: string | number) => {
    const updatedServices = [...services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    
    // Si cambia el servicio, actualizar el precio
    if (field === 'service_id') {
      const service = availableServices?.find(s => s.id === value);
      if (service) {
        updatedServices[index].service_price = service.price;
      }
      // Reset stylist when service changes
      updatedServices[index].stylist_id = "";
    }
    
    setServices(updatedServices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !attentionDate || !attentionTime || services.some(s => !s.service_id || !s.stylist_id)) {
      return;
    }

    try {
      await createAttentionMutation.mutateAsync({
        client_id: clientId,
        attention_date: attentionDate,
        attention_time: attentionTime,
        notes: notes || undefined,
        services: services.filter(s => s.service_id && s.stylist_id)
      });
      
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating attention:', error);
    }
  };

  const resetForm = () => {
    setClientId("");
    setAttentionDate("");
    setAttentionTime("");
    setNotes("");
    setServices([{ service_id: "", stylist_id: "", service_price: 0, notes: "" }]);
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Atención</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={attentionDate}
                onChange={(e) => setAttentionDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Hora</Label>
            <Input
              id="time"
              type="time"
              value={attentionTime}
              onChange={(e) => setAttentionTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Servicios</Label>
              <Button type="button" onClick={addService} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Servicio
              </Button>
            </div>

            {services.map((service, index) => (
              <ServiceFormCard
                key={index}
                service={service}
                index={index}
                attentionDate={attentionDate}
                attentionTime={attentionTime}
                onUpdate={updateService}
                onRemove={removeService}
                canRemove={services.length > 1}
                availableServices={availableServices}
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre la atención..."
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
              disabled={createAttentionMutation.isPending || !clientId || services.some(s => !s.service_id || !s.stylist_id)}
            >
              Crear Atención
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface ServiceFormCardProps {
  service: ServiceForm;
  index: number;
  attentionDate: string;
  attentionTime: string;
  onUpdate: (index: number, field: keyof ServiceForm, value: string | number) => void; // More specific type
  onRemove: (index: number) => void;
  canRemove: boolean;
  availableServices: Service[]; // Use the new Service interface
}

const ServiceFormCard = ({ 
  service, 
  index, 
  attentionDate, 
  attentionTime, 
  onUpdate, 
  onRemove, 
  canRemove,
  availableServices 
}: ServiceFormCardProps) => {
  const appointmentDate = attentionDate ? new Date(attentionDate) : undefined;
  const { data: availableStylists } = useAvailableStylists(service.service_id, appointmentDate, attentionTime, true);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Servicio {index + 1}</CardTitle>
          {canRemove && (
            <Button 
              type="button" 
              onClick={() => onRemove(index)} 
              size="sm" 
              variant="ghost"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Servicio</Label>
          <Select 
            value={service.service_id} 
            onValueChange={(value) => onUpdate(index, 'service_id', value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un servicio" />
            </SelectTrigger>
            <SelectContent>
              {availableServices?.map((serviceOption) => (
                <SelectItem key={serviceOption.id} value={serviceOption.id}>
                  {serviceOption.name} - ${serviceOption.price} ({serviceOption.duration_minutes} min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {service.service_id && attentionDate && attentionTime && (
          <div className="space-y-2">
            <Label>Estilista</Label>
            <Select 
              value={service.stylist_id} 
              onValueChange={(value) => onUpdate(index, 'stylist_id', value)}
              required
            >
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
            {availableStylists?.length === 0 && service.service_id && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>No hay estilistas disponibles</strong> para este servicio en la fecha y hora seleccionada.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Precio</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={service.service_price}
            onChange={(e) => onUpdate(index, 'service_price', parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea
            value={service.notes || ""}
            onChange={(e) => onUpdate(index, 'notes', e.target.value)}
            placeholder="Notas específicas para este servicio..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};