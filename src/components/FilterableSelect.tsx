import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface FilterableSelectProps {
  label?: string; // <-- Made optional
  placeholder?: string;
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  emptyText?: string;
  searchPlaceholder?: string;
}

export const FilterableSelect = ({
  label,
  placeholder = "Seleccionar...",
  options,
  value,
  onValueChange,
  emptyText = "No se encontraron opciones",
  searchPlaceholder = "Buscar..."
}: FilterableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedOption = useMemo(() => 
    options.find(option => option.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      option.value.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue === value ? "" : selectedValue);
    setOpen(false);
    setSearchValue(""); // Limpiar búsqueda al seleccionar
  };

  const popoverContent = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup>
            <CommandList className="max-h-[200px] overflow-y-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );

  // If no label, return only the popover. Otherwise, wrap it with the label.
  if (!label) {
    return popoverContent;
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {popoverContent}
    </div>
  );
};