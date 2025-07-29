import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerWrapper } from "@/components/ui/DatePicker";
import { Plus } from "lucide-react";
import { useCreateTimeOffRequest } from "@/hooks/useUserTimeOff";
import { format } from 'date-fns';

interface TimeOffRequestDialogProps {
  userId: string;
  trigger?: React.ReactNode;
}

const TIME_OFF_TYPES = [
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'sick', label: 'Enfermedad' },
  { value: 'personal', label: 'Personal' },
  { value: 'training', label: 'Capacitación' },
  { value: 'other', label: 'Otro' },
];

export const TimeOffRequestDialog = ({ userId, trigger }: TimeOffRequestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [isPartialDay, setIsPartialDay] = useState(false);

  const createRequestMutation = useCreateTimeOffRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) return;

    try {
      await createRequestMutation.mutateAsync({
        user_id: userId,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        start_time: isPartialDay ? startTime : undefined,
        end_time: isPartialDay ? endTime : undefined,
        reason: reason || undefined,
      });

      setStartDate(null);
      setEndDate(null);
      setStartTime("");
      setEndTime("");
      setReason("");
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
          <Button>
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
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe brevemente el motivo"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createRequestMutation.isPending || !startDate || !endDate}>
              {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};