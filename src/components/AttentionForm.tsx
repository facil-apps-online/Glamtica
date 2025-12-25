import { useState, useMemo, useEffect, useCallback, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { invokeTenantAction } from "@/hooks/useTenantUsers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/useClients";
import { useBranchServicesAndCombos } from "@/hooks/useServices";
import { useBranchProducts } from "@/hooks/useProducts";
import { useCreateAttention, useConfirmAttention } from "@/hooks/useAttentions";
import { useUpdateAttentionItems } from "@/hooks/useUpdateAttentionItems";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, Plus, Clock } from "lucide-react";
import { useClientTreatments } from "@/hooks/useTreatments";
import { FilterableSelect } from "./FilterableSelect";
import { debounce } from "@/lib/utils";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import { format, addMinutes, setHours, setMinutes, differenceInMinutes } from "date-fns";
import DatePickerButtonInput from "./DatePickerButtonInput";
import TimePickerButtonInput from "./TimePickerButtonInput";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import ItemFormCard, { ItemForm } from "./ItemFormCard";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useScreenSize } from "@/hooks/useScreenSize";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { usePaymentEvidence } from "@/hooks/usePaymentEvidence";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignConsentDialog } from "./dialogs/AssignConsentDialog";
import { useSignedConsentsForAttention } from "@/hooks/useConsentTemplates";
import { AddTreatmentSessionDialog } from "./treatments/AddTreatmentSessionDialog";

registerLocale("es", es);

interface AttentionFormProps {
  branchId?: string;
  onFinished: () => void;
  initialDate?: Date;
  attention?: any | null;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

// MODIFICACIÓN: Componente interno para manejar la lógica de la vista previa
const EvidencePreview: React.FC<{ paymentIds: string[]; isOpen: boolean; onClose: () => void; }> = ({ paymentIds, isOpen, onClose }) => {
  const { data: evidences, isLoading } = usePaymentEvidence(paymentIds);

  const imageUrls = evidences?.map(e => e.google_drive_file_id) || [];

  if (isLoading) return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded">Cargando evidencias...</div>
      </div>
  );

  if (!isLoading && isOpen && imageUrls.length === 0) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sin Evidencia</DialogTitle>
          </DialogHeader>
          <p>No se encontró evidencia de pago para esta transacción.</p>
          <DialogFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ImagePreviewDialog
      isOpen={isOpen && imageUrls.length > 0}
      onClose={onClose}
      imageUrls={imageUrls}
    />
  );
};

const TimePickerButton = forwardRef<
  HTMLButtonElement,
  {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
  }
>(({ value, onClick, disabled }, ref) => {
  const displayValue = value || "Seleccionar hora";
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
      <Clock className="ml-2 h-4 w-4 opacity-50" />
    </Button>
  );
});
TimePickerButton.displayName = "TimePickerButton";


