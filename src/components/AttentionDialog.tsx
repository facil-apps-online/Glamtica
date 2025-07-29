import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/useClients";
import { useActiveServices } from "@/hooks/useServices";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";
import { useCreateAttention } from "@/hooks/useAttentions";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttentionDialogProps {
  children: React.ReactNode;
}

interface ServiceForm {
  service_id: string;
  user_id: string;
  service_price: number;
  duration: number;
  notes?: string;
}

export const AttentionDialog = ({ children }: AttentionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [attentionDate, setAttentionDate] = useState("");
  const [attentionTime, setAttentionTime] = useState("");
  const [notes, setNotes] = useState("");
  const [services, setServices] = useState<ServiceForm[]>([
    { service_id: "", user_id: "", service_price: 0, duration: 0, notes: "" }
  ]);

  const { data: clients } = useClients();
  const { data: availableServices } = useActiveServices();
  const createAttentionMutation = useCreateAttention();

  const addService = () => {
    setServices([...services, { service_id: "", user_id: "", service_price: 0, duration: 0, notes: "" }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof ServiceForm, value: string | number) => {
    const updatedServices = [...services];
    const currentService = { ...updatedServices[index], [field]: value };

    if (field === 'service_id') {
      const service = availableServices?.find(s => s.id === value);
      if (service) {
        currentService.service_price = service.price;
        currentService.duration = service.duration_minutes;
      }
      currentService.user_id = "";
    }
    updatedServices[index] = currentService;
    setServices(updatedServices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !attentionDate || !attentionTime || services.some(s => !s.service_id || !s.user_id)) {
      return;
    }
    try {
      await createAttentionMutation.mutateAsync({
        client_id: clientId,
        attention_date: attentionDate,
        attention_time: attentionTime,
        notes: notes || undefined,
        services: services.filter(s => s.service_id && s.user_id).map(s => ({
          service_id: s.service_id,
          user_id: s.user_id,
          service_price: s.service_price,
          notes: s.notes
        }))
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
    setServices([{ service_id: "", user_id: "", service_price: 0, duration: 0, notes: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setOpen(isOpen); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva Atención</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" value={attentionDate} onChange={(e) => setAttentionDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Hora</Label>
            <Input id="time" type="time" value={attentionTime} onChange={(e) => setAttentionTime(e.target.value)} required />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Servicios</Label>
              <Button type="button" onClick={addService} size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" />Agregar</Button>
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
                availableServices={availableServices || []}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createAttentionMutation.isPending || !clientId || services.some(s => !s.service_id || !s.user_id)}>
              Crear Atención
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ServiceFormCard = ({ service, index, attentionDate, attentionTime, onUpdate, onRemove, canRemove, availableServices }: any) => {
  const { data: availableUsers } = useAvailableUsers(service.service_id, attentionDate, attentionTime, service.duration);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Servicio {index + 1}</CardTitle>
          {canRemove && <Button type="button" onClick={() => onRemove(index)} size="sm" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Servicio</Label>
          <Select value={service.service_id} onValueChange={(value) => onUpdate(index, 'service_id', value)} required>
            <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
            <SelectContent>
              {availableServices?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {service.service_id && attentionDate && attentionTime && (
          <div className="space-y-2">
            <Label>Usuario</Label>
            <Select value={service.user_id} onValueChange={(value) => onUpdate(index, 'user_id', value)} required>
              <SelectTrigger><SelectValue placeholder={availableUsers?.length ? "Selecciona un usuario" : "No hay usuarios disponibles"} /></SelectTrigger>
              <SelectContent>
                {availableUsers?.map((u: any) => <SelectItem key={u.user_id} value={u.user_id}>{u.users?.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Precio</Label>
          <Input type="number" value={service.service_price} onChange={(e) => onUpdate(index, 'service_price', parseFloat(e.target.value) || 0)} required />
        </div>
        <div className="space-y-2">
          <Label>Notas</Label>
          <Textarea value={service.notes || ""} onChange={(e) => onUpdate(index, 'notes', e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
};