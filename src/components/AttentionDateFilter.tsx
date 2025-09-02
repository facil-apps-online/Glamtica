import { useAttentionDates } from "@/hooks/useAttentions";
import { format } from "date-fns";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import { Label } from "@/components/ui/label";
import DatePickerButtonInput from "./DatePickerButtonInput";

registerLocale("es", es);

interface AttentionDateFilterProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedUserId?: string;
}

export const AttentionDateFilter = ({
  selectedDate,
  onDateChange,
  selectedUserId
}: AttentionDateFilterProps) => {
  const { data: attentionDates } = useAttentionDates(selectedUserId);

  const dayClassName = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const statuses = attentionDates?.[dateString] || new Set();

    if (statuses.has('En Proceso')) return 'bg-yellow-200 text-yellow-800';
    if (statuses.has('Confirmada')) return 'bg-blue-200 text-blue-800';
    if (statuses.has('Finalizada')) return 'bg-green-200 text-green-800';
    return '';
  };

  const renderDayContents = (day: number, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const statuses = attentionDates?.[dateString] || new Set();
    const tooltipText = Array.from(statuses).join(', ');

    return (
      <span title={tooltipText}>
        {day}
      </span>
    );
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label>Fecha</Label>
      <div className="flex w-full">
        <DatePicker
          selected={selectedDate}
          onChange={onDateChange}
          locale="es"
          dateFormat="dd/MM/yyyy"
          popperPlacement="bottom-start"
          popperClassName="z-50"
          customInput={<DatePickerButtonInput />}
          className="w-full"
          style={{ width: '100%' }}
          wrapperClassName="w-full"
          dayClassName={dayClassName}
          renderDayContents={renderDayContents}
        />
      </div>
    </div>
  );
};