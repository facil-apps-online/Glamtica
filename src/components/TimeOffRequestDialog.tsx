import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCreateTimeOffRequest } from "@/hooks/useUserTimeOff";
import { formatInTimeZone } from 'date-fns-tz';
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";

registerLocale("es", es);

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
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isPartialDay, setIsPartialDay] = useState(false);
  const [type, setType] = useState("");
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const createRequestMutation = useCreateTimeOffRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const branchIdToUse = selectedBranchId === 'all' ? null : selectedBranchId;

    if (!startDate || !endDate || !type || !branchIdToUse) return;

    let finalStartDate = startDate;
    let finalEndDate = endDate;

    if (isPartialDay) {
      // Combine date and time for partial day
      if (startTime) {
        const [hours, minutes] = startTime.split(':').map(Number);
        finalStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), hours, minutes);
      }
      if (endTime) {
        const [hours, minutes] = endTime.split(':').map(Number);
        finalEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), hours, minutes);
      }
    } else {
      // For full day, set time to start/end of day
      finalStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
      finalEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    }

    try {
      await createRequestMutation.mutateAsync({
        user_id: userId,
        start_date: finalStartDate,
        end_date: finalEndDate,
        type: type,
        reason: reason || undefined,
        is_partial_day: isPartialDay,
        branch_id: branchIdToUse,
      });

      setStartDate(null);
      setEndDate(null);
      setStartTime(null);
      setEndTime(null);
      setReason("");
      setIsPartialDay(false);
      setType("");
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
            Solicitar Ausencia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Ausencia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label>Tipo de Ausencia</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OFF_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date) => setStartDate(date)}
                locale="es"
                dateFormat="dd/MM/yyyy"
                minDate={new Date()} // Disable past dates
                className="w-full px-3 py-2 border border-input rounded-md" // Basic styling to match Input
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Fin</Label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date) => setEndDate(date)}
                locale="es"
                dateFormat="dd/MM/yyyy"
                minDate={startDate || new Date()} // Disable past dates, and ensure end date is not before start date
                className="w-full px-3 py-2 border border-input rounded-md" // Basic styling to match Input
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
                  value={startTime || ''}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de Fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime || ''}
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
            <Button type="submit" disabled={createRequestMutation.isPending || !startDate || !endDate || !type || (isPartialDay && (!startTime || !endTime))}>
              {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};