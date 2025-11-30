import * as React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"; // Import DrawerHeader and DrawerTitle
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface Option {
  value: string;
  label: string;
  shortLabel?: string;
}

interface FilterableSelectProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  onSearch?: (value: string) => void;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export const FilterableSelect = (props: FilterableSelectProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return <DesktopSelect {...props} />;
  }

  return <MobileSelect {...props} />;
};

function DesktopSelect({
  label,
  placeholder = "Seleccionar...",
  options,
  value,
  onValueChange,
  onSearch,
  emptyText = "No se encontraron opciones",
  searchPlaceholder = "Buscar...",
  className,
  disabled = false,
  isLoading = false,
}: FilterableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(() => 
    options.find(option => option.value === value),
    [options, value]
  );

  const handleSelect = React.useCallback((selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    if (onSearch) onSearch("");
  }, [onValueChange, onSearch]);

  const popoverContent = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex-1 text-left min-w-0">
            <span className="truncate">
              {selectedOption ? (selectedOption.shortLabel || selectedOption.label) : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearch}
          />
          <CommandEmpty>{isLoading ? "Buscando..." : emptyText}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
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
                <span className="truncate">{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (!label) {
    return popoverContent;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {popoverContent}
    </div>
  );
}

function MobileSelect({
  label,
  placeholder = "Seleccionar...",
  options,
  value,
  onValueChange,
  onSearch,
  emptyText = "No se encontraron opciones",
  searchPlaceholder = "Buscar...",
  className,
  disabled = false,
  isLoading = false,
}: FilterableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(() => 
    options.find(option => option.value === value),
    [options, value]
  );

  const handleSelect = React.useCallback((selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    if (onSearch) onSearch("");
  }, [onValueChange, onSearch]);

  const drawerContent = (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex-1 text-left min-w-0">
            <span className="truncate">
              {selectedOption ? (selectedOption.shortLabel || selectedOption.label) : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="sr-only">{label || placeholder}</DrawerTitle>
        </DrawerHeader>
        <div className="mt-4 border-t">
          <Command shouldFilter={!onSearch}>
            <CommandInput
              placeholder={searchPlaceholder}
              onValueChange={onSearch}
            />
            <CommandEmpty>{isLoading ? "Buscando..." : emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
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
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>
      </DrawerContent>
    </Drawer>
  );

  if (!label) {
    return drawerContent;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {drawerContent}
    </div>
  );
}