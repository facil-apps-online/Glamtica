import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Treatment, TreatmentCategory } from '@/hooks/useTreatments';
import { useTreatmentCategories } from "@/hooks/useTreatmentCategories";
import { useSelectableProductServices } from '@/hooks/useProductServicesSelection';
import { PlusCircle, Trash2, ChevronsUpDown, Check, Save, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MultiSelect } from "@/components/ui/MultiSelect";
import { TreatmentCategoryDialog } from "./TreatmentCategoryDialog";

// Schema definitions
const sessionSchema = z.object({
  session_number: z.number().int().min(1).optional(),
  name: z.string().min(3, "El nombre de la sesión es requerido."),
  description: z.string().optional(),
  payment_type: z.enum(['none', 'percentage', 'fixed']).optional().default('none'),
  payment_percentage: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || Number.isNaN(val)) ? null : Number(val),
    z.number().min(0).max(100).nullable().optional()
  ),
  fixed_payment_amount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || Number.isNaN(val)) ? null : Number(val),
    z.number().min(0).nullable().optional()
  ),
  items: z.array(z.object({
    item_id: z.string().uuid("ID de ítem inválido."),
    item_name: z.string().min(1, "El nombre del ítem es requerido."),
    type: z.enum(["product", "service"], { required_error: "El tipo de ítem es requerido." }),
    quantity: z.number().int().min(1, "La cantidad debe ser al menos 1."),
  })).min(1, "Cada sesión debe tener al menos un ítem."),
}).refine(data => !(data.payment_percentage && data.fixed_payment_amount), {
  message: "Defina un porcentaje o un monto fijo, no ambos.",
  path: ["payment_percentage"],
});

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  category_ids: z.array(z.string()).optional(),
  upfront_price: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0, "El precio no puede ser negativo.").optional()
  ),
  financed_price: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0, "El precio no puede ser negativo.").optional()
  ),
  sessions: z.array(sessionSchema).min(1, "El tratamiento debe tener al menos una sesión."),
}).superRefine((val, ctx) => {
    if (val.financed_price && val.financed_price > 0) {
      const totalPercentage = val.sessions.reduce((sum, s) => sum + (s.payment_percentage || 0), 0);
      const totalFixed = val.sessions.reduce((sum, s) => sum + (s.fixed_payment_amount || 0), 0);

      if (totalPercentage > 0 && totalFixed > 0) {
        ctx.addIssue({ code: "custom", message: "No mezcle pagos por % y montos fijos.", path: ['sessions'] });
      } else if (totalPercentage > 0 && totalPercentage !== 100) {
        ctx.addIssue({ code: "custom", message: `La suma de porcentajes debe ser 100% (actual: ${totalPercentage}%).`, path: ['sessions'] });
      }
    }
});

type FormData = z.infer<typeof formSchema>;

interface TreatmentFormProps {
    treatment?: Partial<Treatment>;
    onSave: (data: any, categoryIds: string[]) => void;
    isSaving: boolean;
    submitButtonText?: string;
}

