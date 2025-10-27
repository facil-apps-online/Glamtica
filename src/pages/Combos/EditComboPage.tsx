import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, ChevronsUpDown, Link, ArrowLeft, Save } from "lucide-react";
import { useGetCombos, useUpdateCombo } from "@/hooks/useCombos";
import { useMasterProducts } from "@/hooks/useProducts";
import { useMasterServices } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";
import { debounce } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatterBox } from "@/components/ChatterBox";
import { useQueryClient } from "@tanstack/react-query";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComboBranchesTab } from "@/components/ComboBranchesTab";

type SelectableItem = {
    value: string;
    label: string;
    data: any;
    type: 'product' | 'service';
};

const EditComboPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const screenSize = useScreenSize();
    const isSmallScreen = screenSize === 'sm' || screenSize === 'md';
    const [activeTab, setActiveTab] = useState("details");

    const { data: combos, isLoading: isLoadingCombos } = useGetCombos();
    const combo = combos?.find(c => c.id === id);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [sku, setSku] = useState("");
    const [items, setItems] = useState<any[]>([]);
    const [itemSearchTerm, setItemSearchTerm] = useState("");
    const [initialComboState, setInitialComboState] = useState<any>(null);

    const debouncedSetItemSearchTerm = useMemo(() => debounce(setItemSearchTerm, 300), []);

    const { mutate: updateCombo, isPending: isUpdating } = useUpdateCombo();

    const { data: masterProducts, isLoading: isLoadingProducts } = useMasterProducts(itemSearchTerm, true, "", "");
    const { data: masterServices, isLoading: isLoadingServices } = useMasterServices(itemSearchTerm, true, "");

    const selectableItems = useMemo<SelectableItem[]>(() => {
        const productItems = masterProducts?.map(p => ({ value: `product-${p.id}`, label: `[P] ${p.name}`, data: p, type: 'product' as const })) || [];
        const serviceItems = masterServices?.map(s => ({ value: `service-${s.id}`, label: `[S] ${s.name}`, data: s, type: 'service' as const })) || [];
        const combined = [...productItems, ...serviceItems];
        combined.sort((a, b) => a.label.localeCompare(b.label));
        return combined;
    }, [masterProducts, masterServices]);

    useEffect(() => {
        if (combo) {
            setName(combo.name || "");
            setDescription(combo.description || "");
            setSku(combo.sku || "");
            const initialItems = combo.combo_items.map(item => ({
                ...item,
                name: item.product?.name || item.service?.name || 'Ítem desconocido',
                product: item.product,
                service: item.service,
                duration: item.service?.duration_minutes || 0,
            }));
            setItems(initialItems);
            setInitialComboState({ name: combo.name || "", description: combo.description || "", sku: combo.sku || "", items: initialItems });
        }
    }, [combo]);

    const handleAddItem = (item: SelectableItem) => {
        const newItem = {
            product_id: item.type === 'product' ? item.data.id : null,
            service_id: item.type === 'service' ? item.data.id : null,
            quantity: 1,
            price: item.data.base_price || 0,
            name: item.label,
            product: item.type === 'product' ? item.data : null,
            service: item.type === 'service' ? item.data : null,
            duration: item.type === 'service' ? item.data.duration_minutes : 0,
            offset_minutes: 0,
            is_parallel: false,
        };
        setItems(prev => [...prev, newItem]);
        setItemSearchTerm("");
    };

    const handleUpdateItem = (index: number, field: 'quantity' | 'price' | 'offset_minutes' | 'is_parallel', value: number | boolean) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const hasChanges = () => {
        if (!initialComboState) return false;
        if (name !== initialComboState.name) return true;
        if (description !== initialComboState.description) return true;
        if (sku !== initialComboState.sku) return true;
        if (items.length !== initialComboState.items.length) return true;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const initialItem = initialComboState.items[i];
            if (item.product_id !== initialItem.product_id) return true;
            if (item.service_id !== initialItem.service_id) return true;
            if (item.quantity !== initialItem.quantity) return true;
            if (item.price !== initialItem.price) return true;
            if (item.offset_minutes !== initialItem.offset_minutes) return true;
            if (item.is_parallel !== initialItem.is_parallel) return true;
        }
        return false;
    };

    const handleSuccess = () => {
        toast({ title: "Éxito", description: "Combo actualizado correctamente.", variant: "success" });
        queryClient.invalidateQueries({ queryKey: ['chatter', 'combos', id] });
        queryClient.invalidateQueries({ queryKey: ['combos'] });
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

        const comboData = { name, description, sku };
        const finalItems = items.map(({ product_id, service_id, quantity, price, offset_minutes, is_parallel }) => ({ 
            product_id, 
            service_id, 
            quantity, 
            price: price || 0, 
            offset_minutes: offset_minutes || 0,
            is_parallel: is_parallel || false,
        }));

        if (combo) {
            updateCombo({ id: combo.id, ...comboData, items: finalItems }, { onSuccess: handleSuccess });
        }
    };

    if (isLoadingCombos) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/4" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!combo) {
        return <div>Combo no encontrado o no tienes permiso para verlo.</div>;
    }

    return (
        <div className="space-y-8">
            <PageHeader 
                title={combo.name} 
                subtitle="Gestiona todos los aspectos de tu combo."
                backButton={
                    <Button variant="outline" size="icon" onClick={() => navigate('/app/combos')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                }
            />
            <div className={`grid ${isSmallScreen ? 'grid-cols-1' : 'grid-cols-3'} gap-8`}>
                <div className="lg:col-span-2 space-y-6">
                    {isSmallScreen ? (
                        <Select onValueChange={setActiveTab} value={activeTab}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar una sección..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="details">Detalles</SelectItem>
                                <SelectItem value="branches">Sucursales</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Detalles</TabsTrigger>
                                <TabsTrigger value="branches">Sucursales</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {activeTab === 'details' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className={`grid ${isSmallScreen ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                                        <div className="space-y-2"><Label htmlFor="name">Nombre del Combo</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                                        <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Ítems del Combo</CardTitle></CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                            Añadir producto o servicio...
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                            <CommandInput 
                                                placeholder="Buscar ítem..." 
                                                onValueChange={debouncedSetItemSearchTerm}
                                            />
                                            <CommandList>
                                                {isLoadingProducts || isLoadingServices ? (
                                                <div className="p-2 text-center text-sm">Cargando...</div>
                                                ) : (
                                                <>
                                                    <CommandEmpty>No se encontraron ítems.</CommandEmpty>
                                                    <CommandGroup>
                                                    {selectableItems.map((item) => (
                                                        <CommandItem key={item.value} onSelect={() => { handleAddItem(item); }}>
                                                        {item.label}
                                                        </CommandItem>
                                                    ))}
                                                    </CommandGroup>
                                                </>
                                                )}
                                            </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {items.length > 0 && !isSmallScreen && (
                                    <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground font-medium">
                                        <div className="w-10" />
                                        <div className="flex-grow">Ítem</div>
                                        <div className="w-28 text-center">Desfase (min)</div>
                                        <div className="w-20 text-center">Cantidad</div>
                                        <div className="w-28 text-center">Precio</div>
                                        <div className="w-10" />
                                    </div>
                                    )}
                                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                        {items.map((item, index) => (
                                            isSmallScreen ? (
                                                <div key={index} className="p-4 border rounded-md space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-medium text-sm flex-grow">{item.name}</div>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}><X className="h-4 w-4" /></Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Cantidad</Label>
                                                            <Input 
                                                                type="number" 
                                                                placeholder="Cant." 
                                                                value={item.quantity} 
                                                                onChange={(e) => {
                                                                    const isDecimalAllowed = item.product?.allow_decimal_sale;
                                                                    const value = isDecimalAllowed ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                                                                    handleUpdateItem(index, 'quantity', value || 0);
                                                                }}
                                                                min={item.product?.allow_decimal_sale ? 0.01 : 1}
                                                                step={item.product?.allow_decimal_sale ? 0.01 : 1}
                                                                disabled={item.service_id !== null}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Precio</Label>
                                                            <Input type="number" placeholder="Precio" value={item.price} onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value))} min={0} step="0.01" />
                                                        </div>
                                                    </div>
                                                    {item.service_id && (
                                                        <div className="space-y-2">
                                                            <Label>Desfase (min)</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder="Desfase" 
                                                                    value={item.offset_minutes || 0} 
                                                                    onChange={(e) => handleUpdateItem(index, 'offset_minutes', parseInt(e.target.value, 10) || 0)} 
                                                                    min={0}
                                                                    disabled={!item.is_parallel}
                                                                />
                                                                <Button 
                                                                    type="button"
                                                                    variant="outline" 
                                                                    size="icon" 
                                                                    onClick={() => handleUpdateItem(index, 'is_parallel', !item.is_parallel)}
                                                                    disabled={index === 0}
                                                                    title={index === 0 ? "El primer ítem no puede ser paralelo" : "Marcar como paralelo"}
                                                                >
                                                                    <Link className={`h-4 w-4 ${item.is_parallel ? 'text-blue-500' : ''}`} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                            <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                                <div className="w-10">
                                                    {item.service_id && (
                                                    <Button 
                                                        type="button"
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleUpdateItem(index, 'is_parallel', !item.is_parallel)}
                                                        disabled={index === 0}
                                                        title={index === 0 ? "El primer ítem no puede ser paralelo" : "Marcar como paralelo"}
                                                    >
                                                        <Link className={`h-4 w-4 ${item.is_parallel ? 'text-blue-500' : ''}`} />
                                                    </Button>
                                                    )}
                                                </div>
                                                <div className="flex-grow font-medium text-sm">{item.name}</div>
                                                <div className="w-28">
                                                    {item.service_id && (
                                                    <Input 
                                                        type="number" 
                                                        placeholder="Desfase" 
                                                        value={item.offset_minutes || 0} 
                                                        onChange={(e) => handleUpdateItem(index, 'offset_minutes', parseInt(e.target.value, 10) || 0)} 
                                                        min={0}
                                                        disabled={!item.is_parallel}
                                                    />
                                                    )}
                                                </div>
                                                <div className="w-20">
                                                    <Input 
                                                    type="number" 
                                                    placeholder="Cant." 
                                                    value={item.quantity} 
                                                    onChange={(e) => {
                                                        const isDecimalAllowed = item.product?.allow_decimal_sale;
                                                        const value = isDecimalAllowed ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                                                        handleUpdateItem(index, 'quantity', value || 0);
                                                    }}
                                                    min={item.product?.allow_decimal_sale ? 0.01 : 1}
                                                    step={item.product?.allow_decimal_sale ? 0.01 : 1}
                                                    disabled={item.service_id !== null}
                                                    />
                                                </div>
                                                <div className="w-28">
                                                    <Input type="number" placeholder="Precio" value={item.price} onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value))} min={0} step="0.01" />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}><X className="h-4 w-4" /></Button>
                                            </div>
                                            )
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end gap-2 mt-8">
                                <Button type="submit" disabled={isUpdating || !hasChanges()}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </form>
                    )}
                    {activeTab === 'branches' && (
                        <ComboBranchesTab combo={combo} />
                    )}
                </div>
                <div className="lg:col-span-1 space-y-6">
                     {combo && (
                        <ChatterBox 
                            resourceType="combos" 
                            resourceId={combo.id} 
                            tenantId={combo.tenant_id} 
                            containerClassName="h-[calc(100vh-22rem)]" 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditComboPage;