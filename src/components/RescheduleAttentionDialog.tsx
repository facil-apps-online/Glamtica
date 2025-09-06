import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Input } from "@/components/ui/input";
import { format, setHours, setMinutes } from "date-fns";
import DatePickerButtonInput from "./DatePickerButtonInput";
import { Attention } from "@/hooks/useAttentions";
import { useRescheduleAttention } from "@/hooks/useRescheduleAttention";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RescheduleAttentionDialogProps {
  attention: Attention;
  children: React.ReactNode;
}

export const RescheduleAttentionDialog = ({
  attention,
  children,
}: RescheduleAttentionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newDateTime, setNewDateTime] = useState<Date | null>(
    new Date(attention.attention_datetime)
  );
  const [reason, setReason] = useState("");
  const [fault, setFault] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const rescheduleMutation = useRescheduleAttention();

  const newTime = newDateTime ? format(newDateTime, "HH:mm") : "";

  const handleDateChange = (date: Date | null) => {
    setNewDateTime((currentDateTime) => {
      if (!date) return null;
      const newDate = new Date(date);
      if (currentDateTime) {
        newDate.setHours(currentDateTime.getHours(), currentDateTime.getMinutes());
      }
      return newDate;
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setNewDateTime((currentDateTime) => {
      const datePart = currentDateTime || new Date();
      const [hours, minutes] = timeValue.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return currentDateTime;
      }
      return setHours(setMinutes(datePart, minutes), hours);
    });
  };

  const handleReschedule = () => {
    if (!newDateTime) {
      toast({
        title: "Error",
        description: "Debes seleccionar una nueva fecha y hora.",
        variant: "destructive",
      });
      return;
    }

    if (newDateTime.getTime() === new Date(attention.attention_datetime).getTime()) {
      toast({
        title: "Error",
        description: "La nueva fecha y hora no pueden ser las mismas que las actuales.",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Error",
        description: "Debes proporcionar un motivo para la reprogramación.",
        variant: "destructive",
      });
      return;
    }

    if (!fault) {
      toast({
        title: "Error",
        description: "Debes seleccionar el responsable de la reprogramación.",
        variant: "destructive",
      });
      return;
    }

    rescheduleMutation.mutate(
      {
        attentionId: attention.id,
        newDateTime,
        reason,
        fault,
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reprogramar Atención</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col space-y-2 h-20">
              <Label htmlFor="date">Nueva Fecha</Label>
              <DatePicker
                selected={newDateTime}
                onChange={handleDateChange}
                locale="es"
                dateFormat="dd/MM/yyyy"
                popperPlacement="bottom-start"
                customInput={<DatePickerButtonInput />}
                className="w-full"
                wrapperClassName="w-full"
              />
            </div>
            <div className="flex flex-col space-y-2 h-20">
              <Label htmlFor="time">Nueva Hora</Label>
              <Input
                id="time"
                type="time"
                value={newTime}
                onChange={handleTimeChange}
                required
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe el motivo de la reprogramación"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fault">Responsable</Label>
            <Select onValueChange={setFault} value={fault}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona al responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="establecimiento">Establecimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleReschedule}>Reprogramar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};