export const TreatmentForm: React.FC<TreatmentFormProps> = ({ treatment, onSave, isSaving, submitButtonText = "Crear Tratamiento" }) => {
  const { data: categories, isLoading: isLoadingCategories } = useTreatmentCategories();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      upfront_price: 0,
      financed_price: 0,
      sessions: [],
    },
  });
  
  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = form;

  const { fields: sessionFields, append: appendSession, remove: removeSession } = useFieldArray({
    control: control,
    name: "sessions",
  });

  const sessions = useWatch({ control, name: "sessions" });

  useEffect(() => {
    if (treatment?.categories) {
      setSelectedCategoryIds(treatment.categories.map(c => c.treatment_categories.id));
    }
  }, [treatment]);

  useEffect(() => {
    if (sessions && Array.isArray(sessions)) {
      const isFixedAmountMode = sessions.some(s => s.payment_type === 'fixed');
      const isPercentageMode = sessions.some(s => s.payment_type === 'percentage');

      if (isFixedAmountMode && !isPercentageMode) {
        const totalFixed = sessions.reduce((sum, s) => sum + (s.fixed_payment_amount || 0), 0);
        setValue('financed_price', totalFixed, { shouldValidate: true });
      }
    }
  }, [sessions, setValue]);

  useEffect(() => {
    if (treatment) {
      const resetSessions = treatment.sessions?.map(s => {
        let payment_type: 'none' | 'percentage' | 'fixed' = 'none';
        if (s.payment_percentage) payment_type = 'percentage';
        else if (s.fixed_payment_amount) payment_type = 'fixed';
        
        return {
          ...s,
          payment_type,
          items: s.items?.map(i => ({
              item_id: i.product_id || i.service_id || '',
              item_name: "Cargando...",
              type: i.product_id ? 'product' : 'service',
              quantity: i.quantity,
          })) || []
        };
      }) || [];

      reset({
        name: treatment.name,
        description: treatment.description,
        upfront_price: treatment.upfront_price,
        financed_price: treatment.financed_price,
        sessions: resetSessions,
      });
    }
  }, [treatment, reset]);

  const onSubmit = (data: FormData) => {
    const { category_ids, ...restOfData } = data;
    const mappedData = {
        ...restOfData,
        type: 'treatment' as const,
        upfront_price: data.upfront_price || 0,
        financed_price: data.financed_price || 0,
        sessions: data.sessions.map((s, index) => ({
            ...s,
            session_number: index + 1,
            payment_percentage: s.payment_type === 'percentage' ? s.payment_percentage : null,
            fixed_payment_amount: s.payment_type === 'fixed' ? s.fixed_payment_amount : null,
            items: s.items.map(i => ({
                product_id: i.type === 'product' ? i.item_id : null,
                service_id: i.type === 'service' ? i.item_id : null,
                quantity: i.quantity,
            }))
        }))
    };
    onSave(mappedData, selectedCategoryIds);
  };

  const isFixedAmountMode = sessions?.some(s => s.payment_type === 'fixed') && !sessions?.some(s => s.payment_type === 'percentage');

  const categoryOptions = categories?.map(c => ({ value: c.id, label: c.name })) || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre del Tratamiento</Label>
          <Input {...register("name")} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>
                <div className="space-y-2">
                    <Label>Categorías</Label>
                    <div className="flex items-center gap-2"> {/* New flex container */}
                        <div className="flex-grow"> {/* MultiSelect takes most space */}
                            <MultiSelect
                                options={categoryOptions}
                                selected={selectedCategoryIds}
                                onSelectedChange={setSelectedCategoryIds}
                                placeholder="Seleccionar categorías..."
                                className="w-full"
                            />
                        </div>
                        <TreatmentCategoryDialog
                            isOpen={isCategoryDialogOpen}
                            onOpenChange={setIsCategoryDialogOpen}
                            trigger={
                                <Button type="button" variant="outline" size="icon">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            }
                        />
                    </div>
                </div>      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea {...register("description")} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Precio de Contado</Label><Input type="number" step="0.01" {...register("upfront_price")} />{errors.upfront_price && <p className="text-red-500 text-sm">{errors.upfront_price.message}</p>}</div>
        <div className="space-y-2"><Label>Precio Financiado</Label><Input type="number" step="0.01" {...register("financed_price")} disabled={isFixedAmountMode} />{errors.financed_price && <p className="text-red-500 text-sm">{errors.financed_price.message}</p>}</div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sesiones</h3>
        {errors.sessions?.root && <p className="text-red-500 text-sm">{errors.sessions.root.message}</p>}
        {errors.sessions && typeof errors.sessions.message === 'string' && (<p className="text-red-500 text-sm">{errors.sessions.message}</p>)}
        {sessionFields.map((session, sessionIndex) => (
          <div key={session.id} className="p-4 border rounded-md space-y-4">
            <div className="flex justify-between items-center"><h4 className="font-medium">Sesión {sessionIndex + 1}</h4><Button type="button" variant="ghost" size="sm" onClick={() => removeSession(sessionIndex)}><Trash2 className="w-4 h-4 mr-2"/> Eliminar Sesión</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nombre Sesión</Label><Input {...register(`sessions.${sessionIndex}.name`)} />{errors.sessions?.[sessionIndex]?.name && <p className="text-red-500 text-sm">{errors.sessions?.[sessionIndex]?.name?.message}</p>}</div>
              <div className="space-y-2"><Label>Descripción Sesión</Label><Input {...register(`sessions.${sessionIndex}.description`)} /></div>
            </div>
            
            <div className="bg-muted/50 rounded-lg space-y-3 p-4">
              <Label>Cuota de Pago (para Precio Financiado)</Label>
              <SessionPaymentFields sessionIndex={sessionIndex} control={control} register={register} setValue={setValue} />
              {errors.sessions?.[sessionIndex]?.payment_percentage && <p className="text-red-500 text-sm">{errors.sessions?.[sessionIndex]?.payment_percentage?.message}</p>}
            </div>
            
            <div className="space-y-3 pt-3 border-t"><h5 className="font-semibold text-sm">Ítems de Sesión</h5><SessionItemsFieldArray sessionIndex={sessionIndex} control={control} register={register} setValue={setValue} /></div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendSession({ name: `Sesión ${sessionFields.length + 1}`, description: "", items: [] })}><PlusCircle className="w-4 h-4 mr-2" /> Añadir Sesión</Button>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {submitButtonText}
        </Button>
      </div>
    </form>
  );
}

// Copied sub-components
interface SessionPaymentFieldsProps {
    sessionIndex: number;
    control: any;
    register: any;
    setValue: any;
}

