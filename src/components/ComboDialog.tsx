import { useState, useEffect, useMemo, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, ChevronsUpDown } from "lucide-react";
import { useCreateCombo, useUpdateCombo, Combo, ComboItem } from "@/hooks/useCombos";
import { useMasterProducts } from "@/hooks/useProducts";
import { useMasterServices } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Interfaz de props actualizada para un componente controlado
interface ComboDialogProps {
  combo?: Combo | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

// Tipo para un ítem seleccionable
type SelectableItem = {
  value: string;
  label: string;
  id: string;
  type: 'product' | 'service';
};

export const ComboDialog = ({ combo, isOpen, onOpenChange, onSuccess }: ComboDialogProps) => {
  const { toast } = useToast();

  // Estado del formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [items, setItems] = useState<Partial<ComboItem> & { name?: string }[]>([]);

  // Hooks de mutación
  const { mutate: createCombo, isPending: isCreating } = useCreateCombo();
  const { mutate: updateCombo, isPending: isUpdating } = useUpdateCombo();

  // Hooks para obtener productos y servicios
  const { data: products } = useMasterProducts("", true, "", "");
  const { data: services } = useMasterServices("", true, "");

  // Lista combinada de ítems seleccionables
  const selectableItems = useMemo<SelectableItem[]>(() => {
    const productItems = products?.map(p => ({ value: `product-${p.id}`, label: `[P] ${p.name}`, id: p.id, type: 'product' as const })) || [];
    const serviceItems = services?.map(s => ({ value: `service-${s.id}`, label: `[S] ${s.name}`, id: s.id, type: 'service' as const })) || [];
    return [...productItems, ...serviceItems];
  }, [products, services]);

  // Efecto para popular el formulario
  useEffect(() => {
    if (combo && isOpen) {
      setName(combo.name || "");
      setDescription(combo.description || "");
      setSku(combo.sku || "");
      const initialItems = combo.combo_items.map(item => ({
        ...item,
        name: item.product?.name || item.service?.name || 'Ítem desconocido'
      }));
      setItems(initialItems);
    } else {
      resetForm();
    }
  }, [combo, isOpen]);

  // Lógica de manejo de ítems
  const handleAddItem = (item: SelectableItem) => {
    const newItem: Partial<ComboItem> & { name?: string } = {
      product_id: item.type === 'product' ? item.id : null,
      service_id: item.type === 'service' ? item.id : null,
      quantity: 1,
      price: 0,
      name: item.label
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'price', value: number) => {
    const newItems = [...items];
    if (value >= 0) {
      newItems[index] = { ...newItems[index], [field]: value };
      setItems(newItems);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSku("");
    setItems([]);
  };

  const handleSuccess = () => {
    toast({ title: "Éxito", description: `Combo ${combo ? 'actualizado' : 'creado'} correctamente.` });
    onSuccess?.();
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Error", description: "El nombre del combo es requerido.", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
        toast({ title: "Error", description: "Un combo debe tener al menos un ítem.", variant: "destructive" });
        return;
    }

    const comboData = { name, description, sku, is_active: combo?.is_active ?? true };
    const finalItems = items.map(({ product_id, service_id, quantity, price }) => ({ product_id, service_id, quantity, price: price || 0 }));

    if (combo) {
      updateCombo({ id: combo.id, ...comboData, items: finalItems }, { onSuccess: handleSuccess });
    } else {
      createCombo({ ...comboData, items: finalItems }, { onSuccess: handleSuccess });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{combo ? "Editar Combo" : "Nuevo Combo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="name">Nombre del Combo</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Ítems del Combo</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  Añadir producto o servicio...
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar ítem..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron ítems.</CommandEmpty>
                    <CommandGroup>
                      {selectableItems.map((item) => (
                        <CommandItem key={item.value} onSelect={() => { handleAddItem(item); }}>
                          {item.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                  <div className="flex-grow font-medium text-sm">{item.name}</div>
                  <div className="w-20"><Label className="sr-only">Cantidad</Label><Input type="number" placeholder="Cant." value={item.quantity} onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value, 10))} min={1} /></div>
                  <div className="w-28"><Label className="sr-only">Precio</Label><Input type="number" placeholder="Precio" value={item.price} onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value))} min={0} step="0.01" /></div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreating || isUpdating}>{combo ? "Actualizar Combo" : "Crear Combo"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
