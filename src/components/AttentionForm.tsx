import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/useClients";
import { useBranchServicesAndCombos } from "@/hooks/useServices";
import { useBranchProducts } from "@/hooks/useProducts";
import { useCreateAttention } from "@/hooks/useAttentions";
import { useUpdateAttentionItems } from "@/hooks/useUpdateAttentionItems";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { FilterableSelect } from "./FilterableSelect";
import { debounce } from "@/lib/utils";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import { format, addMinutes, setHours, setMinutes, differenceInMinutes } from "date-fns";
import DatePickerButtonInput from "./DatePickerButtonInput";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import ItemFormCard, { ItemForm } from "./ItemFormCard";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { usePriceFormat } from "@/hooks/usePriceFormat";

import { useScreenSize } from "@/hooks/useScreenSize";

registerLocale("es", es);

interface AttentionFormProps {
  branchId?: string;
  onFinished: () => void;
  initialDate?: Date;
  attention?: any | null;
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

export const AttentionForm = ({ branchId, onFinished, initialDate, attention = null, screenSize }: AttentionFormProps) => {
  const { toast } = useToast();
  const isMobile = screenSize === 'mobile';
  const isEditMode = !!attention;
  const [clientId, setClientId] = useState(attention?.client_id || "");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [attentionDateTime, setAttentionDateTime] = useState<Date | null>(
    attention ? new Date(attention.attention_datetime) : initialDate || null
  );
  const [notes, setNotes] = useState(attention?.notes || "");
  const [items, setItems] = useState<ItemForm[]>([]);
  const [initialItems, setInitialItems] = useState<ItemForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletedServiceIds, setDeletedServiceIds] = useState<string[]>([]);
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>([]);
  const [deletedComboIds, setDeletedComboIds] = useState<string[]>([]);

  const { data: clients } = useClients(clientSearchTerm);
  const { data: branchServicesAndCombos } = useBranchServicesAndCombos(branchId);
  const { data: branchProducts } = useBranchProducts(branchId);
  const createAttentionMutation = useCreateAttention();
  const updateAttentionItemsMutation = useUpdateAttentionItems();
  const { tenantId } = useAuth(); // Get tenantId here
  const { formatPrice } = usePriceFormat();
  const debouncedSetClientSearchTerm = useMemo(() => debounce(setClientSearchTerm, 300), []);
  const { setBranchId } = useBranchFilterStore();

