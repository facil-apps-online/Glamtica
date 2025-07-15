import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerWrapper } from "@/components/ui/DatePicker"; // Importar el nuevo componente
import { Plus } from "lucide-react";
import { useCreateTimeOffRequest } from "@/hooks/useStylistTimeOff";

interface TimeOffRequestDialogProps {
  stylistId: string;
  trigger?: React.ReactNode;
}

const TIME_OFF_TYPES = [
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'sick', label: 'Enfermedad' },
  { value: 'personal', label: 'Personal' },
  { value: 'training', label: 'Capacitación' },
  { value: 'other', label: 'Otro' },
];

export const TimeOffRequestDialog = ({ stylistId, trigger }: TimeOffRequestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isPartialDay, setIsPartialDay] = useState(false);

  const createRequestMutation = useCreateTimeOffRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !type) return;

    try {
      await createRequestMutation.mutateAsync({
        stylist_id: stylistId,
        start_date: startDate,
        end_date: endDate,
        start_time: isPartialDay ? startTime : undefined,
        end_time: isPartialDay ? endTime : undefined,
        type,
        reason: reason || undefined,
        notes: notes || undefined,
      });

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setStartTime("");
      setEndTime("");
      setType("");
      setReason("");
      setNotes("");
      setIsPartialDay(false);
      setOpen(false);
    } catch (error) {
      console.error('Error creating time off request:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Solicitar Permiso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Permiso o Ausencia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Permiso</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OFF_TYPES.map((timeOffType) => (
                  <SelectItem key={timeOffType.value} value={timeOffType.value}>
                    {timeOffType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <DatePickerWrapper
                selected={startDate}
                onChange={setStartDate}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Fin</Label>
              <DatePickerWrapper
                selected={endDate}
                onChange={setEndDate}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="partialDay"
              checked={isPartialDay}
              onChange={(e) => setIsPartialDay(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="partialDay">Permiso parcial (especificar horas)</Label>
          </div>

          {isPartialDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora de Inicio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de Fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe brevemente el motivo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional..."
              rows={3}
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
              disabled={createRequestMutation.isPending || !startDate || !endDate || !type}
            >
              {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};