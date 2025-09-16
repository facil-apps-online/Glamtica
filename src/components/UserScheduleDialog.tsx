import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Save } from "lucide-react";
import { useUserSchedules, useUpdateUserSchedule } from "@/hooks/useUserSchedules";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { TenantUserAssignment } from "@/hooks/useTenantUsers";

interface UserScheduleDialogProps {
  userId: string;
  userName: string;
  trigger?: React.ReactNode;
  targetUserAssignments: TenantUserAssignment[];
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
    tenant_id: string;
    branch_id: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    day_label: string;
}

interface UserSchedulesByBranch {
  [branchId: string]: Schedule[];
}

// Helper function for deep comparison
const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
};

export const UserScheduleDialog = ({ userId, userName, trigger, targetUserAssignments = [] }: UserScheduleDialogProps) => {
  const [open, setOpen] = useState(false);
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const activeBranches = useMemo(() => {
    const branchesMap = new Map<string, { id: string; name: string }>();
    targetUserAssignments.forEach(assignment => {
      if (assignment.tenant_id === tenantId && assignment.branch_id && assignment.branch_name) {
        branchesMap.set(assignment.branch_id, { id: assignment.branch_id, name: assignment.branch_name });
      }
    });
    return Array.from(branchesMap.values());
  }, [targetUserAssignments, tenantId]);

  const { data: existingSchedules, isLoading: isLoadingHook } = useUserSchedules(userId, tenantId);
  const updateScheduleMutation = useUpdateUserSchedule();
  const { toast } = useToast();

  const [schedulesByBranch, setSchedulesByBranch] = useState<UserSchedulesByBranch>({});
  const isInitialized = useRef(false); // Para controlar la inicialización

  useEffect(() => {
    if (existingSchedules && tenantId && !isLoadingHook && !isInitialized.current) {
      const newSchedulesByBranch: UserSchedulesByBranch = {};

      activeBranches.forEach(branch => {
        const branchSchedules = existingSchedules.filter(s => s.branch_id === branch.id);
        const scheduleMap = branchSchedules.reduce((acc, schedule) => {
          acc[schedule.day_of_week] = schedule;
          return acc;
        }, {} as Record<number, any>);

        newSchedulesByBranch[branch.id] = DAYS_OF_WEEK.map(day => {
          const existingSchedule = scheduleMap[day.value];
          return {
            id: existingSchedule?.id || null,
            user_id: userId,
            tenant_id: tenantId,
            branch_id: branch.id,
            day_of_week: day.value,
            start_time: existingSchedule?.start_time || '09:00',
            end_time: existingSchedule?.end_time || '18:00',
            is_active: existingSchedule?.is_active || false,
            day_label: day.label,
          };
        });
      });

      setSchedulesByBranch(newSchedulesByBranch);
      isInitialized.current = true; // Marcar como inicializado
    }
  }, [existingSchedules, userId, tenantId, activeBranches, isLoadingHook]); // Eliminar schedulesByBranch de las dependencias

  const isLoadingSchedules = isLoadingHook || !tenantId || (activeBranches.length > 0 && Object.keys(schedulesByBranch).length === 0);

  const handleScheduleChange = (branchId: string, dayOfWeek: number, field: keyof Schedule, value: string | boolean) => {
    setSchedulesByBranch(prev => ({
      ...prev,
      [branchId]: prev[branchId].map(schedule => 
        schedule.day_of_week === dayOfWeek 
          ? { ...schedule, [field]: value }
          : schedule
      )
    }));
  };

  const handleSave = async () => {
    try {
      for (const branchId in schedulesByBranch) {
        const schedulesToSave = schedulesByBranch[branchId].filter(schedule => 
          schedule.is_active || schedule.id
        );

        for (const schedule of schedulesToSave) {
          await updateScheduleMutation.mutateAsync({
            user_id: schedule.user_id,
            tenant_id: schedule.tenant_id,
            branch_id: schedule.branch_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_active: schedule.is_active,
          });
        }
      }

      toast({
        title: "Horarios guardados",
        description: "Los horarios han sido actualizados exitosamente.",
        variant: "success",
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
    const summaries: string[] = [];
    for (const branchId in schedulesByBranch) {
      const branchSchedules = schedulesByBranch[branchId];
      const activeSchedules = branchSchedules.filter(s => s.is_active);
      if (activeSchedules.length > 0) {
        const branchName = activeBranches.find(b => b.id === branchId)?.name || `Sucursal ${branchId.substring(0, 4)}`;
        const dailySummaries = activeSchedules.map(s => 
          `${s.day_label}: ${s.start_time.slice(0,5)} - ${s.end_time.slice(0,5)}`
        ).join(', ');
        summaries.push(`${branchName}: ${dailySummaries}`);
      }
    }
    return summaries.length > 0 ? summaries.join('; ') : "Sin horarios configurados";
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

        {isLoadingSchedules ? (
          <div className="text-center py-8">Cargando horarios...</div>
        ) : (
          <div className="space-y-4">
            {activeBranches.length === 0 && (
              <p className="text-center text-muted-foreground">Este usuario no tiene sucursales asignadas.</p>
            )}
            {activeBranches.map(branch => (
              <Accordion type="single" collapsible className="w-full" key={branch.id}>
                <AccordionItem value={branch.id}>
                  <AccordionTrigger className="hover:bg-gray-50 px-4 py-4 text-left hover:no-underline">
                    <h3 className="font-semibold">{branch.name}</h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4">
                      {schedulesByBranch[branch.id]?.map((schedule) => (
                        <Card key={schedule.day_of_week}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{schedule.day_label}</h3>
                              <Switch
                                checked={schedule.is_active}
                                onCheckedChange={(checked) => 
                                  handleScheduleChange(branch.id, schedule.day_of_week, 'is_active', checked)
                                }
                              />
                            </div>
                            {schedule.is_active && (
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`start-${branch.id}-${schedule.day_of_week}`}>Inicio</Label>
                                  <Input
                                    id={`start-${branch.id}-${schedule.day_of_week}`}
                                    type="time"
                                    value={schedule.start_time}
                                    onChange={(e) => 
                                      handleScheduleChange(branch.id, schedule.day_of_week, 'start_time', e.target.value)
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`end-${branch.id}-${schedule.day_of_week}`}>Fin</Label>
                                  <Input
                                    id={`end-${branch.id}-${schedule.day_of_week}`}
                                    type="time"
                                    value={schedule.end_time}
                                    onChange={(e) => 
                                      handleScheduleChange(branch.id, schedule.day_of_week, 'end_time', e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={updateScheduleMutation.isPending || activeBranches.length === 0}>
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