  useEffect(() => {
    if (isEditMode && attention) {
      setBranchId(attention.branch_id);

      const comboMap = new Map();

      const combos = (attention.attention_combos ?? []).map(c => {
        const comboItem = {
          id: c.id,
          type: 'combo' as const,
          item_id: c.combo_id,
          user_id: c.user_id,
          user_name: `${c.users?.first_name || ''} ${c.users?.last_name || ''}`.trim(),
          price: c.price,
          quantity: c.quantity || 1,
          notes: c.notes,
          item_name: c.combos?.name,
          is_existing: true,
          status: c.status,
          start_time: c.start_time,
          end_time: c.end_time,
          is_parallel: c.is_parallel,
          parallel_group_id: c.parallel_group_id,
          offset_minutes: c.offset_minutes,
          items: [], // Initialize with empty items
        };
        comboMap.set(c.id, comboItem);
        return comboItem;
      });

      const services = (attention.attention_services ?? []).map(s => ({
        id: s.id,
        type: 'service' as const,
        item_id: s.service_id,
        user_id: s.user_id,
        user_name: `${s.users?.first_name || ''} ${s.users?.last_name || ''}`.trim(),
        price: s.service_price,
        quantity: 1,
        duration: s.duration_minutes,
        notes: s.notes,
        item_name: s.services?.name,
        is_existing: true,
        status: s.status,
        start_time: s.start_time,
        end_time: s.end_time,
        is_parallel: s.is_parallel,
        parallel_group_id: s.parallel_group_id,
        offset_minutes: s.offset_minutes,
        attention_combo_id: s.attention_combo_id,
      }));

      const products = (attention.attention_products ?? []).map(p => ({
        id: p.id,
        type: 'product' as const,
        item_id: p.product_id,
        user_id: "", // Products don't have a direct user assignment
        commission_user_id: p.user_id, // user_id on attention_products is for commission
        price: p.unit_price,
        quantity: p.quantity,
        duration: 0,
        notes: p.notes || "",
        item_name: p.products?.name,
        is_existing: true,
        status: 'Finalizado' as const,
        start_time: "",
        end_time: "",
        is_parallel: false,
        parallel_group_id: null,
        offset_minutes: 0,
        attention_combo_id: p.attention_combo_id,
      }));

      const standaloneItems: ItemForm[] = [];

      for (const service of services) {
        if (service.attention_combo_id && comboMap.has(service.attention_combo_id)) {
          const combo = comboMap.get(service.attention_combo_id);
          if (combo) {
            combo.items.push(service);
          }
        } else {
          standaloneItems.push(service);
        }
      }

      for (const product of products) {
        if (product.attention_combo_id && comboMap.has(product.attention_combo_id)) {
          const combo = comboMap.get(product.attention_combo_id);
          if (combo) {
            combo.items.push(product);
          }
        } else {
          standaloneItems.push(product);
        }
      }

      // Calculate combo duration after populating items
      for (const combo of comboMap.values()) {
        combo.duration = combo.items.reduce((totalDuration, currentItem) => {
          if (currentItem.type === 'service') {
            return totalDuration + (currentItem.duration || 0);
          }
          return totalDuration;
        }, 0);
      }

      const allItems = [...combos, ...standaloneItems];
      console.log('Final items structure:', JSON.stringify(allItems, null, 2));
      setItems(allItems);
      setInitialItems(JSON.parse(JSON.stringify(allItems))); // Deep copy
    }
  }, [attention, isEditMode, setBranchId]);

  const attentionTime = useMemo(() => {
    return attentionDateTime ? format(attentionDateTime, 'HH:mm') : '';
  }, [attentionDateTime]);

