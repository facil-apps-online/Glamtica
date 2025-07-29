
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Save } from "lucide-react";
import { useUserSchedules, useUpdateUserSchedule } from "@/hooks/useUserSchedules";
import { useToast } from "@/hooks/use-toast";

interface UserScheduleDialogProps {
  userId: string;
  userName: string;
  trigger?: React.ReactNode;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

interface Schedule {
    id?: string | null;
    user_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    day_label: string;
}

export const UserScheduleDialog = ({ userId, userName, trigger }: UserScheduleDialogProps) => {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const { data: existingSchedules, isLoading } = useUserSchedules(userId);
  const updateScheduleMutation = useUpdateUserSchedule();
  const { toast } = useToast();

  useEffect(() => {
    if (existingSchedules) {
      const scheduleMap = existingSchedules.reduce((acc, schedule) => {
        acc[schedule.day_of_week] = schedule;
        return acc;
      }, {} as Record<number, any>);

      const allDaySchedules = DAYS_OF_WEEK.map(day => {
        const existingSchedule = scheduleMap[day.value];
        return {
          id: existingSchedule?.id || null,
          user_id: userId,
          day_of_week: day.value,
          start_time: existingSchedule?.start_time || '09:00',
          end_time: existingSchedule?.end_time || '18:00',
          is_active: existingSchedule?.is_active || false,
          day_label: day.label,
        };
      });

      setSchedules(allDaySchedules);
    }
  }, [existingSchedules, userId]);

  const handleScheduleChange = (dayOfWeek: number, field: keyof Schedule, value: string | boolean) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.day_of_week === dayOfWeek 
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  };

  const handleSave = async () => {
    try {
      const schedulesToSave = schedules.filter(schedule => 
        schedule.is_active || schedule.id
      );

      for (const schedule of schedulesToSave) {
        await updateScheduleMutation.mutateAsync({
          user_id: schedule.user_id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_active: schedule.is_active,
        });
      }

      toast({
        title: "Horarios guardados",
        description: "Los horarios han sido actualizados exitosamente.",
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los horarios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getScheduleSummary = () => {
    const activeSchedules = schedules.filter(s => s.is_active);
    if (activeSchedules.length === 0) return "Sin horarios configurados";
    
    return activeSchedules.map(s => 
      `${s.day_label}: ${s.start_time.slice(0,5)} - ${s.end_time.slice(0,5)}`
    ).join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Horarios
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horarios de Trabajo - {userName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Cargando horarios...</div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.day_of_week}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{schedule.day_label}</h3>
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={(checked) => 
                        handleScheduleChange(schedule.day_of_week, 'is_active', checked)
                      }
                    />
                  </div>
                  {schedule.is_active && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor={`start-${schedule.day_of_week}`}>Inicio</Label>
                        <Input
                          id={`start-${schedule.day_of_week}`}
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => 
                            handleScheduleChange(schedule.day_of_week, 'start_time', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`end-${schedule.day_of_week}`}>Fin</Label>
                        <Input
                          id={`end-${schedule.day_of_week}`}
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => 
                            handleScheduleChange(schedule.day_of_week, 'end_time', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={updateScheduleMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateScheduleMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