function SessionPaymentFields({ sessionIndex, control, register, setValue }: SessionPaymentFieldsProps) {
    const paymentType = useWatch({
        control,
        name: `sessions.${sessionIndex}.payment_type`,
        defaultValue: 'none'
    });

    return (
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Tipo de Pago</Label>
                <Controller
                    name={`sessions.${sessionIndex}.payment_type`}
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            setValue(`sessions.${sessionIndex}.payment_percentage`, null);
                            setValue(`sessions.${sessionIndex}.fixed_payment_amount`, null);
                        }} value={field.value || 'none'}>
                            <SelectTrigger><SelectValue placeholder="Tipo de cuota" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin Pago</SelectItem>
                                <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                <SelectItem value="fixed">Monto Fijo</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            {paymentType === 'percentage' && (
                <div className="space-y-2"><Label>Porcentaje</Label><Input type="number" placeholder="%" {...register(`sessions.${sessionIndex}.payment_percentage`, { valueAsNumber: true })} /></div>
            )}
            {paymentType === 'fixed' && (
                <div className="space-y-2"><Label>Monto Fijo</Label><Input type="number" placeholder="Monto" step="0.01" {...register(`sessions.${sessionIndex}.fixed_payment_amount`, { valueAsNumber: true })} /></div>
            )}
        </div>
    );
}

interface SessionItemsFieldArrayProps {
    sessionIndex: number;
    control: any;
    register: any;
    setValue: any;
}

function SessionItem({ sessionIndex, itemIndex, control, register, setValue, onRemove }: { sessionIndex: number; itemIndex: number; control: any; register: any; setValue: any; onRemove: (index: number) => void; }) {
    const { data: selectableItems, isLoading } = useSelectableProductServices();

    const itemType = useWatch({
        control,
        name: `sessions.${sessionIndex}.items.${itemIndex}.type`
    });

    const filteredItems = selectableItems?.filter(s_item => s_item.type === itemType);

    return (
        <div className="flex items-end gap-2 p-2 border rounded-md bg-muted/20">
            <div className="grid grid-cols-6 gap-2 flex-grow">
                <div className="col-span-2">
                    <Label>Tipo</Label>
                    <Controller 
                        name={`sessions.${sessionIndex}.items.${itemIndex}.type`} 
                        control={control} 
                        render={({ field }) => (
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                setValue(`sessions.${sessionIndex}.items.${itemIndex}.item_id`, "");
                                setValue(`sessions.${sessionIndex}.items.${itemIndex}.item_name`, "");
                            }} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Tipo"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product">Producto</SelectItem>
                                    <SelectItem value="service">Servicio</SelectItem>
                                </SelectContent>
                            </Select>
                        )} 
                    />
                </div>
                <div className="col-span-3">
                    <Label>Ítem</Label>
                    <Controller 
                        name={`sessions.${sessionIndex}.items.${itemIndex}.item_id`} 
                        control={control} 
                        render={({ field }) => {
                            const selectedValue = filteredItems?.find(s_item => s_item.id === field.value);
                            return (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between" disabled={isLoading || !itemType}>
                                            <span className="flex items-center justify-between w-full">
                                                {selectedValue ? selectedValue.name : "Seleccionar..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar..." />
                                            <CommandEmpty>No se encontraron.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredItems?.map(s_item => (
                                                    <CommandItem key={s_item.id} value={s_item.name} onSelect={() => { 
                                                        field.onChange(s_item.id); 
                                                        setValue(`sessions.${sessionIndex}.items.${itemIndex}.item_name`, s_item.name); 
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4", s_item.id === field.value ? "opacity-100" : "opacity-0")} />
                                                        {s_item.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            );
                        }} 
                    />
                    <Input type="hidden" {...register(`sessions.${sessionIndex}.items.${itemIndex}.item_name`)} />
                </div>
                <div className="col-span-1">
                    <Label>Cantidad</Label>
                    <Input type="number" {...register(`sessions.${sessionIndex}.items.${itemIndex}.quantity`, { valueAsNumber: true })} min={1} />
                </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(itemIndex)}><Trash2 className="h-4 w-4" /></Button>
        </div>
    );
}

function SessionItemsFieldArray({ sessionIndex, control, register, setValue }: SessionItemsFieldArrayProps) {
    const { fields, append, remove } = useFieldArray({ control, name: `sessions.${sessionIndex}.items` });
    
    return (
        <div className="space-y-3">
            {fields.map((item, itemIndex) => (
                <SessionItem
                    key={item.id}
                    sessionIndex={sessionIndex}
                    itemIndex={itemIndex}
                    control={control}
                    register={register}
                    setValue={setValue}
                    onRemove={remove}
                />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ item_id: "", item_name: "", type: "product", quantity: 1 })}><PlusCircle className="w-4 h-4 mr-2" /> Añadir Ítem</Button>
        </div>
    );
}

