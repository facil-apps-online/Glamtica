
import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';

// Registrar el locale en español para que los nombres de los meses y días aparezcan correctamente
registerLocale('es', es);

interface DatePickerWrapperProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
}

export const DatePickerWrapper = ({ selected, onChange, className }: DatePickerWrapperProps) => {
  const CustomInput = React.forwardRef<HTMLInputElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <div className="relative w-full">
        <Input
          value={value}
          onClick={onClick}
          ref={ref}
          readOnly
          placeholder="Seleccionar fecha"
          className={cn("pl-3 text-left font-normal", className)}
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
      </div>
    )
  );

  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      locale="es"
      dateFormat="PPP"
      customInput={<CustomInput />}
      wrapperClassName="w-full"
    />
  );
};
