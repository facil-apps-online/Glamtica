import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format, parse } from "date-fns";

interface DatePickerButtonInputProps {
  value?: string;
  onClick?: () => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const DatePickerButtonInput = React.forwardRef<HTMLButtonElement, DatePickerButtonInputProps>(
  ({ value, onClick, onChange, disabled }, ref) => {
    const parsedDate = value ? parse(value, "dd/MM/yyyy", new Date()) : null;
    const displayValue = parsedDate && !isNaN(parsedDate.getTime()) ? format(parsedDate, "dd/MM/yyyy") : "Seleccionar fecha";

    return (
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        ref={ref}
        className="w-full justify-between h-10 flex items-center"
        disabled={disabled}
      >
        {displayValue}
        <Calendar className="ml-2 h-4 w-4 opacity-50" />
      </Button>
    );
  }
);

DatePickerButtonInput.displayName = "DatePickerButtonInput";

export default DatePickerButtonInput;