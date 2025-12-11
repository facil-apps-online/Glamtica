
import { useMemo, useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, Trash2, UploadCloud, Clock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { FilterableSelect } from "./FilterableSelect";
import { useProductSellers } from "@/hooks/useProductSellers";
import { useGetComboBranchDetails } from "@/hooks/useCombos";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { format, setHours, setMinutes, addMinutes } from "date-fns";
import { useStartService, useFinishService, useCallClient } from "@/hooks/useAttentionServiceActions";
import { ServiceTimer } from "./ServiceTimer";
import { EvidenceUploadDialog } from "./EvidenceUpload";
import { debounce } from "@/lib/utils";
import { AssignConsentDialog } from "@/components/dialogs/AssignConsentDialog";
import { ViewConsentDialog } from '@/components/dialogs/ViewConsentDialog';
import { useSignedConsentsForAttention, useDeleteSignedConsent, useSignConsent, SignedConsent } from "@/hooks/useConsentTemplates";

// --- SUB-COMPONENTE PARA ITEMS DENTRO DE UN COMBO ---

interface ComboSubItemCardProps {
  subItem: ItemForm;
  subIndex: number;
  attentionDateTime: Date | null;
  branchId?: string;
  isAttentionEditable: boolean;
  onUpdate: (subIndex: number, updates: Partial<ItemForm>) => void;
}

const ComboSubItemCard = ({ subItem, subIndex, attentionDateTime, branchId, isAttentionEditable, onUpdate }: ComboSubItemCardProps) => {
  const [professionalSearchTerm, setProfessionalSearchTerm] = useState("");
  const debouncedSetProfessionalSearchTerm = useMemo(() => debounce(setProfessionalSearchTerm, 300), []);

  // Hook para profesionales de servicios
  const { data: availableUsers, isLoading: isLoadingAvailableUsers } = useAvailableUsers(
    subItem.type === 'service' ? subItem.item_id : undefined,
    'service',
    attentionDateTime ? format(attentionDateTime, 'yyyy-MM-dd') : '',
    subItem.start_time || (attentionDateTime ? format(attentionDateTime, 'HH:mm') : undefined),
    subItem.duration,
    branchId,
    subItem.is_existing ? subItem.user_id : undefined,
    subItem.is_existing ? subItem.id : undefined,
    professionalSearchTerm
  );

  // Hook para vendedores de productos
  const { data: productSellers, isLoading: isLoadingProductSellers } = useProductSellers(
    subItem.type === 'product' ? subItem.item_id : undefined,
    branchId
  );

  const availableUsersOptions = useMemo(() => {
    if (!availableUsers) return [];
    return availableUsers.map((user: any) => ({
      value: user.user_id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    }));
  }, [availableUsers]);

  const productSellersOptions = useMemo(() => {
    if (!productSellers) return [];
    return productSellers.map((seller: any) => ({
      value: seller.user_id,
      label: `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.email,
    }));
  }, [productSellers]);

  return (
    <div className="p-3 rounded-md bg-slate-50 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{subItem.quantity}x {subItem.item_name}</p>
        {subItem.type === 'service' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{subItem.duration} min</span>
            {subItem.offset_minutes > 0 && <span className="text-blue-500">(+{subItem.offset_minutes} min)</span>}
          </div>
        )}
      </div>
      
      {subItem.type === 'service' && (
        <FilterableSelect
          placeholder="Asignar profesional..."
          options={availableUsersOptions}
          value={subItem.user_id}
          onValueChange={(value) => onUpdate(subIndex, { user_id: value })}
          disabled={!isAttentionEditable || isLoadingAvailableUsers}
          searchPlaceholder={isLoadingAvailableUsers ? "Verificando..." : "Buscar profesional..."}
          onSearch={debouncedSetProfessionalSearchTerm}
        />
      )}

      {subItem.type === 'product' && (
        <FilterableSelect
          placeholder="Asignar vendedor..."
          options={productSellersOptions}
          value={subItem.commission_user_id}
          onValueChange={(value) => onUpdate(subIndex, { commission_user_id: value })}
          disabled={!isAttentionEditable || isLoadingProductSellers}
          searchPlaceholder={isLoadingProductSellers ? "Cargando..." : "Buscar..."}
        />
      )}
    </div>
  );
};


export interface ItemForm {
  id: string;
  type: 'service' | 'product' | 'combo' | 'payment'; // 'payment' added
  item_id: string; // ID del servicio, producto, combo o 'payment' para pagos de tratamiento
  user_id: string; // Profesional asignado (para servicios)
  commission_user_id?: string; // Para productos, si es diferente del user_id del servicio
  price: number;
  original_price?: number;
  duration?: number;
  quantity: number;
  notes?: string;
  item_name?: string;
  user_name?: string;
  is_existing: boolean; // Si ya existe en la base de datos (modo edición)
  status?: string; // Estado del item de atención
  status_history?: any[];
  start_time: string;
  end_time: string;
  is_parallel: boolean;
  parallel_group_id: string | null;
  offset_minutes: number;
  attention_combo_id?: string | null;

  // Para combos, lista de sub-items (servicios/productos)
  items?: ItemForm[];

  // Campos para ítems de sesión de tratamiento
  is_treatment_session_item?: boolean;
  client_treatment_session_id?: string;
  client_treatment_id?: string;
}

export interface ItemFormCardProps {
  item: ItemForm;
  index: number;
  attentionDateTime: Date | null;
  branchId?: string;
  onUpdate: (index: number, updates: Partial<ItemForm>) => void;
  onRemove: (index: number) => void;
  onSearchItems?: (searchTerm: string) => void;
  isLoadingItems?: boolean;
  canRemove: boolean;
  availableServicesAndCombos: any[];
  availableBranchProducts: any[];
  isAttentionEditable: boolean;
  tenantId?: string;
  screenSize: 'mobile' | 'tablet' | 'desktop';
  attentionId: string; // ADD THIS LINE
  attention: any;
  salesSettings?: {
    allow_price_modification?: boolean;
    price_modification_role_ids?: string[];
    enforce_minimum_price?: boolean;
  };
  userRole?: string;
  isLoadingSalesSettings?: boolean;
}

const ItemFormCard = ({
  item,
  index,
  attentionDateTime,
  branchId,
  onUpdate,
  onRemove,
  onSearchItems,
  isLoadingItems,
  canRemove,
  availableServicesAndCombos,
  availableBranchProducts,
  isAttentionEditable,
  attentionId, // ADD THIS LINE
  attention,
  salesSettings,
  userRole,
  isLoadingSalesSettings,
}: ItemFormCardProps) => {
  const [evidenceDialogService, setEvidenceDialogService] = useState<ItemForm | null>(null);
  const [professionalSearchTerm, setProfessionalSearchTerm] = useState("");
  const debouncedSetProfessionalSearchTerm = useMemo(() => debounce(setProfessionalSearchTerm, 300), []);
  const [sellerSearchTerm, setSellerSearchTerm] = useState("");
  const debouncedSetSellerSearchTerm = useMemo(() => debounce(setSellerSearchTerm, 300), []);
  const startServiceMutation = useStartService();
  const finishServiceMutation = useFinishService();
  const callClientMutation = useCallClient();
  const [isAssignConsentDialogOpen, setIsAssignConsentDialogOpen] = useState(false); // State for consent dialog
  const { toast } = useToast();
  const { formatPrice } = usePriceFormat();
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);

  useEffect(() => {
    if (item.item_id && originalPrice === null) {
      setOriginalPrice(item.price);
    }
  }, [item.item_id, item.price, originalPrice]);

  const isPriceEditable = useMemo(() => {
    if (isLoadingSalesSettings || !salesSettings || !userRole) return false;
    return (
      salesSettings.allow_price_modification &&
      (salesSettings.price_modification_role_ids || []).includes(userRole)
    );
  }, [salesSettings, userRole, isLoadingSalesSettings]);

  const handlePriceChange = (newPrice: number) => {
    if (salesSettings?.enforce_minimum_price && originalPrice !== null && newPrice < originalPrice) {
      toast({
        title: "Precio no válido",
        description: `El precio no puede ser menor al original de ${formatPrice(originalPrice)}.`,
        variant: "warning",
      });
      onUpdate(index, { price: originalPrice });
    } else {
      onUpdate(index, { price: newPrice });
    }
  };

  const getStatusBadge = (status: ItemForm['status']) => {
    switch (status) {
      case 'Pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'Llamado':
        return <Badge variant="default" className="bg-yellow-500">Llamado</Badge>;
      case 'En Proceso':
        return <Badge variant="default" className="bg-blue-500">En Proceso</Badge>;
      case 'Finalizado':
        return <Badge variant="default" className="bg-green-500">Finalizado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const { data: comboDetails, isLoading: isLoadingComboDetails } = useGetComboBranchDetails(
    (item.type === 'combo' && item.item_id && !item.is_existing) ? item.item_id : undefined,
    branchId
  );

  const { data: productSellers, isLoading: isLoadingProductSellers } = useProductSellers(
    item.type === 'product' ? item.item_id : undefined,
    branchId,
    sellerSearchTerm
  );

  const totalItemDuration = (item.duration || 0) * item.quantity;

  const { data: availableUsers, isLoading: isLoadingAvailableUsers } = useAvailableUsers(
    item.type === 'service' ? item.item_id : undefined, // Only for individual services
    'service',
    attentionDateTime ? format(attentionDateTime, 'yyyy-MM-dd') : '',
    item.start_time || (attentionDateTime ? format(attentionDateTime, 'HH:mm') : undefined),
    totalItemDuration,
    branchId,
    item.is_existing ? item.user_id : undefined,
    item.is_existing ? item.id : undefined,
    professionalSearchTerm
  );

  useEffect(() => {
    if (item.type === 'combo' && !item.is_existing && comboDetails) {
      const newItems = comboDetails.items.map((ci: any) => ({
        id: `temp-${ci.item_id}`,
        type: ci.service_id ? 'service' : 'product',
        item_id: ci.service_id || ci.product_id,
        item_name: ci.name,
        quantity: ci.quantity,
        price: ci.final_price,
        duration: ci.duration_minutes,
        is_existing: false,
        status: 'Pendiente',
        user_id: '',
        start_time: '',
        end_time: '',
        is_parallel: false,
        parallel_group_id: null,
        offset_minutes: ci.offset_minutes || 0,
      }));

      const baseDuration = newItems.reduce((acc, comboItem) => {
        if (comboItem.type === 'service') {
          return acc + (comboItem.duration || 0);
        }
        return acc;
      }, 0);
      
      const basePrice = newItems.reduce((acc, comboItem) => acc + (comboItem.price || 0), 0);

      onUpdate(index, {
        duration: baseDuration,
        price: basePrice,
        items: newItems,
      });
    }
  }, [comboDetails, item.type, item.is_existing, index, onUpdate]);

  const availableUsersOptions = useMemo(() => {
    if (!availableUsers) return [];
    return availableUsers.map((user: any) => ({
      value: user.user_id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    }));
  }, [availableUsers]);

  const itemOptions = useMemo(() => {
    let options: { value: string; label: string; }[] = [];
    if (item.type === 'product') {
      options = availableBranchProducts.map(p => ({ value: p.id, label: p.name }));
    } else {
      options = availableServicesAndCombos
        .filter(s => s.type === item.type)
        .map(s => ({ value: s.id, label: s.name }));
    }

    if (item.is_existing && item.item_id && item.item_name) {
      const itemExists = options.some(opt => opt.value === item.item_id);
      if (!itemExists) {
        options.unshift({
          value: item.item_id,
          label: item.item_name,
        });
      }
    }

    return options;
  }, [item.type, item.is_existing, item.item_id, item.item_name, availableBranchProducts, availableServicesAndCombos]);

  const handleItemChange = (itemId: string) => {
    const selectedItem = [...availableBranchProducts, ...availableServicesAndCombos].find(i => i.id === itemId);
    if (selectedItem) {
      const price = selectedItem.selling_price || 0;
      setOriginalPrice(price);
      const updates: Partial<ItemForm> = {
        item_id: itemId,
        item_name: selectedItem.name,
        price: price,
        original_price: price,
        quantity: 1,
        user_id: '',
      };
      if (selectedItem.type === 'service') {
        updates.duration = selectedItem.duration_minutes || 0;
      } else if (selectedItem.type === 'combo') {
        updates.duration = 0;
        updates.price = 0;
        updates.original_price = 0;
      }
      onUpdate(index, updates);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    onUpdate(index, { quantity: Math.max(1, newQuantity) });
  };

  const handleUpdateSubItem = useCallback((subIndex: number, updates: Partial<ItemForm>) => {
    const newSubItems = [...(item.items || [])];
    newSubItems[subIndex] = { ...newSubItems[subIndex], ...updates };
    onUpdate(index, { items: newSubItems });
  }, [item.items, index, onUpdate]);

  const isItemDisabled = !isAttentionEditable || (item.is_existing && item.status !== 'Pendiente');
  const typeLabel = item.type === 'service' ? 'Servicio' : item.type === 'product' ? 'Producto' : 'Combo';

  const canBeParallel = useMemo(() => {
    if (!isAttentionEditable) return false;
    if (item.type === 'service' || item.type === 'combo') return true;
    return false;
  }, [isAttentionEditable, item.type]);

  if (item.type === 'product') {
    const productSellersOptions = productSellers?.map((seller: any) => ({
        value: seller.user_id,
        label: `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.email,
    })) || [];

    const currentProduct = availableBranchProducts.find(p => p.id === item.item_id);
    const isDecimalAllowed = currentProduct?.allow_decimal_sale || false;

    const handleQuantityChange = (value: string) => {
      const newQuantity = isDecimalAllowed ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity > 0) {
        onUpdate(index, { quantity: newQuantity });
      } else if (value === "") {
        onUpdate(index, { quantity: 0 });
      }
    };

    return (
        <Card className="relative mb-4 w-full">
            <CardContent className="p-4 space-y-4">
                <Label>{`Item #${index + 1}: ${typeLabel}`}</Label>
                <FilterableSelect
                    placeholder={`Selecciona un ${typeLabel}`}
                    options={itemOptions}
                    value={item.item_id}
                    onValueChange={handleItemChange}
                    disabled={isItemDisabled}
                    onSearch={onSearchItems}
                    searchPlaceholder="Buscar..."
                />
                <FilterableSelect
                    label="Vendido por:"
                    placeholder="Asignar profesional"
                    options={productSellersOptions}
                    value={item.commission_user_id}
                    onValueChange={(value) => onUpdate(index, { commission_user_id: value })}
                    disabled={isItemDisabled || isLoadingProductSellers || !item.item_id}
                    onSearch={debouncedSetSellerSearchTerm}
                    searchPlaceholder="Buscar vendedor..."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="w-full">
                        <Label>Cantidad</Label>
                        <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => handleQuantityChange(e.target.value)} 
                            min={isDecimalAllowed ? 0.01 : 1}
                            step={isDecimalAllowed ? 0.01 : 1}
                            disabled={isItemDisabled || !item.item_id}
                            className="w-full"
                        />
                    </div>
                    <div className="p-2 bg-muted rounded-md text-sm text-right flex flex-col justify-center">
                        <div>
                            <span className="font-semibold">Unitario: </span>
                                                {isPriceEditable && item.type !== 'combo' ? (
                                                  <Input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                                                    className="inline-block w-24 h-8 ml-2 text-right"
                                                    disabled={!isAttentionEditable || !item.item_id}
                                                  />
                                                ) : (
                                                  <span>{formatPrice(item.price * item.quantity)}</span>
                                                )}                        </div>
                        <div>
                            <span className="font-semibold">Total: </span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            {isAttentionEditable && (
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => onRemove(index)} disabled={!canRemove}>
                  <Trash2 className="h-4 w-4" />
              </Button>
            )}
        </Card>
    );
  }

  const comboItemsToDisplay = item.items || [];

  return (
    <>
      <Card className={`relative mb-4 w-full ${item.is_parallel ? 'border-l-4 border-l-blue-500' : ''}`}>
        <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-start gap-2">
              {/* Left Side: Title and Badge */}
              <div className="flex-grow">
                <Label>{`Item #${index + 1}: ${typeLabel}`}</Label>
                {item.type === 'service' && <div className="mt-1">{getStatusBadge(item.status)}</div>}
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {canBeParallel && (
                  <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onUpdate(index, { is_parallel: !item.is_parallel })}
                      disabled={index === 0 || item.is_existing}
                      title={index === 0 ? "El primer ítem no puede ser paralelo" : "Marcar como ítem paralelo"}
                  >
                      <Link className={`h-4 w-4 ${item.is_parallel ? 'text-blue-500' : ''}`} />
                  </Button>
                )}
                {isAttentionEditable && (
                  <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(index); }} 
                      disabled={!canRemove}
                  >
                      <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <FilterableSelect
                placeholder={`Selecciona un ${typeLabel}`}
                options={itemOptions}
                value={item.item_id}
                onValueChange={handleItemChange}
                disabled={isItemDisabled || item.is_existing}
                onSearch={onSearchItems}
                searchPlaceholder="Buscar..."
            />

            {item.type === 'service' && (
              <div>
                  {item.is_existing ? (
                      <div>
                          <Label>Asignado A:</Label>
                          <Input value={item.user_name || 'No asignado'} disabled />
                      </div>
                  ) : (
                      <FilterableSelect
                          label="Asignado A:"
                          placeholder="Asignar profesional"
                          options={availableUsersOptions}
                          value={item.user_id}
                          onValueChange={(value) => onUpdate(index, { user_id: value })}
                          disabled={isItemDisabled || isLoadingAvailableUsers || !item.item_id}
                          searchPlaceholder={isLoadingAvailableUsers ? "Verificando..." : "Buscar profesional..."}
                          onSearch={debouncedSetProfessionalSearchTerm}
                      />
                  )}
                  {!item.is_existing && !isLoadingAvailableUsers && availableUsers?.length === 0 && item.item_id && (
                      <p className="text-xs text-red-500 mt-1">No hay personal disponible.</p>
                  )}
              </div>
            )}

            {item.is_parallel && (
                <div className="mt-2">
                    <Label htmlFor={`offset-minutes-${item.id}`}>Inicio después de (min)</Label>
                    <Input 
                        id={`offset-minutes-${item.id}`}
                        type="number" 
                        value={item.offset_minutes}
                        onChange={(e) => onUpdate(index, { offset_minutes: parseInt(e.target.value, 10) || 0 })}
                        min={0}
                        disabled={isItemDisabled || item.is_existing}
                        className="w-full md:w-24"
                    />
                </div>
            )}

            {item.type === 'combo' && (
              <div className="mt-4">
                  <Label>Cantidad</Label>
                  <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)} 
                      min={1} 
                      disabled={isItemDisabled || item.is_existing || !item.item_id}
                  />
              </div>
            )}

            {item.type === 'combo' && (isLoadingComboDetails || (comboItemsToDisplay && comboItemsToDisplay.length > 0)) && (
                <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2">Contenido del Combo:</h4>
                    {isLoadingComboDetails ? (
                        <p className="text-sm text-muted-foreground">Cargando detalles del combo...</p>
                    ) : (
                        <div className="space-y-3">
                            {comboItemsToDisplay.map((comboItem, subIndex) => (
                                <ComboSubItemCard
                                  key={comboItem.id || subIndex}
                                  subItem={comboItem}
                                  subIndex={subIndex}
                                  attentionDateTime={attentionDateTime}
                                  branchId={branchId}
                                  isAttentionEditable={isAttentionEditable}
                                  onUpdate={handleUpdateSubItem}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm p-2 bg-muted rounded-md">
                <div>
                    <span className="font-semibold">Duración: </span>
                    <span>{totalItemDuration} min</span>
                </div>
                <div>
                    <span className="font-semibold">Valor: </span>
                    {isPriceEditable && item.type !== 'combo' ? (
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                        className="inline-block w-24 h-8 ml-2 text-right"
                        disabled={!isAttentionEditable || !item.item_id}
                      />
                    ) : (
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    )}
                </div>
                <div>
                    <span className="font-semibold">Inicia: </span>
                    <span>{item.start_time && attentionDateTime ? format(setHours(setMinutes(attentionDateTime, parseInt(item.start_time.split(':')[1])), parseInt(item.start_time.split(':')[0])), 'h:mm a') : '--:--'}</span>
                </div>
                <div>
                    <span className="font-semibold">Finaliza: </span>
                    <span>{item.end_time && attentionDateTime ? format(setHours(setMinutes(attentionDateTime, parseInt(item.end_time.split(':')[1])), parseInt(item.end_time.split(':')[0])), 'h:mm a') : '--:--'}</span>
                </div>
            </div>

            {item.type === 'service' && (
              <div>
                  <Label>Observaciones del Servicio:</Label>
                  <Textarea 
                      value={item.notes || ''}
                      onChange={(e) => onUpdate(index, { notes: e.target.value })}
                      placeholder="Añade notas específicas para este servicio..."
                      disabled={isItemDisabled || item.is_existing}
                  />
              </div>
            )}

            {item.is_existing && item.type === 'service' && (
                <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2">Acciones del Servicio</h4>
                    <div className="flex gap-2 flex-wrap items-center">
                        {item.status === 'Pendiente' && (
                            <Button type="button" size="sm" variant="outline" onClick={() => callClientMutation.mutate(item.id)} disabled={callClientMutation.isPending}>
                                {callClientMutation.isPending ? 'Llamando...' : 'Llamar Cliente'}
                            </Button>
                        )}
                        {(item.status === 'Pendiente' || item.status === 'Llamado') && (
                            <Button type="button" size="sm" onClick={() => startServiceMutation.mutate(item.id)} disabled={startServiceMutation.isPending}>
                                {startServiceMutation.isPending ? 'Iniciando...' : 'Empezar Servicio'}
                            </Button>
                        )}
                        {item.status === 'En Proceso' && (
                            <Button type="button" size="sm" variant="destructive" onClick={() => finishServiceMutation.mutate(item.id)} disabled={finishServiceMutation.isPending}>
                                {finishServiceMutation.isPending ? 'Finalizando...' : 'Finalizar Servicio'}
                            </Button>
                        )}
                        <ServiceTimer status={item.status || 'Pendiente'} statusHistory={item.status_history} />
                        {item.status === 'Finalizado' && <p className="text-sm text-green-600 p-2 bg-green-50 rounded-md">Servicio finalizado.</p>}
                        {item.status === 'Llamado' && <p className="text-sm text-blue-600 p-2 bg-blue-50 rounded-md">Profesional llamado.</p>}
                        <Button type="button" size="sm" variant="outline" onClick={() => setEvidenceDialogService(item)}>
                          <UploadCloud className="w-4 h-4 mr-2" />
                          Evidencia
                        </Button>
                        {/* NEW: Asignar Consentimiento Button */}
                        <Button type="button" size="sm" variant="outline" onClick={() => setIsAssignConsentDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Consentimiento
                        </Button>
                    </div>
                    {/* NEW: Display Signed Consents for this service */}
                    <SignedConsentsDisplay attentionId={attentionId} attentionServiceId={item.id} branchId={branchId} attention={attention} />
                </div>
            )}

        </CardContent>
    </Card>
    <EvidenceUploadDialog
      isOpen={!!evidenceDialogService}
      onOpenChange={(isOpen) => !isOpen && setEvidenceDialogService(null)}
      attentionServiceId={evidenceDialogService?.id || ''}
      branchId={branchId || ''}
      onUploadComplete={() => setEvidenceDialogService(null)}
    />
    {/* NEW: Assign Consent Dialog */}
    {item.type === 'service' && (
      <AssignConsentDialog
        open={isAssignConsentDialogOpen}
        onOpenChange={setIsAssignConsentDialogOpen}
        attentionId={attentionId} // Corrected prop name
        attentionServiceId={item.id}
      />
    )}
  </>
  );
};

// NEW: Sub-component to display signed consents
interface SignedConsentsDisplayProps {
  attentionId: string;
  attentionServiceId: string;
  branchId?: string;
  attention: any;
}

const SignedConsentsDisplay = ({ attentionId, attentionServiceId, branchId, attention }: SignedConsentsDisplayProps) => {
  const { data: signedConsents, isLoading: isLoadingSignedConsents } = useSignedConsentsForAttention(attentionId, attentionServiceId);
  const { mutate: deleteConsent, isPending: isDeleting } = useDeleteSignedConsent();
  const { mutate: signConsent, isPending: isSigning } = useSignConsent();
  const { toast } = useToast();
  const [selectedConsent, setSelectedConsent] = useState<SignedConsent | null>(null);

  const handleDelete = (consentId: string) => {
    deleteConsent(consentId, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Consentimiento eliminado correctamente.", variant: "success" });
      },
      onError: (error) => {
        toast({ title: "Error", description: `No se pudo eliminar el consentimiento: ${error.message}`, variant: "destructive" });
      },
    });
  };

  const handleSignConsent = (signatureDataUrl: string, observations: string, formData: any, signedContent: string) => {
    if (!selectedConsent || !branchId) return;
    signConsent({
      signedConsentId: selectedConsent.id,
      signatureDataUrl,
      observations,
      branchId, // Pass branchId here
      formData,
      signedContent,
    }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Consentimiento firmado correctamente.", variant: "success" });
        setSelectedConsent(null);
      },
      onError: (error) => {
        toast({ title: "Error", description: `No se pudo firmar el consentimiento: ${error.message}`, variant: "destructive" });
      },
    });
  };

  if (isLoadingSignedConsents) {
    return <p className="text-sm text-muted-foreground mt-2">Cargando consentimientos...</p>;
  }

  if (!signedConsents || signedConsents.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">No hay consentimientos asignados a este servicio.</p>;
  }

  return (
    <>
      <div className="mt-2 space-y-1">
        <h5 className="text-xs font-semibold">Consentimientos Asignados:</h5>
        {signedConsents.map(consent => (
          <div key={consent.id} className="flex items-center justify-between text-xs p-1 border rounded-md bg-muted">
            <span>{consent.template_name}</span>
            <div className="flex items-center gap-2">
              {consent.signed_at ? (
                <span className="text-green-600">Firmado</span>
              ) : (
                <Button variant="link" className="text-orange-600 h-auto p-0" onClick={() => setSelectedConsent(consent)}>
                  Pendiente
                </Button>
              )}
              {!consent.signed_at && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5" disabled={isDeleting}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el consentimiento asignado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(consent.id)} disabled={isDeleting}>
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
      </div>
      <ViewConsentDialog
        open={!!selectedConsent}
        onOpenChange={(isOpen) => !isOpen && setSelectedConsent(null)}
        signedConsent={selectedConsent}
        onConfirm={handleSignConsent}
        isSigning={isSigning}
        attention={attention}
      />
    </>
  );
};

export default ItemFormCard;

