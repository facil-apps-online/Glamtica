
import { useMemo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, Trash2, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilterableSelect } from "./FilterableSelect";
import { useProductSellers } from "@/hooks/useProductSellers";
import { useGetComboBranchDetails } from "@/hooks/useCombos";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { format, setHours, setMinutes } from "date-fns";
import { useStartService, useFinishService, useCallClient } from "@/hooks/useAttentionServiceActions";
import { ServiceTimer } from "./ServiceTimer";
import { EvidenceUpload } from "./EvidenceUpload";

export interface ItemForm {
  id: string;
  type: 'service' | 'product' | 'combo';
  item_id: string;
  user_id: string;
  commission_user_id?: string;
  price: number;
  duration?: number;
  quantity: number;
  notes?: string;
  item_name?: string;
  user_name?: string;
  is_existing: boolean;
  status?: string;
  start_time: string;
  end_time: string;
  is_parallel: boolean;
  parallel_group_id: string | null;
  offset_minutes: number;
  attention_combo_id?: string | null;
  items?: ItemForm[];
}

export interface ItemFormCardProps {
  item: ItemForm;
  index: number;
  attentionDateTime: Date | null;
  branchId?: string;
  onUpdate: (index: number, updates: Partial<ItemForm>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  availableServicesAndCombos: any[];
  availableBranchProducts: any[];
  isAttentionEditable: boolean;
  tenantId?: string;
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

const ItemFormCard = ({
  item,
  index,
  attentionDateTime,
  branchId,
  onUpdate,
  onRemove,
  canRemove,
  availableServicesAndCombos,
  availableBranchProducts,
  isAttentionEditable,
}: ItemFormCardProps) => {
  const [evidenceDialogService, setEvidenceDialogService] = useState<ItemForm | null>(null);
  const startServiceMutation = useStartService();
  const finishServiceMutation = useFinishService();
  const callClientMutation = useCallClient();

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

  const { formatPrice } = usePriceFormat();
  const { data: comboDetails, isLoading: isLoadingComboDetails } = useGetComboBranchDetails(
    (item.type === 'combo' && item.item_id && !item.is_existing) ? item.item_id : undefined,
    branchId
  );

  const { data: productSellers, isLoading: isLoadingProductSellers } = useProductSellers(
    item.type === 'product' ? item.item_id : undefined,
    branchId
  );

  const totalItemDuration = (item.duration || 0) * item.quantity;

  const { data: availableUsers, isLoading: isLoadingAvailableUsers } = useAvailableUsers(
    item.type === 'service' || item.type === 'combo' ? item.item_id : undefined,
    item.type === 'service' || item.type === 'combo' ? item.type : undefined,
    attentionDateTime ? format(attentionDateTime, 'yyyy-MM-dd') : '',
    item.start_time,
    totalItemDuration,
    branchId,
    item.user_id,
    item.is_existing ? item.id : undefined
  );

  useEffect(() => {
    if (item.type === 'combo' && !item.is_existing && comboDetails) {
      const newItems = comboDetails.items.map((ci: any) => ({
        id: `temp-${ci.id}`,
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
        offset_minutes: 0,
      }));

      const baseDuration = newItems.reduce((acc, comboItem) => acc + (comboItem.duration || 0), 0);
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

    // Ensure the current item is in the list when editing
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
      const updates: Partial<ItemForm> = {
        item_id: itemId,
        item_name: selectedItem.name,
        price: selectedItem.selling_price || 0,
        quantity: 1,
        user_id: '',
      };
      if (selectedItem.type === 'service') {
        updates.duration = selectedItem.duration_minutes || 0;
      } else if (selectedItem.type === 'combo') {
        updates.duration = 0;
        updates.price = 0;
      }
      onUpdate(index, updates);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    onUpdate(index, { quantity: Math.max(1, newQuantity) });
  };

  const isItemDisabled = !isAttentionEditable || (item.is_existing && item.status !== 'Pendiente');
  const typeLabel = item.type === 'service' ? 'Servicio' : item.type === 'product' ? 'Producto' : 'Combo';

  const canBeParallel = useMemo(() => {
    if (!isAttentionEditable) return false;
    if (item.type === 'service') return true;
    if (item.type === 'combo') {
      const itemsToCheck = item.is_existing ? item.items : comboDetails?.items;
      if (itemsToCheck) {
        return itemsToCheck.some((comboItem: any) => comboItem.type === 'service' || comboItem.service_id);
      }
    }
    return false;
  }, [isAttentionEditable, item.type, item.items, comboDetails]);

  if (item.type === 'product') {
    const productSellersOptions = productSellers?.map((seller: any) => ({
        value: seller.user_id,
        label: `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.email,
    })) || [];

    // Encontrar el producto actual para verificar si permite decimales
    const currentProduct = availableBranchProducts.find(p => p.id === item.item_id);
    const isDecimalAllowed = currentProduct?.allow_decimal_sale || false;

    const handleQuantityChange = (value: string) => {
      const newQuantity = isDecimalAllowed ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity > 0) {
        onUpdate(index, { quantity: newQuantity });
      } else if (value === "") {
        onUpdate(index, { quantity: 0 }); // Permitir vaciar el campo temporalmente
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
                />
                <FilterableSelect
                    label="Vendido por:"
                    placeholder="Asignar profesional"
                    options={productSellersOptions}
                    value={item.commission_user_id}
                    onValueChange={(value) => onUpdate(index, { commission_user_id: value })}
                    disabled={isItemDisabled || isLoadingProductSellers || !item.item_id}
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
                            <span>{formatPrice(item.price)}</span>
                        </div>
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

  const comboItemsToDisplay = item.is_existing ? item.items : comboDetails?.items;

  return (
    <>
      <Card className={`relative mb-4 w-full ${item.is_parallel ? 'border-l-4 border-l-blue-500' : ''}`}>
        <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <Label>{`Item #${index + 1}: ${typeLabel}`}</Label>
              {item.type === 'service' && getStatusBadge(item.status)}
            </div>
            
            <FilterableSelect
                placeholder={`Selecciona un ${typeLabel}`}
                options={itemOptions}
                value={item.item_id}
                onValueChange={handleItemChange}
                disabled={isItemDisabled || item.is_existing}
            />

            <div>
                {item.is_existing ? (
                    <div>
                        <Label>Asignado A:</Label>
                        <Input
                            value={item.user_name || 'No asignado'}
                            disabled
                        />
                    </div>
                ) : (
                    <FilterableSelect
                        label="Asignado A:"
                        placeholder="Asignar profesional"
                        options={availableUsersOptions}
                        value={item.user_id}
                        onValueChange={(value) => onUpdate(index, { user_id: value })}
                        disabled={isItemDisabled || isLoadingAvailableUsers || !item.item_id}
                        searchPlaceholder={isLoadingAvailableUsers ? "Verificando disponibilidad..." : "Buscar profesional"}
                    />
                )}
            </div>
            {!item.is_existing && !isLoadingAvailableUsers && availableUsers?.length === 0 && item.item_id && (
                <p className="text-xs text-red-500 mt-1">No hay personal disponible para este servicio en el horario seleccionado.</p>
            )}

            {item.is_parallel && item.type === 'service' && (
                <div className="mt-4">
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
                            {comboItemsToDisplay.map((comboItem: any, subIndex: number) => (
                                <div key={`${comboItem.id}-${subIndex}`} className="flex items-center justify-between p-2 rounded-md bg-slate-50">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{comboItem.quantity}x {comboItem.item_name || comboItem.name}</p>
                                        <p className="text-xs text-muted-foreground">{comboItem.user_name || 'No asignado'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {comboItem.type === 'service' && getStatusBadge(comboItem.status)}
                                        
                                        {isAttentionEditable && comboItem.type === 'service' && comboItem.status === 'En Proceso' && (
                                            <Button size="xs" variant="destructive" onClick={() => finishServiceMutation.mutate(comboItem.id)}>Finalizar</Button>
                                        )}
                                        
                                        {isAttentionEditable && comboItem.type === 'service' && (comboItem.status === 'Pendiente' || comboItem.status === 'Llamado') && (
                                            <Button size="xs" onClick={() => startServiceMutation.mutate(comboItem.id)}>Iniciar</Button>
                                        )}

                                        {comboItem.type === 'service' && (
                                            <Button
                                                size="icon-xs"
                                                variant="outline"
                                                onClick={() => setEvidenceDialogService(comboItem)}
                                                title="Cargar Evidencia"
                                            >
                                                <UploadCloud className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
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
                    <span>{formatPrice(item.price * item.quantity)}</span>
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

            {/* Service Actions */}
            {item.is_existing && item.type === 'service' && (
                <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2">Acciones del Servicio</h4>
                    <div className="flex gap-2 flex-wrap items-center">
                        {item.status === 'Pendiente' && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => callClientMutation.mutate(item.id)}
                                disabled={callClientMutation.isPending}
                            >
                                {callClientMutation.isPending ? 'Llamando...' : 'Llamar Cliente'}
                            </Button>
                        )}
                        {(item.status === 'Pendiente' || item.status === 'Llamado') && (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => startServiceMutation.mutate(item.id)}
                                disabled={startServiceMutation.isPending}
                            >
                                {startServiceMutation.isPending ? 'Iniciando...' : 'Empezar Servicio'}
                            </Button>
                        )}
                        {item.status === 'En Proceso' && (
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => finishServiceMutation.mutate(item.id)}
                                disabled={finishServiceMutation.isPending}
                            >
                                {finishServiceMutation.isPending ? 'Finalizando...' : 'Finalizar Servicio'}
                            </Button>
                        )}
                        
                        <ServiceTimer 
                            startTime={item.start_time}
                            endTime={item.end_time}
                            status={item.status || 'Pendiente'}
                        />

                        {item.status === 'Finalizado' && (
                            <p className="text-sm text-green-600 p-2 bg-green-50 rounded-md">Servicio finalizado.</p>
                        )}
                         {item.status === 'Llamado' && (
                            <p className="text-sm text-blue-600 p-2 bg-blue-50 rounded-md">Profesional llamado.</p>
                        )}
                        
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEvidenceDialogService(item)}
                        >
                          <UploadCloud className="w-4 h-4 mr-2" />
                          Evidencia
                        </Button>
                    </div>
                </div>
            )}

        </CardContent>
        {canBeParallel && (
            <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-2 right-12"
                onClick={() => onUpdate(index, { is_parallel: !item.is_parallel })}
                disabled={index === 0 || item.is_existing}
                title={index === 0 ? "El primer servicio no puede ser paralelo" : "Marcar como servicio paralelo"}
            >
                <Link className={`h-4 w-4 ${item.is_parallel ? 'text-blue-500' : ''}`} />
            </Button>
        )}
        {isAttentionEditable && (
            <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2" 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(index);
                }} 
                disabled={!canRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        )}
    </Card>
    <Dialog open={!!evidenceDialogService} onOpenChange={(isOpen) => !isOpen && setEvidenceDialogService(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Cargar Evidencia para {evidenceDialogService?.item_name}</DialogTitle>
            </DialogHeader>
            <EvidenceUpload
                attentionServiceId={evidenceDialogService?.id || ''}
                onUploadComplete={() => setEvidenceDialogService(null)}
            />
        </DialogContent>
    </Dialog>
  </>
  );
};

export default ItemFormCard;