  const handleDateChange = (date: Date | null) => {
    setAttentionDateTime(currentDateTime => {
      if (!date) return null;
      const newDateTime = new Date(date);
      if (currentDateTime) {
        newDateTime.setHours(currentDateTime.getHours(), currentDateTime.getMinutes());
      }
      return newDateTime;
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setAttentionDateTime(currentDateTime => {
      const datePart = currentDateTime || new Date();
      const [hours, minutes] = timeValue.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return currentDateTime;
      }
      return setHours(setMinutes(datePart, minutes), hours);
    });
  };

  const updateItem = useCallback((index: number, updates: Partial<ItemForm>) => {
    setItems(currentItems => {
        const newItems = [...currentItems];
        const currentItem = newItems[index];
        
        const updatedItem = { ...currentItem, ...updates };

        if ('item_id' in updates && (updatedItem.type === 'service' || updatedItem.type === 'combo')) {
          updatedItem.user_id = "";
        }

        newItems[index] = updatedItem;
        return newItems;
    });
  }, []);

  const addItem = (type: 'service' | 'product' | 'combo') => {
    setItems(prevItems => [...prevItems, {
      id: uuidv4(),
      type,
      item_id: "",
      user_id: "",
      commission_user_id: "",
      price: 0,
      quantity: 1,
      duration: 0, // Always start with 0, will be calculated on item selection
      notes: "",
      item_name: "",
      is_existing: false,
      status: 'Pendiente',
      start_time: "",
      end_time: "",
      is_parallel: false,
      parallel_group_id: null,
      offset_minutes: 0,
    }]);
  };

  const handleRemoveItem = (index: number) => {
    const itemToRemove = items[index];
    // This validation should only apply to services and combos
    if (itemToRemove.is_existing && (itemToRemove.type === 'service' || itemToRemove.type === 'combo') && itemToRemove.status !== 'Pendiente') {
      toast({
        title: "Acción no permitida",
        description: "No se puede eliminar un servicio o combo que no esté en estado 'Pendiente'.",
        variant: "warning",
      });
      return;
    }

    if (isEditMode && itemToRemove.is_existing) {
      switch (itemToRemove.type) {
        case 'service':
          setDeletedServiceIds(prev => [...prev, itemToRemove.id]);
          break;
        case 'product':
          setDeletedProductIds(prev => [...prev, itemToRemove.id]);
          break;
        case 'combo':
          setDeletedComboIds(prev => [...prev, itemToRemove.id]);
          break;
      }
    }

    setItems(items.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!attentionDateTime) return;

    const newItems = JSON.parse(JSON.stringify(items)); // Deep copy to avoid mutation issues
    let timelineEndTime = new Date(attentionDateTime);
    let lastSequentialItemStartTime = new Date(attentionDateTime);

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];

      if ((item.type !== 'service' && item.type !== 'combo') || item.status !== 'Pendiente') {
        continue;
      }

      let currentStartTime;

      if (item.is_parallel) {
        currentStartTime = addMinutes(lastSequentialItemStartTime, item.offset_minutes || 0);
      } else {
        currentStartTime = new Date(timelineEndTime);
        lastSequentialItemStartTime = currentStartTime;
      }

      item.start_time = format(currentStartTime, 'HH:mm');
      const endTime = addMinutes(currentStartTime, (item.duration || 0) * item.quantity);
      item.end_time = format(endTime, 'HH:mm');

      if (!item.is_parallel) {
        const groupEndTimes = [endTime];
        let j = i - 1;
        while (j >= 0 && newItems[j].is_parallel && (newItems[j].type === 'service' || newItems[j].type === 'combo')) {
          const prevItem = newItems[j];
          const [prevEndHours, prevEndMinutes] = prevItem.end_time.split(':').map(Number);
          if (!isNaN(prevEndHours) && !isNaN(prevEndMinutes)) {
            const prevEndTimeDate = setHours(setMinutes(new Date(attentionDateTime), prevEndMinutes), prevEndHours);
            groupEndTimes.push(prevEndTimeDate);
          }
          j--;
        }
        timelineEndTime = new Date(Math.max(...groupEndTimes.map(d => d.getTime())));
      }
    }

