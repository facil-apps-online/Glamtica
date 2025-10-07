import React from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface TimePickerButtonInputProps {
  value?: string;
  onClick?: () => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const TimePickerButtonInput = React.forwardRef<HTMLButtonElement, TimePickerButtonInputProps>(
  ({ value, onClick, onChange, disabled }, ref) => {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        ref={ref}
        className="w-full justify-between h-10 flex items-center"
        disabled={disabled}
      >
        {value || "Seleccionar hora"}
        <Clock className="ml-2 h-4 w-4 opacity-50" />
      </Button>
    );
  }
);

TimePickerButtonInput.displayName = "TimePickerButtonInput";

export default TimePickerButtonInput;