export const AttentionForm = ({ branchId, onFinished, initialDate, attention = null, screenSize }: AttentionFormProps) => {
  const { toast } = useToast();

  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const isEditMode = !!attention;

  // --- State Declarations ---
  const [clientId, setClientId] = useState(attention?.clients?.id || "");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
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
  const [viewingPaymentIds, setViewingPaymentIds] = useState<string[] | null>(null);


  // --- Debounced Search Term Setters ---
  const debouncedSetClientSearchTerm = useMemo(() => debounce(setClientSearchTerm, 300), []);
  const debouncedSetItemSearchTerm = useMemo(() => debounce(setItemSearchTerm, 300), []);

  // --- Data Fetching Hooks ---
  const { data: clientTreatments, isLoading: isLoadingClientTreatments } = useClientTreatments(clientId);
  const { data: clients } = useClients(clientSearchTerm);
  const { data: branchServicesAndCombos, isLoading: isLoadingItems } = useBranchServicesAndCombos(branchId, itemSearchTerm);
  const { data: branchProducts } = useBranchProducts(branchId, itemSearchTerm);
  const createAttentionMutation = useCreateAttention();
  const updateAttentionItemsMutation = useUpdateAttentionItems();
  const confirmAttentionMutation = useConfirmAttention();
  const { data: availablePaymentMethods } = usePaymentMethods(attention?.tenant_id);
  const { data: signedConsents, isLoading: isLoadingSignedConsents } = useSignedConsentsForAttention(attention?.id); // ADD THIS LINE

  
  // --- Context and Other Hooks ---
  const { tenantId, currentAssignment } = useAuth();
  const userRole = currentAssignment?.role_name;
  const { formatPrice } = usePriceFormat();
  const { setBranchId } = useBranchFilterStore();

  // --- Fetch Sales Settings ---
  const { data: salesSettings, isLoading: isLoadingSalesSettings } = useQuery({
    queryKey: ['salesSettings', tenantId],
    queryFn: () => invokeTenantAction('get_sales_settings', { tenantId }),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (isEditMode && attention) {
      setBranchId(attention.branch_id);

      const comboMap = new Map();

                const combos = (attention.attention_combos ?? []).map(c => {
                  const comboItem = {
                    id: c.id,
                    type: 'combo' as const,
                    item_id: c.combo_id,
                    // user_id: c.user_id, // Removed as per user clarification
                    user_name: `${c.users?.first_name || ''} ${c.users?.last_name || ''}`.trim(),
                    price: c.price,
                    quantity: c.quantity || 1,
                    notes: c.notes || '', // Fallback to empty string
                    item_name: c.combos?.name,
                    is_existing: true,
                    status: c.status,
                    start_time: c.start_time || '', // Fallback to empty string
                    end_time: c.end_time || '', // Fallback to empty string
                    is_parallel: c.is_parallel || false, // Fallback to false
                    parallel_group_id: c.parallel_group_id || null, // Fallback to null
                    offset_minutes: c.offset_minutes || 0, // Fallback to 0
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
        status_history: s.status_history,
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

      const explicitItems = [...combos, ...standaloneItems];
      const explicitItemsTotal = explicitItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      const treatmentAmount = (attention.total_amount || 0) - explicitItemsTotal;

      let allItems = explicitItems;

      if (treatmentAmount > 0.01) { // Use a small threshold for floating point issues
        const treatmentPaymentItem: ItemForm = {
          id: uuidv4(),
          type: 'payment',
          item_id: 'treatment-payment-calculated',
          item_name: 'Cobro de Tratamiento(s)',
          price: treatmentAmount,
          quantity: 1,
          is_existing: true, // Treat as existing to prevent easy editing/deletion
          status: 'Pendiente',
          user_id: '',
          start_time: '',
          end_time: '',
          is_parallel: false,
          parallel_group_id: null,
          offset_minutes: 0,
          is_treatment_session_item: true, // Mark as part of a treatment
        };
        allItems = [...explicitItems, treatmentPaymentItem];
      }
      
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

  const handleTimeChange = (date: Date | null) => {
    setAttentionDateTime(currentDateTime => {
      if (!date) return null;
      const newDateTime = new Date(date);
      if (currentDateTime) {
        newDateTime.setDate(currentDateTime.getDate());
        newDateTime.setMonth(currentDateTime.getMonth());
        newDateTime.setFullYear(currentDateTime.getFullYear());
      }
      return newDateTime;
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
      items: [],
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

    const newItems = JSON.parse(JSON.stringify(items));
    let lastSequentialItemStartTime = new Date(attentionDateTime);

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      
      if (item.type === 'product' || item.type === 'payment') continue;

      let currentItemStartTime;

      if (item.is_parallel) {
        // An parallel item always calculates from the start time of the last SEQUENTIAL item.
        currentItemStartTime = addMinutes(lastSequentialItemStartTime, item.offset_minutes || 0);
      } else {
        // A sequential item cannot start until all previous items (including parallels) have finished.
        // We calculate the actual end of the previous "group" before assigning the start time.
        let timelineEndTime = new Date(attentionDateTime);
        const previousItems = newItems.slice(0, i);
        const previousEndTimes = previousItems
          .filter(p => p.end_time && (p.type === 'service' || p.type === 'combo'))
          .map(p => {
            const [h, m] = p.end_time.split(':').map(Number);
            return setHours(setMinutes(new Date(attentionDateTime), m), h);
          });
        
        if (previousEndTimes.length > 0) {
            timelineEndTime = new Date(Math.max(...previousEndTimes.map(d => d.getTime())));
        }

        currentItemStartTime = new Date(timelineEndTime);
        lastSequentialItemStartTime = currentItemStartTime; // This is a new sequential item, so it's the new reference
      }

      item.start_time = format(currentItemStartTime, 'HH:mm');
      const itemEndTime = addMinutes(currentItemStartTime, (item.duration || 0) * item.quantity);
      item.end_time = format(itemEndTime, 'HH:mm');

      // If it's a combo, calculate sub-item times
      if (item.type === 'combo' && item.items && item.items.length > 0) {
        for (const subItem of item.items) {
          if (subItem.type === 'service') {
            // A sub-item's offset is relative to the PARENT combo's start time.
            const subItemStartTime = addMinutes(currentItemStartTime, subItem.offset_minutes || 0);
            subItem.start_time = format(subItemStartTime, 'HH:mm');
            const subItemEndTime = addMinutes(subItemStartTime, subItem.duration || 0);
            subItem.end_time = format(subItemEndTime, 'HH:mm');
          }
        }
      }
    }

    if (JSON.stringify(newItems) !== JSON.stringify(items)) {
      setItems(newItems);
    }
  }, [items, attentionDateTime]);

  const { totalDuration, finalEndTime } = useMemo(() => {
    if (!attentionDateTime || items.length === 0) {
      return { totalDuration: 0, finalEndTime: '--:--' };
    }

    const allServiceEndTimes: Date[] = [];

    items.forEach(item => {
      if (item.type === 'service' && item.end_time) {
        const [h, m] = item.end_time.split(':').map(Number);
        if (!isNaN(h)) allServiceEndTimes.push(setHours(setMinutes(new Date(attentionDateTime), m), h));
      } else if (item.type === 'combo' && item.items) {
        item.items.forEach(subItem => {
          if (subItem.type === 'service' && subItem.end_time) {
            const [h, m] = subItem.end_time.split(':').map(Number);
            if (!isNaN(h)) allServiceEndTimes.push(setHours(setMinutes(new Date(attentionDateTime), m), h));
          }
        });
      }
    });

    if (allServiceEndTimes.length === 0) {
      return { totalDuration: 0, finalEndTime: '--:--' };
    }

    const latestEndTime = new Date(Math.max(...allServiceEndTimes.map(date => date.getTime())));
    const duration = differenceInMinutes(latestEndTime, attentionDateTime);

    return {
      totalDuration: duration > 0 ? duration : 0,
      finalEndTime: format(latestEndTime, 'h:mm a'),
    };
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

    const hasMissingUserInItems = items.some(item => {
      if (item.type === 'service' && !item.user_id) return true;
      if (item.type === 'combo') {
        // Check sub-items within the combo
        return item.items?.some(subItem => subItem.type === 'service' && !subItem.user_id);
      }
      return false;
    });

    if (hasMissingUserInItems) {
      toast({ title: "Error", description: "Todos los servicios, incluidos los de los combos, deben tener un profesional asignado.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    if (isEditMode) {
      const payload = {
        p_attention_id: attention.id,
        p_branch_id: attention.branch_id,
        p_total_amount: totalValue,
        p_notes: notes, // <-- AÑADIR ESTA LÍNEA
        p_services_to_upsert: [],
        p_products_to_upsert: [],
        p_combos_to_upsert: [],
        p_service_ids_to_delete: deletedServiceIds,
        p_product_ids_to_delete: deletedProductIds,
        p_combo_ids_to_delete: deletedComboIds,
      };

      const initialItemsMap = new Map(initialItems.map(item => [item.id, item]));

      items.forEach(item => {
        const initialItem = initialItemsMap.get(item.id);
        const hasChanged = !item.is_existing || (initialItem && JSON.stringify(item) !== JSON.stringify(initialItem));

        if (hasChanged) {
          switch (item.type) {
            case 'service':
              payload.p_services_to_upsert.push({
                id: item.is_existing ? item.id : undefined,
                service_id: item.item_id,
                user_id: item.user_id,
                price: item.price,
                duration_minutes: item.duration,
                notes: item.notes,
                status: item.status,
                is_parallel: item.is_parallel,
                offset_minutes: item.offset_minutes,
                attention_combo_id: item.attention_combo_id,
                client_treatment_session_id: item.client_treatment_session_id || null,
              });
              break;
            case 'product':
              payload.p_products_to_upsert.push({
                id: item.is_existing ? item.id : undefined,
                product_id: item.item_id,
                quantity: item.quantity,
                price: item.price,
                user_id: item.commission_user_id || null,
                attention_combo_id: item.attention_combo_id,
                client_treatment_session_id: item.client_treatment_session_id || null,
              });
              break;
            case 'combo':
               payload.p_combos_to_upsert.push({
                id: item.is_existing ? item.id : undefined,
                combo_id: item.item_id,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes,
              });
              item.items?.forEach(subItem => {
                if (subItem.type === 'service') {
                    payload.p_services_to_upsert.push({
                        id: subItem.is_existing ? subItem.id : undefined,
                        service_id: subItem.item_id,
                        user_id: subItem.user_id,
                        price: 0,
                        duration_minutes: subItem.duration,
                        notes: subItem.notes,
                        status: subItem.status,
                        is_parallel: subItem.is_parallel,
                        offset_minutes: subItem.offset_minutes,
                        attention_combo_id: item.id,
                    });
                }
              });
              break;
          }
        }
      });
      
      try {
        await updateAttentionItemsMutation.mutateAsync(payload);
        onFinished();
      } catch (error) {
        console.error("Error updating attention:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // --- Lógica de Creación ---
      const servicesPayload: any[] = [];
      const productsPayload: any[] = [];
      const combosPayload: any[] = [];
      const paymentsPayload: any[] = [];

      items.forEach(item => {
        switch (item.type) {
          case 'service':
            servicesPayload.push({
              service_id: item.item_id,
              user_id: item.user_id,
              price: item.price * item.quantity,
              duration: item.duration,
              start_time: item.start_time,
              end_time: item.end_time,
              is_parallel: item.is_parallel,
              parallel_group_id: item.parallel_group_id,
              offset_minutes: item.offset_minutes,
              notes: item.notes,
              client_treatment_session_id: item.client_treatment_session_id || null
            });
            break;
          case 'payment':
            paymentsPayload.push({
              price: item.price,
              notes: item.item_name,
              client_treatment_session_id: item.client_treatment_session_id || null
            });
            break;
          case 'product':
            productsPayload.push({
              product_id: item.item_id,
              quantity: item.quantity,
              unit_price: item.price,
              user_id: item.commission_user_id || null,
              client_treatment_session_id: item.client_treatment_session_id || null
            });
            break;
          case 'combo':
            combosPayload.push({
              combo_id: item.item_id,
              price: item.price * item.quantity,
              quantity: item.quantity,
              notes: item.notes,
            });
            item.items?.forEach(subItem => {
              if (subItem.type === 'service') {
                servicesPayload.push({
                  service_id: subItem.item_id,
                  user_id: subItem.user_id,
                  price: 0,
                  duration: subItem.duration,
                  start_time: subItem.start_time,
                  end_time: subItem.end_time,
                  is_parallel: false,
                  offset_minutes: subItem.offset_minutes,
                  notes: subItem.notes,
                  combo_id: item.item_id 
                });
              } else if (subItem.type === 'product') {
                productsPayload.push({
                  product_id: subItem.item_id,
                  quantity: subItem.quantity,
                  unit_price: 0,
                  user_id: subItem.commission_user_id || null,
                  combo_id: item.item_id
                });
              }
            });
            break;
        }
      });

      const payload = {
        p_client_id: clientId,
        p_attention_datetime: attentionDateTime.toISOString(),
        p_notes: notes,
        p_branch_id: branchId,
        p_total_amount: totalValue,
        p_services: servicesPayload,
        p_products: productsPayload,
        p_combos: combosPayload,
        p_payments: paymentsPayload,
        p_tenant_id: tenantId,
      };

      try {
        await createAttentionMutation.mutateAsync(payload);
        toast({ title: "Éxito", description: "Atención creada correctamente.", variant: "success" });
        onFinished();
      } catch (error: any) {
        toast({ title: "Error al crear atención", description: error.message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const clientOptions = useMemo(() => {
    const options = clients?.map(client => ({ 
      value: client.id, 
      label: `${client.name} - ${client.phone} - ${client.email}`,
      shortLabel: client.name 
    })) || [];

    if (isEditMode && clientId && attention?.clients) {
      const clientExists = options.some(opt => opt.value === clientId);
      if (!clientExists) {
        options.unshift({
          value: clientId,
          label: `${attention.clients.name} - ${attention.clients.phone}`,
          shortLabel: attention.clients.name
        });
      }
    }
    
    return options;
  }, [clients, isEditMode, clientId, attention]);

  const isAttentionEditable = isEditMode ? !['Finalizada', 'Pagada', 'Cancelada'].includes(attention!.status) : true;

  return (
    <form id="attention-form" onSubmit={handleSubmit} className="relative">
      <div className="space-y-4 pb-32">
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
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-y-4' : 'grid-cols-2 gap-x-4'} items-end`}>
          <div className="flex flex-col space-y-2">
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
          <div className="flex flex-col space-y-2">
            <Label htmlFor="time">Hora</Label>
            <DatePicker
              selected={attentionDateTime}
              onChange={handleTimeChange}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={5}
              timeCaption="Hora"
              dateFormat="h:mm aa"
              customInput={<TimePickerButton />}
              disabled={isEditMode}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
            <Label>Items de la Atención</Label>
            {isAttentionEditable && (
              <div className="flex gap-2 flex-wrap">
                <Button type="button" onClick={() => addItem('service')} size="sm" variant="outline" disabled={!clientId || !attentionTime}><Plus className="w-4 h-4 mr-2" />Servicio</Button>
                <Button type="button" onClick={() => addItem('product')} size="sm" variant="outline" disabled={!clientId || !attentionTime}><Plus className="w-4 h-4 mr-2" />Producto</Button>
                <Button type="button" onClick={() => addItem('combo')} size="sm" variant="outline" disabled={!clientId || !attentionTime}><Plus className="w-4 h-4 mr-2" />Combo</Button>
                <AddTreatmentSessionDialog
                  clientId={clientId}
                  onSessionSelected={(selectedSession) => {
                    const newItemsFromSession: ItemForm[] = [];
                    // Map items from the selected session to ItemForm structure
                    selectedSession.items?.forEach((item: any) => {
                        let price = 0; // Price for treatment items is always 0
                        let duration = 0;
                        let itemName = 'Ítem desconocido';

                        if (item.service_id && branchServicesAndCombos) {
                            const serviceDetails = branchServicesAndCombos.find(s => s.id === item.service_id);
                            if (serviceDetails) {
                                duration = serviceDetails.duration_minutes || 0;
                                itemName = serviceDetails.name;
                            }
                        } else if (item.product_id && branchProducts) {
                            const productDetails = branchProducts.find(p => p.id === item.product_id);
                            if (productDetails) {
                                itemName = productDetails.name;
                            }
                        }

                        newItemsFromSession.push({
                            id: uuidv4(),
                            type: item.product_id ? 'product' : 'service',
                            item_id: item.product_id || item.service_id,
                            item_name: itemName,
                            quantity: item.quantity,
                            price: 0, // Per user request, individual price is 0
                            original_price: 0,
                            duration: duration, // Correctly looked up duration
                            notes: item.notes,
                            is_existing: false,
                            status: 'Pendiente',
                            user_id: '',
                            start_time: '',
                            end_time: '',
                            is_parallel: false,
                            parallel_group_id: null,
                            offset_minutes: 0,
                            is_treatment_session_item: true,
                            client_treatment_session_id: selectedSession.id,
                            client_treatment_id: selectedSession.client_treatment_id,
                        });
                    });

                    // Add a 'payment' item if there's an amount due for this session
                    if (selectedSession.payment_due && selectedSession.payment_due.amount > 0) {
                        newItemsFromSession.push({
                            id: uuidv4(),
                            type: 'payment',
                            item_id: 'treatment-payment', // Special ID for payment type
                            item_name: `Pago de Tratamiento (Sesión ${selectedSession.session_number})`,
                            quantity: 1,
                            price: selectedSession.payment_due.amount,
                            is_existing: false,
                            status: 'Pendiente',
                            user_id: '',
                            start_time: '',
                            end_time: '',
                            is_parallel: false,
                            parallel_group_id: null,
                            offset_minutes: 0,
                            is_treatment_session_item: true,
                            client_treatment_session_id: selectedSession.id,
                            client_treatment_id: selectedSession.client_treatment_id,
                        });
                    }

                    setItems(prevItems => [...prevItems, ...newItemsFromSession]);
                    toast({
                      title: "Sesión de Tratamiento Añadida",
                      description: `Items de la sesión ${selectedSession.session_number} (${selectedSession.name}) agregados a la atención.`,
                      variant: "success",
                    });
                  }}
                >
                  <Button type="button" size="sm" variant="outline" disabled={!clientId || !attentionTime || isLoadingClientTreatments || !clientTreatments || clientTreatments.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />Tratamiento
                  </Button>
                </AddTreatmentSessionDialog>
              </div>
            )}
          </div>
          <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-3">
          {items.map((item, index) => (
              <ItemFormCard
                  key={item.id}
                  item={item}
                  index={index}
                  attentionDateTime={attentionDateTime}
                  branchId={branchId}
                  onUpdate={updateItem}
                  onRemove={() => handleRemoveItem(index)}
                  onSearchItems={debouncedSetItemSearchTerm}
                  isLoadingItems={isLoadingItems}
                  canRemove={items.length > 0}
                  availableServicesAndCombos={branchServicesAndCombos || []}
                  availableBranchProducts={branchProducts || []}
                  isAttentionEditable={isAttentionEditable}
                  tenantId={tenantId}
                  screenSize={screenSize}
                  clientId={clientId}
                  attention={attention} // Pass attention object
                  attentionId={attention?.id || ''} // Pass attentionId
                  salesSettings={salesSettings}
                  userRole={userRole}
                  isLoadingSalesSettings={isLoadingSalesSettings}
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

        {isEditMode && attention?.attention_payments && attention.attention_payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pagos Registrados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {attention.attention_payments.map((payment: any) => {
                const paymentMethod = availablePaymentMethods?.find(p => p.id === payment.payment_method_id);
                const methodName = paymentMethod?.name || 'Método desconocido';
                const requiresEvidence = paymentMethod?.requires_evidence || false;

                return (
                  <div key={payment.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-semibold">{methodName}</p>
                      <p className="text-sm text-gray-600">{formatPrice(payment.amount)}</p>
                    </div>
                    {requiresEvidence && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingPaymentIds([payment.id])}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Evidencia
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notas de la Atención</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!isAttentionEditable} />
        </div>
      </div>
      <DialogFooter className="fixed bottom-0 right-0 w-full bg-background pt-4 pb-4 pr-6">
        <Button type="button" variant="outline" onClick={onFinished}>Cancelar</Button>
        
        {isEditMode && attention?.status === 'Pendiente' && (
            <Button
                type="button"
                onClick={() => {
                    confirmAttentionMutation.mutate(attention.id, {
                        onSuccess: () => {
                            onFinished(); // Cierra el formulario para forzar la recarga de datos al reabrir
                        }
                    });
                }}
                disabled={confirmAttentionMutation.isPending}
                variant="default"
            >
                {confirmAttentionMutation.isPending ? 'Confirmando...' : 'Confirmar Atención'}
            </Button>
        )}

        <Button type="submit" form="attention-form" disabled={isSubmitting || createAttentionMutation.isPending || updateAttentionItemsMutation.isPending || confirmAttentionMutation.isPending || !clientId || !attentionDateTime || items.length === 0}>
          {isEditMode ? 'Guardar Cambios' : 'Crear Atención'}
        </Button>
      </DialogFooter>

      {viewingPaymentIds && (
        <EvidencePreview
          paymentIds={viewingPaymentIds}
          isOpen={!!viewingPaymentIds}
          onClose={() => setViewingPaymentIds(null)}
        />
      )}
    </form>
  );
};