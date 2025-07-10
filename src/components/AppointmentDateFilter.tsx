
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAttentionDates } from "@/hooks/useAttentions";

interface AppointmentDateFilterProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedStylistId?: string;
}

export const AppointmentDateFilter = ({ 
  selectedDate, 
  onDateChange, 
  selectedStylistId 
}: AppointmentDateFilterProps) => {
  const { data: attentionDates } = useAttentionDates(selectedStylistId);

  const getDateStatus = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const statuses = attentionDates?.[dateString] || [];
    
    // Priorizar estados: En Proceso > Confirmada > Completada
    if (statuses.includes('En Proceso')) {
      return 'in-progress';
    }
    if (statuses.includes('Confirmada')) {
      return 'pending';
    }
    if (statuses.includes('Completada')) {
      return 'completed';
    }
    return null;
  };

  const modifiers = {
    pending: (date: Date) => getDateStatus(date) === 'pending',
    'in-progress': (date: Date) => getDateStatus(date) === 'in-progress',
    completed: (date: Date) => getDateStatus(date) === 'completed',
  };

  const modifiersStyles = {
    pending: {
      backgroundColor: '#dbeafe', // Azul claro para confirmadas
      color: '#1e40af',
      fontWeight: 'bold',
    },
    'in-progress': {
      backgroundColor: '#fef3c7', // Amarillo para en proceso
      color: '#92400e',
      fontWeight: 'bold',
    },
    completed: {
      backgroundColor: '#d1fae5', // Verde para completadas
      color: '#065f46',
      fontWeight: 'bold',
    },
  };

  // Para filtros de atenciones, no restringimos fechas pasadas
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Fecha
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP", { locale: es })
            ) : (
              <span>Selecciona una fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            // Sin restricción de fechas para filtrar atenciones
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            locale={es}
          />
          <div className="p-3 border-t text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 bg-blue-200 rounded border"></div>
              <span>Atenciones confirmadas</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 bg-yellow-200 rounded border"></div>
              <span>Atenciones en proceso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded border"></div>
              <span>Atenciones completadas</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
