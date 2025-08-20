import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/useClients";
import { useBranchServices, Service } from "@/hooks/useServices";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";
import { useCreateAttention } from "@/hooks/useAttentions";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { FilterableSelect } from "./FilterableSelect";
import { debounce } from "@/lib/utils";

interface AttentionFormProps {
  branchId?: string;
  onFormSubmit: () => void;
  onCancel: () => void;
}

interface ServiceForm {
  id: string; // Unique ID for the service form
  service_id: string;
  user_id: string;
  service_price: number;
  duration: number;
  notes?: string;
}

interface ServiceFormCardProps {
  service: ServiceForm;
  index: number;
  attentionDate: string;
  attentionTime: string;
  branchId?: string;
  onUpdate: (index: number, field: keyof Omit<ServiceForm, 'id'>, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  availableServices: (Tables<'services'> & { selling_price: number })[];
}

export const AttentionForm = ({ branchId, onFormSubmit, onCancel }: AttentionFormProps) => {
  const [clientId, setClientId] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [attentionDate, setAttentionDate] = useState("");
  const [attentionTime, setAttentionTime] = useState("");
  const [notes, setNotes] = useState("");
  const [services, setServices] = useState<ServiceForm[]>([
    { id: crypto.randomUUID(), service_id: "", user_id: "", service_price: 0, duration: 0, notes: "" }
  ]);

  const { data: clients } = useClients(clientSearchTerm);
  const { data: branchServices } = useBranchServices(branchId);
  const createAttentionMutation = useCreateAttention();

  const debouncedSetClientSearchTerm = useMemo(() => debounce(setClientSearchTerm, 300), []);

  const addService = () => {
    setServices([...services, { id: crypto.randomUUID(), service_id: "", user_id: "", service_price: 0, duration: 0, notes: "" }]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const updateService = (index: number, field: keyof ServiceForm, value: string | number) => {
    const updatedServices = [...services];
    const currentService = { ...updatedServices[index], [field]: value };

    if (field === 'service_id') {
      const service = branchServices?.find(s => s.id === value);
      if (service) {
        currentService.service_price = service.selling_price;
        currentService.duration = service.duration_minutes;
      }
      currentService.user_id = ""; // Reset user when service changes
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
      onFormSubmit();
    } catch (error) {
      console.error('Error creating attention:', error);
    }
  };

  const clientOptions = clients?.map(client => ({
    value: client.id,
    label: `${client.name} - ${client.phone} - ${client.email}`
  })) || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FilterableSelect
            label="Cliente"
            placeholder="Selecciona un cliente"
            options={clientOptions}
            value={clientId}
            onValueChange={setClientId}
            onSearch={debouncedSetClientSearchTerm}
            searchPlaceholder="Buscar por nombre, teléfono o email"
          />
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
            key={service.id}
            service={service}
            index={index}
            attentionDate={attentionDate}
            attentionTime={attentionTime}
            branchId={branchId}
            onUpdate={updateService}
            onRemove={() => removeService(service.id)}
            canRemove={services.length > 1}
            availableServices={branchServices || []}
          />
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={createAttentionMutation.isPending || !clientId || services.some(s => !s.service_id || !s.user_id)}>
          Crear Atención
        </Button>
      </div>
    </form>
  );
};

const ServiceFormCard = ({ service, index, attentionDate, attentionTime, branchId, onUpdate, onRemove, canRemove, availableServices }: ServiceFormCardProps) => {
  const { data: availableUsers, isLoading } = useAvailableUsers(service.service_id, attentionDate, attentionTime, service.duration, branchId);

  const userOptions = availableUsers?.map(user => ({
    value: user.user_id,
    label: user.users.name
  })) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Servicio {index + 1}</CardTitle>
          {canRemove && <Button type="button" onClick={onRemove} size="sm" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Servicio</Label>
          <Select value={service.service_id} onValueChange={(value) => onUpdate(index, 'service_id', value)} required>
            <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
            <SelectContent>
              {availableServices?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {service.service_id && attentionDate && attentionTime && (
          <div className="space-y-2">
            <FilterableSelect
              label="Usuario"
              placeholder="Selecciona un usuario"
              options={userOptions}
              value={service.user_id}
              onValueChange={(value) => onUpdate(index, 'user_id', value)}
              emptyText={isLoading ? "Cargando..." : "No hay usuarios disponibles"}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Precio</Label>
          <Input type="number" value={service.service_price} onChange={(e) => onUpdate(index, 'service_price', parseFloat(e.target.value) || 0)} required />
        </div>
        <div className="space-y-2">
          <Label>Duración (minutos)</Label>
          <Input type="number" value={service.duration} onChange={(e) => onUpdate(index, 'duration', parseInt(e.target.value) || 0)} required />
        </div>
        <div className="space-y-2">
          <Label>Notas</Label>
          <Textarea value={service.notes || ""} onChange={(e) => onUpdate(index, 'notes', e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
};