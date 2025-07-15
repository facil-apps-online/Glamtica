import { DatePickerWrapper } from "@/components/ui/DatePicker"; // Importar el nuevo componente
import { useAttentionDates } from "@/hooks/useAttentions";
import { format } from "date-fns";

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
    
    if (statuses.includes('En Proceso')) return 'in-progress';
    if (statuses.includes('Confirmada')) return 'pending';
    if (statuses.includes('Completada')) return 'completed';
    return null;
  };

  const dayClassName = (date: Date) => {
    const status = getDateStatus(date);
    if (status === 'in-progress') return 'bg-yellow-200 text-yellow-800';
    if (status === 'pending') return 'bg-blue-200 text-blue-800';
    if (status === 'completed') return 'bg-green-200 text-green-800';
    return '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Fecha
      </label>
      <DatePickerWrapper
        selected={selectedDate}
        onChange={(date) => date && onDateChange(date)}
        dayClassName={dayClassName}
      />
      <div className="p-1 text-xs text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 rounded-full border"></div>
          <span>Confirmadas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-200 rounded-full border"></div>
          <span>En Proceso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-200 rounded-full border"></div>
          <span>Completadas</span>
        </div>
      </div>
    </div>
  );
};