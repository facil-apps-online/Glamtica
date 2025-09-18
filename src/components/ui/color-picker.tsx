import React from 'react';
import { Input } from '@/components/ui/input';

interface ColorPickerProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(({ value, ...props }, ref) => {
  return (
    <div className="flex items-center gap-2 border rounded-md pr-2">
      <Input
        type="color"
        value={value}
        className="w-10 h-10 p-1 border-none bg-transparent cursor-pointer"
        {...props}
        ref={ref}
      />
      <span className="font-mono text-sm">{String(value).toUpperCase()}</span>
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';
