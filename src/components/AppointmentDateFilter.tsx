import { DatePickerWrapper } from "@/components/ui/DatePicker";
import { useAttentionDates } from "@/hooks/useAttentions";
import { format } from "date-fns";

interface AppointmentDateFilterProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedUserId?: string;
}

export const AppointmentDateFilter = ({ 
  selectedDate, 
  onDateChange, 
  selectedUserId 
}: AppointmentDateFilterProps) => {
  const { data: attentionDates } = useAttentionDates(selectedUserId);

  const dayClassName = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const statuses = attentionDates?.[dateString] || [];
    
    if (statuses.includes('En Proceso')) return 'bg-yellow-200 text-yellow-800';
    if (statuses.includes('Confirmada')) return 'bg-blue-200 text-blue-800';
    if (statuses.includes('Completada')) return 'bg-green-200 text-green-800';
    return '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Fecha</label>
      <DatePickerWrapper
        selected={selectedDate}
        onChange={onDateChange}
        dayClassName={dayClassName}
      />
      <div className="p-1 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-200 rounded-full"></div><span>Confirmadas</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-200 rounded-full"></div><span>En Proceso</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-200 rounded-full"></div><span>Completadas</span></div>
      </div>
    </div>
  );
};