    if (JSON.stringify(newItems) !== JSON.stringify(items)) {
      setItems(newItems);
    }
  }, [items, attentionDateTime]);

  const totalDuration = useMemo(() => {
    if (!attentionDateTime || items.length === 0) {
      return 0;
    }

    const serviceItems = items.filter(item => (item.type === 'service' || item.type === 'combo') && item.end_time);

    if (serviceItems.length === 0) {
      return 0;
    }

    const endTimes = serviceItems.map(item => {
      const [hours, minutes] = item.end_time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }
      return setHours(setMinutes(new Date(attentionDateTime), minutes), hours);
    }).filter(date => date !== null) as Date[];

    if (endTimes.length === 0) {
      return 0;
    }

    const latestEndTime = new Date(Math.max(...endTimes.map(date => date.getTime())));

    const duration = differenceInMinutes(latestEndTime, attentionDateTime);
    return duration > 0 ? duration : 0;
  }, [items, attentionDateTime]);

  const finalEndTime = useMemo(() => {
    if (!attentionDateTime || items.length === 0) {
      return '--:--';
    }

    const serviceItems = items.filter(item => (item.type === 'service' || item.type === 'combo') && item.end_time);

    if (serviceItems.length === 0) {
      return '--:--';
    }

    const endTimes = serviceItems.map(item => {
      const [hours, minutes] = item.end_time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }
      return setHours(setMinutes(new Date(attentionDateTime), minutes), hours);
    }).filter(date => date !== null) as Date[];

    if (endTimes.length === 0) {
      return '--:--';
    }

    const latestEndTime = new Date(Math.max(...endTimes.map(date => date.getTime())));

    return format(latestEndTime, 'h:mm a');
  }, [items, attentionDateTime]);

  const totalValue = useMemo(() => {
    return items.reduce((acc, item) => {
      // item.price is base price, so we always multiply by quantity
      return acc + (item.price * item.quantity);
    }, 0);
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || !attentionDateTime || items.length === 0) {
      toast({ title: "Error", description: "Cliente, fecha, hora y al menos un item son requeridos.", variant: "destructive" });
      return;
    }

    const hasMissingUser = items.some(item => (item.type === 'service' || item.type === 'combo') && !item.user_id);
    if (hasMissingUser) {
      toast({ title: "Error", description: "Todos los servicios y combos deben tener un profesional asignado.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    if (isEditMode) {
      const servicesToUpsert = items
        .filter(i => i.type === 'service')
        .map(i => ({
          id: i.is_existing ? i.id : undefined,
          service_id: i.item_id,
          user_id: i.user_id,
          price: i.price,
          duration: i.duration,
          start_time: i.start_time,
          end_time: i.end_time,
          status: i.status,
          is_parallel: i.is_parallel,
          parallel_group_id: i.parallel_group_id,
          offset_minutes: i.offset_minutes,
          notes: i.notes,
        }));

      const productsToUpsert = items
        .filter(i => i.type === 'product')
        .map(i => ({
          id: i.is_existing ? i.id : undefined,
          product_id: i.item_id,
          quantity: i.quantity,
          unit_price: i.price,
          commission_user_id: i.commission_user_id || null,
        }));

      const combosToUpsert = items
        .filter(i => i.type === 'combo')
        .map(i => ({
          id: i.is_existing ? i.id : undefined,
          combo_id: i.item_id,
          user_id: i.user_id,
          price: i.price,
          quantity: i.quantity,
          duration: i.duration,
          start_time: i.start_time,
          end_time: i.end_time,
          status: i.status,
          is_parallel: i.is_parallel,
          parallel_group_id: i.parallel_group_id,
          offset_minutes: i.offset_minutes,
          notes: i.notes,
        }));

      try {
        await updateAttentionItemsMutation.mutateAsync({
          p_attention_id: attention.id,
          p_branch_id: attention.branch_id,
          p_services_to_upsert: servicesToUpsert,
          p_products_to_upsert: productsToUpsert,
          p_combos_to_upsert: combosToUpsert,
          p_service_ids_to_delete: deletedServiceIds,
          p_product_ids_to_delete: deletedProductIds,
          p_combo_ids_to_delete: deletedComboIds,
        });
        toast({ title: "Éxito", description: "Atención actualizada correctamente." });
        onFinished();
      } catch (error: any) {
        toast({ title: "Error al actualizar la atención", description: error.message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Create new attention logic
      const payload = {
        p_client_id: clientId,
        p_attention_datetime: attentionDateTime.toISOString(),
        p_notes: notes,
        p_branch_id: branchId,
        p_total_amount: totalValue,
        p_services: items.filter(i => i.type === 'service').map(i => ({ service_id: i.item_id, user_id: i.user_id, price: i.price * i.quantity, duration: i.duration, start_time: i.start_time, end_time: i.end_time, is_parallel: i.is_parallel, parallel_group_id: i.parallel_group_id, offset_minutes: i.offset_minutes, notes: i.notes })),
        p_products: items.filter(i => i.type === 'product').map(i => ({ product_id: i.item_id, quantity: i.quantity, unit_price: i.price, user_id: i.commission_user_id || null })),
        p_combos: items.filter(i => i.type === 'combo').map(i => ({ combo_id: i.item_id, user_id: i.user_id, price: i.price * i.quantity, quantity: i.quantity, notes: i.notes, is_parallel: i.is_parallel, parallel_group_id: i.parallel_group_id, offset_minutes: i.offset_minutes })),
      };

      try {
        await createAttentionMutation.mutateAsync(payload);
        toast({ title: "Éxito", description: "Atención creada correctamente." });
        onFinished();
      } catch (error: any) {
        toast({ title: "Error al crear atención", description: error.message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const clientOptions = clients?.map(client => ({ 
    value: client.id, 
    label: `${client.name} - ${client.phone} - ${client.email}`,
    shortLabel: client.name 
  })) || [];
  const isAttentionEditable = isEditMode ? !['Finalizada', 'Pagada', 'Cancelada'].includes(attention!.status) : true;

  return (
    <form id="attention-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
      <div className="space-y-2">
        <FilterableSelect
          label="Cliente"
          placeholder="Selecciona un cliente"
          options={clientOptions}
          value={clientId}
          onValueChange={setClientId}
          onSearch={debouncedSetClientSearchTerm}
          searchPlaceholder="Buscar por nombre, teléfono o email"
          disabled={isEditMode}
        />
      </div>
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 items-end`}>
        <div className="flex flex-col space-y-2 h-20">
          <Label htmlFor="date">Fecha</Label>
          <DatePicker
            selected={attentionDateTime}
            onChange={handleDateChange}
            locale="es"
            dateFormat="dd/MM/yyyy"
            popperPlacement="bottom-start"
            customInput={<DatePickerButtonInput />}
            className="w-full"
            wrapperClassName="w-full"
            disabled={isEditMode}
          />
        </div>
        <div className="flex flex-col space-y-2 h-20">
          <Label htmlFor="time">Hora</Label>
          <Input 
            id="time" 
            type="time" 
            value={attentionTime}
            onChange={handleTimeChange} 
            required 
            className="h-10" 
            disabled={isEditMode} 
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
          <Label>Items de la Atención</Label>
          {isAttentionEditable && (
            <div className="flex gap-2 flex-wrap">
              <Button type="button" onClick={() => addItem('service')} size="sm" variant="outline" disabled={!clientId || !attentionDateTime}><Plus className="w-4 h-4 mr-2" />Servicio</Button>
              <Button type="button" onClick={() => addItem('product')} size="sm" variant="outline" disabled={!clientId || !attentionDateTime}><Plus className="w-4 h-4 mr-2" />Producto</Button>
              <Button type="button" onClick={() => addItem('combo')} size="sm" variant="outline" disabled={!clientId || !attentionDateTime}><Plus className="w-4 h-4 mr-2" />Combo</Button>
            </div>
          )}
        </div>
        <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-3">
        {items.map((item, index) => (
            <ItemFormCard
                key={item.id}
                item={item}
                index={index}
                attentionDate={attentionDateTime ? format(attentionDateTime, 'yyyy-MM-dd') : ''}
                attentionTime={attentionTime}
                branchId={branchId}
                onUpdate={updateItem}
                onRemove={() => handleRemoveItem(index)}
                canRemove={items.length > 0}
                availableServicesAndCombos={branchServicesAndCombos || []}
                availableBranchProducts={branchProducts || []}
                isAttentionEditable={isAttentionEditable}
                tenantId={tenantId}
                screenSize={screenSize}
            />
        ))}
        </div>
      </div>

      <div className="p-3 bg-muted rounded-md text-sm space-y-1">
        <div className="flex justify-between">
          <span>Duración total de servicios:</span>
          <span className="font-semibold">{totalDuration} min</span>
        </div>
        <div className="flex justify-between">
          <span>Hora de finalización estimada:</span>
          <span className="font-semibold">{finalEndTime}</span>
        </div>
        <div className="flex justify-between">
          <span>Valor Total:</span>
          <span className="font-semibold">{formatPrice(totalValue)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas de la Atención</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <DialogFooter className="fixed bottom-0 right-0 w-full bg-background pt-4 pb-4 pr-6">
        <Button type="button" variant="outline" onClick={onFinished}>Cancelar</Button>
        <Button type="submit" form="attention-form" disabled={isSubmitting || createAttentionMutation.isPending || updateAttentionItemsMutation.isPending || !clientId || !attentionDateTime || items.length === 0}>
          {isEditMode ? 'Guardar Cambios' : 'Crear Atención'}
        </Button>
      </DialogFooter>
    </form>
  );
};