import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ScrollText } from 'lucide-react';
import { usePlanPricing } from '@/hooks/usePlanPricing';
import { Label } from '@/components/ui/label';

// --- Types ---
type BonusConfig = {
  targetAssetKey: string;
  quantity: number | '';
};

type FutureAssetPrice = {
  extra_unit_price: number;
  overage_unit_price: number;
};

type FutureTariffDetails = {
  base_price: number | '';
  effective_date: string;
  asset_prices: Record<string, FutureAssetPrice>;
};

const assetLimitSchema = z.object({
  value: z.union([z.string(), z.boolean()]),
  extra_unit_price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? 0 : parseFloat(String(val)),
    z.number().min(0).default(0)
  ),
  overage_unit_price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? 0 : parseFloat(String(val)),
    z.number().min(0).default(0)
  ),
  bonus_on_extra: z.string().nullable().optional(),
});

const planSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  assets: z.record(assetLimitSchema),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanAsset {
  id: string;
  asset_key: string;
  name: string;
  description: string | null;
  data_type: 'boolean' | 'numeric';
}

export default function PlanForm() {
  const { platformId, planId } = useParams<{ platformId: string; planId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [platformCurrencyId, setPlatformCurrencyId] = useState<string | null>(null);
  const [availableAssets, setAvailableAssets] = useState<PlanAsset[]>([]);
  const [bonuses, setBonuses] = useState<Record<string, BonusConfig>>({});
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [futureTariffDetails, setFutureTariffDetails] = useState<FutureTariffDetails | null>(null);
  const isEditMode = !!planId;

  const { tariffs, isLoadingTariffs, scheduleNewTariff, isScheduling } = usePlanPricing(planId || '');

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
      assets: {},
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!platformId) return;
      setLoading(true);
      try {
        // Fetch all data in parallel
        const platformPromise = supabase.functions.invoke('superadmin-actions', {
          body: { action: 'get_platform_by_id', payload: { platformId } },
        });
        const assetsPromise = supabase.functions.invoke('superadmin-actions', {
          body: { action: 'get_plan_assets_by_platform', payload: { platformId } },
        });
        const planPromise = isEditMode && planId
          ? supabase.functions.invoke('superadmin-actions', {
              body: { action: 'get_subscription_plan_by_id', payload: { planId } },
            })
          : Promise.resolve({ data: null, error: null });
        const limitsPromise = isEditMode && planId
          ? supabase.functions.invoke('superadmin-actions', {
              body: { action: 'get_plan_asset_limits', payload: { planId } },
            })
          : Promise.resolve({ data: [], error: null });

        const [platformResult, assetsResult, planResult, limitsResult] = await Promise.all([
          platformPromise,
          assetsPromise,
          planPromise,
          limitsPromise,
        ]);

        if (platformResult.error) throw platformResult.error;
        if (assetsResult.error) throw assetsResult.error;
        if (planResult.error) throw planResult.error;
        if (limitsResult.error) throw limitsResult.error;

        // Set Platform Currency
        if (!platformResult.data?.default_currency_id) {
          throw new Error("La plataforma no tiene una moneda por defecto configurada.");
        }
        setPlatformCurrencyId(platformResult.data.default_currency_id);

        const fetchedAssets = assetsResult.data || [];
        setAvailableAssets(fetchedAssets);

        const planDetails = planResult.data;
        const limits = limitsResult.data || [];
        
        const initialAssetValues: Record<string, any> = {};
        const initialBonuses: Record<string, BonusConfig> = {};

        fetchedAssets.forEach(asset => {
          const limit = limits.find((l: any) => l.asset_id === asset.id);
          
          if (limit && limit.bonus_on_extra) {
            try {
              const parsedBonus = typeof limit.bonus_on_extra === 'string' 
                ? JSON.parse(limit.bonus_on_extra) 
                : limit.bonus_on_extra;
              
              initialBonuses[asset.id] = {
                targetAssetKey: parsedBonus.asset_key || '',
                quantity: parsedBonus.quantity || '',
              };
            } catch (e) {
              console.error("Error parsing bonus JSON:", limit.bonus_on_extra);
              initialBonuses[asset.id] = { targetAssetKey: '', quantity: '' };
            }
          } else {
            initialBonuses[asset.id] = { targetAssetKey: '', quantity: '' };
          }

          if (asset.data_type === 'boolean') {
            initialAssetValues[asset.asset_key] = {
              value: limit ? limit.value === 'true' : false
            };
          } else {
            initialAssetValues[asset.asset_key] = {
              value: limit ? limit.value : '0',
              extra_unit_price: limit ? limit.extra_unit_price : 0,
              overage_unit_price: limit ? limit.overage_unit_price : 0,
              bonus_on_extra: limit && limit.bonus_on_extra ? JSON.stringify(limit.bonus_on_extra) : null
            };
          }
        });

        setBonuses(initialBonuses);

        form.reset({
          name: planDetails?.name ?? '',
          description: planDetails?.description ?? '',
          is_active: planDetails?.is_active ?? true,
          assets: initialAssetValues,
        });

      } catch (err: any) {
        toast({ title: "Error al cargar datos", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [platformId, planId, isEditMode, form, toast]);

  useEffect(() => {
    Object.keys(bonuses).forEach(assetId => {
      const asset = availableAssets.find(a => a.id === assetId);
      if (!asset) return;

      const bonusConfig = bonuses[assetId];
      if (bonusConfig && bonusConfig.targetAssetKey && bonusConfig.quantity > 0) {
        const jsonValue = JSON.stringify({
          asset_key: bonusConfig.targetAssetKey,
          quantity: bonusConfig.quantity
        });
        form.setValue(`assets.${asset.asset_key}.bonus_on_extra`, jsonValue);
      } else {
        form.setValue(`assets.${asset.asset_key}.bonus_on_extra`, null);
      }
    });
  }, [bonuses, availableAssets, form]);

  const onSubmit = async (values: PlanFormValues) => {
    if (!platformCurrencyId) {
      toast({ title: "Error", description: "No se ha podido determinar la moneda de la plataforma.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const planPayload = { name: values.name, description: values.description, is_active: values.is_active };
      const planAction = isEditMode ? 'update_subscription_plan' : 'create_subscription_plan';
      const planApiPayload = isEditMode
        ? { planId, planData: planPayload }
        : { planData: { ...planPayload, platform_id: platformId } };

      const { data: planResult, error: planError } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: planAction, payload: planApiPayload },
      });
      if (planError) throw planError;
      
      const currentPlanId = isEditMode ? planId! : planResult.id;

      const limitsToUpdate = availableAssets.map(asset => {
        const assetValue = values.assets[asset.asset_key];
        let bonusJson = null;
        if (assetValue.bonus_on_extra && typeof assetValue.bonus_on_extra === 'string' && assetValue.bonus_on_extra.trim() !== '') {
          try {
            bonusJson = JSON.parse(assetValue.bonus_on_extra);
          } catch (e) {
            throw new Error(`El JSON de bonificación para "${asset.name}" no es válido.`);
          }
        }
        if (asset.data_type === 'boolean') {
          return { asset_id: asset.id, value: String(assetValue.value ?? false) };
        }
        return {
          asset_id: asset.id,
          value: String(assetValue.value ?? 0),
          extra_unit_price: assetValue.extra_unit_price ?? 0,
          overage_unit_price: assetValue.overage_unit_price ?? 0,
          bonus_on_extra: bonusJson,
        };
      });

      const { error: limitsError } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'update_plan_asset_limits', payload: { planId: currentPlanId, limits: limitsToUpdate } },
      });
      if (limitsError) throw limitsError;

      if (!isEditMode) {
        const numericAssets = availableAssets.filter(a => a.data_type === 'numeric');
        const assetPricesData = numericAssets.map(asset => {
          const assetValue = values.assets[asset.asset_key];
          return {
            asset_id: asset.id,
            extra_unit_price: assetValue.extra_unit_price ?? 0,
            overage_unit_price: assetValue.overage_unit_price ?? 0,
          };
        });

        const tariffData = {
          subscription_plan_id: currentPlanId,
          effective_date: new Date().toISOString(),
          base_price: 0,
          currency_id: platformCurrencyId,
        };

        await scheduleNewTariff({ tariffData, assetPricesData });
      }

      toast({ title: `Plan ${isEditMode ? 'actualizado' : 'creado'} con éxito` });
      navigate(`/superadmin/platforms/${platformId}/plans`);

    } catch (err: any) {
      toast({ title: "Error al guardar el plan", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPriceDialog = () => {
    const currentAssetPrices: Record<string, FutureAssetPrice> = {};
    availableAssets
      .filter(asset => asset.data_type === 'numeric')
      .forEach(asset => {
        const currentValues = form.getValues(`assets.${asset.asset_key}`);
        currentAssetPrices[asset.id] = {
          extra_unit_price: currentValues.extra_unit_price ?? 0,
          overage_unit_price: currentValues.overage_unit_price ?? 0,
        };
      });

    setFutureTariffDetails({
      base_price: tariffs[0]?.base_price ?? '',
      effective_date: '',
      asset_prices: currentAssetPrices,
    });
    setIsPriceDialogOpen(true);
  };

  const handleFuturePriceChange = (assetId: string, field: keyof FutureAssetPrice, value: string) => {
    if (!futureTariffDetails) return;
    const parsedValue = value === '' ? 0 : parseFloat(value);
    setFutureTariffDetails(prev => ({
      ...prev!,
      asset_prices: {
        ...prev!.asset_prices,
        [assetId]: {
          ...prev!.asset_prices[assetId],
          [field]: parsedValue,
        },
      },
    }));
  };

  const handleScheduleTariff = () => {
    if (!platformCurrencyId) {
      toast({ title: "Error", description: "No se ha podido determinar la moneda de la plataforma.", variant: "destructive" });
      return;
    }
    if (!planId || !futureTariffDetails || futureTariffDetails.base_price === '' || !futureTariffDetails.effective_date) {
      toast({ title: "Error", description: "El precio base y la fecha son obligatorios.", variant: "destructive" });
      return;
    }

    const assetPricesData = Object.entries(futureTariffDetails.asset_prices).map(([asset_id, prices]) => ({
      asset_id,
      extra_unit_price: prices.extra_unit_price,
      overage_unit_price: prices.overage_unit_price,
    }));

    const tariffData = {
      subscription_plan_id: planId,
      base_price: futureTariffDetails.base_price,
      effective_date: futureTariffDetails.effective_date,
      currency_id: platformCurrencyId,
    };

    scheduleNewTariff(
      { tariffData, assetPricesData },
      {
        onSuccess: () => {
          toast({ title: "Éxito", description: "Nueva tarifa programada correctamente." });
          setIsPriceDialogOpen(false);
          setFutureTariffDetails(null);
        },
        onError: (error) => {
          toast({ title: "Error al programar tarifa", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  const currentTariff = tariffs[0];
  const futureTariffs = tariffs.slice(1);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/superadmin/platforms/${platformId}/plans`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Editar Plan de Suscripción' : 'Crear Nuevo Plan'}</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Plan</CardTitle>
              <CardDescription>Define los detalles básicos, límites y precios de características para este plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="assets">Activos y Límites</TabsTrigger>
                  {isEditMode && <TabsTrigger value="pricing">Tarifas y Precios</TabsTrigger>}
                </TabsList>

                {/* Pestaña General */}
                <TabsContent value="general" className="pt-6">
                  <div className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre del Plan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="is_active" render={({ field }) => ( <FormItem className="flex items-center gap-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Activo</FormLabel></FormItem> )} />
                  </div>
                </TabsContent>

                {/* Pestaña Activos y Límites */}
                <TabsContent value="assets" className="pt-6">
                  <div className="space-y-6">
                    {availableAssets.length > 0 ? availableAssets.map(asset => (
                      <div key={asset.id} className="p-4 border rounded-md space-y-4">
                        <div className="flex flex-col">
                          <h4 className="font-semibold">{asset.name}</h4>
                          {asset.description && <p className="text-sm text-muted-foreground">{asset.description}</p>}
                        </div>
                        
                        {asset.data_type === 'boolean' ? (
                          <FormField
                            control={form.control}
                            name={`assets.${asset.asset_key}.value`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5"><FormLabel>Habilitado</FormLabel></div>
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              </FormItem>
                            )}
                          />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField control={form.control} name={`assets.${asset.asset_key}.value`} render={({ field }) => ( <FormItem><FormLabel>Límite Incluido</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name={`assets.${asset.asset_key}.extra_unit_price`} render={({ field }) => ( <FormItem><FormLabel>Precio Unitario Extra</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name={`assets.${asset.asset_key}.overage_unit_price`} render={({ field }) => ( <FormItem><FormLabel>Precio Excedente</FormLabel><FormControl><Input type="number" step="0.0001" {...field} /></FormControl><FormMessage /></FormItem> )} />
                          </div>
                        )}
                        {asset.data_type === 'numeric' && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">Bonificación por Unidad Extra</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md">
                              <FormItem>
                                <FormLabel>Activo a Bonificar</FormLabel>
                                <Select
                                  value={bonuses[asset.id]?.targetAssetKey || ''}
                                  onValueChange={(value) => {
                                    const newTarget = value === 'none' ? '' : value;
                                    setBonuses(prev => ({ ...prev, [asset.id]: { ...prev[asset.id], targetAssetKey: newTarget }}));
                                  }}
                                >
                                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar activo..." /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">Ninguno</SelectItem>
                                    {availableAssets.filter(a => a.id !== asset.id && a.data_type === 'numeric').map(bonusAsset => ( <SelectItem key={bonusAsset.id} value={bonusAsset.asset_key}>{bonusAsset.name}</SelectItem> ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                              <FormItem>
                                <FormLabel>Cantidad Bonificada</FormLabel>
                                <FormControl><Input type="number" value={bonuses[asset.id]?.quantity || ''} onChange={(e) => { const quantity = e.target.value === '' ? '' : parseInt(e.target.value, 10); setBonuses(prev => ({ ...prev, [asset.id]: { ...prev[asset.id], quantity }})); }} placeholder="Ej: 500" disabled={!bonuses[asset.id]?.targetAssetKey} /></FormControl>
                              </FormItem>
                            </div>
                          </div>
                        )}
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No hay activos definidos para esta plataforma. Ve al Catálogo de Activos para añadirlos.</p>}
                  </div>
                </TabsContent>

                {/* Pestaña Tarifas y Precios */}
                {isEditMode && (
                  <TabsContent value="pricing" className="pt-6">
                    <div className="space-y-4">
                       <Card>
                         <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Gestión de Tarifas</CardTitle>
                                    <CardDescription>Consulta las tarifas activas y programa cambios de precios a futuro.</CardDescription>
                                </div>
                                <Button type="button" variant="outline" onClick={handleOpenPriceDialog}>
                                    <ScrollText className="mr-2 h-4 w-4" />
                                    Programar Nueva Tarifa
                                </Button>
                            </div>
                         </CardHeader>
                         <CardContent className="p-4 space-y-4">
                           <div>
                             <p className="font-semibold">Tarifa Actual (Desde {currentTariff ? new Date(currentTariff.effective_date).toLocaleDateString() : 'N/A'}):</p>
                             <span>{isLoadingTariffs ? 'Cargando...' : `Precio Base: ${currentTariff?.base_price ?? 'No definido'} COP`}</span>
                           </div>
                           <div>
                             <p className="font-semibold">Próximas Tarifas Programadas:</p>
                             {isLoadingTariffs ? <p>Cargando...</p> : (
                               <ul className="list-disc pl-5">
                                 {futureTariffs.map(t => ( <li key={t.id}>{`Desde ${new Date(t.effective_date).toLocaleDateString()}: ${t.base_price} COP`}</li> ))}
                               </ul>
                             )}
                           </div>
                         </CardContent>
                       </Card>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || isScheduling}>
              {loading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Plan')}
            </Button>
          </div>
        </form>
      </Form>

      {/* --- Dialog for Scheduling New Tariff --- */}
      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Programar Nueva Tarifa</DialogTitle></DialogHeader>
          {futureTariffDetails && (
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <p className="text-sm text-muted-foreground">
                Define los precios que entrarán en vigor en una fecha futura. Estos cambios no afectarán a la tarifa actual.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newBasePrice">Nuevo Precio Base (COP)</Label>
                  <Input 
                    id="newBasePrice"
                    type="number" 
                    value={futureTariffDetails.base_price} 
                    onChange={e => setFutureTariffDetails(prev => ({...prev!, base_price: e.target.value === '' ? '' : Number(e.target.value)}))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEffectiveDate">Fecha de Efectividad</Label>
                  <Input 
                    id="newEffectiveDate"
                    type="date" 
                    value={futureTariffDetails.effective_date} 
                    onChange={e => setFutureTariffDetails(prev => ({...prev!, effective_date: e.target.value}))} 
                  />
                </div>
              </div>
              <Separator />
              <h4 className="text-md font-medium">Precios de Activos para esta Tarifa</h4>
              <div className="space-y-4">
                {availableAssets.filter(a => a.data_type === 'numeric').map(asset => (
                  <div key={asset.id} className="p-3 border rounded-md">
                    <p className="font-semibold">{asset.name}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor={`extra_price_${asset.id}`}>Precio Unitario Extra</Label>
                        <Input 
                          id={`extra_price_${asset.id}`}
                          type="number"
                          step="0.01"
                          value={futureTariffDetails.asset_prices[asset.id]?.extra_unit_price ?? ''}
                          onChange={e => handleFuturePriceChange(asset.id, 'extra_unit_price', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`overage_price_${asset.id}`}>Precio Excedente</Label>
                        <Input 
                          id={`overage_price_${asset.id}`}
                          type="number"
                          step="0.0001"
                          value={futureTariffDetails.asset_prices[asset.id]?.overage_unit_price ?? ''}
                          onChange={e => handleFuturePriceChange(asset.id, 'overage_unit_price', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleScheduleTariff} disabled={isScheduling}>
              {isScheduling ? 'Programando...' : 'Confirmar y Programar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}