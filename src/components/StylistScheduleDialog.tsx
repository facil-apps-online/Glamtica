
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Save } from "lucide-react";
import { useStylistSchedules, useUpdateStylistSchedule } from "@/hooks/useStylistSchedules";
import { useToast } from "@/hooks/use-toast";

interface StylistScheduleDialogProps {
  stylistId: string;
  stylistName: string;
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

export const StylistScheduleDialog = ({ stylistId, stylistName, trigger }: StylistScheduleDialogProps) => {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]); // Use the new Schedule interface
  
  const { data: existingSchedules, isLoading } = useStylistSchedules(stylistId);
  const updateScheduleMutation = useUpdateStylistSchedule();
  const { toast } = useToast();

  useEffect(() => {
    if (existingSchedules) {
      // Crear un mapa de horarios existentes
      const scheduleMap = existingSchedules.reduce((acc, schedule) => {
        acc[schedule.day_of_week] = schedule;
        return acc;
      }, {} as Record<number, Schedule>); // Use Record<number, Schedule> for the map

      // Crear horarios para todos los días de la semana
      const allDaySchedules = DAYS_OF_WEEK.map(day => {
        const existingSchedule = scheduleMap[day.value];
        return {
          id: existingSchedule?.id || null,
          stylist_id: stylistId,
          day_of_week: day.value,
          start_time: existingSchedule?.start_time || '09:00',
          end_time: existingSchedule?.end_time || '18:00',
          is_active: existingSchedule?.is_active || false,
          day_label: day.label,
        };
      });

      setSchedules(allDaySchedules);
    }
  }, [existingSchedules, stylistId]);

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
      // Guardar solo los horarios que están activos o que ya existían
      const schedulesToSave = schedules.filter(schedule => 
        schedule.is_active || schedule.id
      );

      for (const schedule of schedulesToSave) {
        await updateScheduleMutation.mutateAsync({
          id: schedule.id,
          stylist_id: schedule.stylist_id,
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
            Horarios de Trabajo - {stylistName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Cargando horarios...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Horarios actuales:</strong> {getScheduleSummary()}
              </p>
            </div>

            {schedules.map((schedule) => (
              <Card key={schedule.day_of_week} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900">{schedule.day_label}</h3>
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) => 
                          handleScheduleChange(schedule.day_of_week, 'is_active', checked)
                        }
                      />
                      <span className="text-sm text-slate-600">
                        {schedule.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  
                  {schedule.is_active && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`start-${schedule.day_of_week}`}>
                          Hora de inicio
                        </Label>
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
                        <Label htmlFor={`end-${schedule.day_of_week}`}>
                          Hora de fin
                        </Label>
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateScheduleMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateScheduleMutation.isPending ? 'Guardando...' : 'Guardar Horarios'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
