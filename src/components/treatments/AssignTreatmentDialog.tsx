import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { X, PlusCircle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useTreatments, useTreatmentDetails, useAssignTreatmentToClient, TreatmentSessionItem } from '@/hooks/useTreatments';
import { useSelectableProductServices } from '@/hooks/useProductServicesSelection';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/hooks/useClients';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import es from 'date-fns/locale/es';
import DatePickerButtonInput from '../DatePickerButtonInput';
import { cn } from '@/lib/utils';
import { usePriceFormat } from '@/hooks/usePriceFormat';

registerLocale('es', es);

const sessionItemSchema = z.object({
  item_id: z.string().uuid("ID de ítem inválido."),
  item_name: z.string().min(1, "El nombre del ítem es requerido."),
  type: z.enum(["product", "service"], { required_error: "El tipo de ítem es requerido." }),
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1."),
  notes: z.string().optional(),
});

// Updated form schema

export function AssignTreatmentDialog({ children, client, onSuccess }: AssignTreatmentDialogProps) {
  const [open, setOpen] = useState(false);
  const { tenantId } = useAuth();
  const { formatPrice } = usePriceFormat();

  const { data: treatments, isLoading: isLoadingTreatments } = useTreatments(tenantId || '', 'treatment', undefined, false);
  
  const form = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      treatment_id: '',
      name: '',
      start_date: new Date(),
      payment_type: 'financed',
      sessions: [],
    },
  });
  
  const { control, handleSubmit, watch, setValue, register, formState: { errors } } = form;

  const selectedTreatmentId = watch('treatment_id');
  const selectedPaymentType = watch('payment_type');
  
  const { data: treatmentDetails, isLoading: isLoadingDetails } = useTreatmentDetails(selectedTreatmentId);
  
  const { fields: sessionFields, append: appendSession, remove: removeSession, replace: replaceSessions } = useFieldArray({
    control,
    name: "sessions",
  });

  const sessions = useWatch({ control, name: "sessions" });
  
  const { mutate: assignTreatment, isPending } = useAssignTreatmentToClient();

  // This is a new resolver that needs to be applied to the form
  useEffect(() => {
    const formSchemaWithContext = z.object({
      treatment_id: z.string().uuid("Debes seleccionar un tratamiento."),
      name: z.string().min(1, "El nombre del tratamiento es requerido."),
      payment_type: z.enum(['upfront', 'financed'], { required_error: "Debes seleccionar un tipo de precio." }),
      start_date: z.date({ required_error: "La fecha de venta es requerida." }),
      sessions: z.array(z.object({
        session_number: z.number().int(),
        name: z.string().min(1, "El nombre de la sesión es requerido."),
        description: z.string().optional(),
        payment_amount: z.number().min(0),
        items: z.array(sessionItemSchema),
      })),
    }).superRefine((data, ctx) => {
      if (data.payment_type === 'financed' && treatmentDetails) {
        const totalSessionAmount = data.sessions.reduce((sum, s) => sum + (s.payment_amount || 0), 0);
        const financedPrice = treatmentDetails.financed_price || 0;
        if (Math.abs(totalSessionAmount - financedPrice) > 0.01) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sessions'],
            message: `La suma de las cuotas (${formatPrice(totalSessionAmount)}) debe ser igual al Precio Financiado (${formatPrice(financedPrice)}).`,
          });
        }
      }
    });

    form.setValue('resolver', zodResolver(formSchemaWithContext));
  }, [treatmentDetails, form, formatPrice]);


  const totalCustomPrice = React.useMemo(() => {
    return sessions?.reduce((total, session) => total + (session.payment_amount || 0), 0) || 0;
  }, [sessions]);

  useEffect(() => {
    if (treatmentDetails) {
      setValue('name', treatmentDetails.name);
      
      let initialSessions: any[] = [];
      const masterSessions = treatmentDetails.sessions || [];

      if (selectedPaymentType === 'upfront') {
        const upfrontPrice = treatmentDetails.upfront_price || 0;
        initialSessions = masterSessions.map((session, index) => ({
          ...session,
          payment_amount: index === 0 ? upfrontPrice : 0, // Total price on first session, rest are 0
          items: (session.items || []).map(i => ({
            item_id: i.product_id || i.service_id || '',
            item_name: '',
            type: i.product_id ? 'product' : 'service',
            quantity: i.quantity,
            notes: i.notes || ''
          })),
        }));
      } else { // 'financed'
        initialSessions = masterSessions.map(session => ({
          ...session,
          payment_amount: session.fixed_payment_amount || 0, // Use the value from the master treatment session
          items: (session.items || []).map(i => ({
            item_id: i.product_id || i.service_id || '',
            item_name: '',
            type: i.product_id ? 'product' : 'service',
            quantity: i.quantity,
            notes: i.notes || ''
          })),
        }));
      }
      
      replaceSessions(initialSessions);
    }
  }, [treatmentDetails, selectedPaymentType, setValue, replaceSessions]);

  const onSubmit = (data: FormData) => {
    if (!tenantId || !client.id || !treatmentDetails) return;

    assignTreatment({
      client_id: client.id,
      treatment_id: data.treatment_id,
      name: data.name || treatmentDetails.name,
      payment_type: data.payment_type,
      final_price: totalCustomPrice,
      start_date: data.start_date.toISOString(),
      sessions: (data.sessions || []).map(s => ({
        ...s,
        items: s.items.map(item => ({
            product_id: item.type === 'product' ? item.item_id : null,
            service_id: item.type === 'service' ? item.item_id : null,
            quantity: item.quantity,
            notes: item.notes
        }))
      })),
    }, {
      onSuccess: () => {
        setOpen(false);
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Tratamiento a {client.name}</DialogTitle>
          <DialogDescription>
            Selecciona un tratamiento y personaliza los detalles de cada sesión.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
            <div className="space-y-2">
                <Label>Tratamiento Modelo</Label>
                <Controller
                    name="treatment_id"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger disabled={isLoadingTreatments || (treatments && treatments.length === 0)}>
                                <SelectValue placeholder={isLoadingTreatments ? "Cargando tratamientos..." : (treatments && treatments.length === 0 ? "No hay tratamientos disponibles." : "Selecciona un tratamiento...")} />
                            </SelectTrigger>
                            <SelectContent>
                                {treatments?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.treatment_id && <p className="text-sm text-red-500">{errors.treatment_id.message}</p>}
            </div>

            {treatmentDetails && (
                <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor="custom-treatment-name">Nombre del Tratamiento</Label>
                        <Input
                            id="custom-treatment-name"
                            {...register('name')}
                            placeholder="Nombre personalizado del tratamiento"
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-4"> 
                        <div>
                            <Label>Tipo de Precio</Label>
                            <div className="flex gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant={selectedPaymentType === 'upfront' ? 'default' : 'outline'}
                                    onClick={() => setValue('payment_type', 'upfront')}
                                >
                                    Contado ({formatPrice(treatmentDetails.upfront_price)})
                                </Button>
                                <Button
                                    type="button"
                                    variant={selectedPaymentType === 'financed' ? 'default' : 'outline'}
                                    onClick={() => setValue('payment_type', 'financed')}
                                >
                                    Financiado ({formatPrice(treatmentDetails.financed_price)})
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Controller
                                control={control}
                                name="start_date"
                                render={({ field }) => (
                                    <div className="flex flex-col space-y-2">
                                      <Label htmlFor="start-date">Fecha de Venta</Label>
                                      <DatePicker
                                          id="start-date"
                                          selected={field.value}
                                          onChange={field.onChange}
                                          locale="es"
                                          dateFormat="dd/MM/yyyy"
                                          popperPlacement="bottom-start"
                                          popperClassName="z-50"
                                          customInput={<DatePickerButtonInput />}
                                          className="w-full"
                                          wrapperClassName="w-full"
                                      />
                                    </div>
                                )}
                            />
                            {errors.start_date && <p className="text-sm text-red-500">{errors.start_date.message}</p>}
                        </div>
                    </div>
                    
                    <div className="bg-muted/20 rounded-lg">
                        <h4 className="font-semibold mb-3">Plan de Sesiones</h4>
                        <div className="space-y-2">
                            {sessionFields.map((field, index) => ( // Use sessionFields from useFieldArray
                                <div key={field.id} className="flex flex-col p-2 bg-background rounded-md border">
                                    <div className="flex items-center justify-between">
                                        <Input
                                            {...register(`sessions.${index}.name`)} // Use register for direct input binding
                                            className="text-sm flex-grow mr-4"
                                            placeholder={`Sesión ${index + 1}`}
                                        />
                                        <div className="flex items-center gap-2">
                                            {/* Wrap payment_amount input in a flex-grow div */}
                                            <div className="flex-grow"> 
                                                <Input
                                                    id={`sessions.${index}.payment_amount`}
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`sessions.${index}.payment_amount`, { valueAsNumber: true })}
                                                    disabled={selectedPaymentType === 'upfront' && index !== 0} // Disable if upfront and not the first session
                                                    className="w-full" // Ensure it takes 100% of its new flex-grow parent
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSession(index)}>
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        <Label htmlFor={`sessions.${index}.description`} className="sr-only">Descripción</Label>
                                        <Input
                                            id={`sessions.${index}.description`}
                                            {...register(`sessions.${index}.description`)} // Use register
                                            placeholder="Descripción de la sesión (opcional)"
                                            className="text-sm"
                                        />
                                    </div>
                                    {/* INTEGRATE SessionItemsFieldArray HERE */}
                                    <div className="space-y-3 pt-3 border-t">
                                        <h5 className="font-semibold text-sm">Ítems de Sesión</h5>
                                        <SessionItemsFieldArray sessionIndex={index} control={control} register={register} setValue={setValue} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => appendSession({ name: `Sesión ${sessionFields.length + 1}`, description: "", payment_amount: 0, items: [], session_number: sessionFields.length + 1 })}>
                                <PlusCircle className="w-4 h-4 mr-2" /> Añadir Sesión
                            </Button>
                        </div>
                        <div className="border-t mt-4 pt-4">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Precio Final Total:</span>
                                <span>{formatPrice(totalCustomPrice)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DialogFooter>
                <Button 
                    type="button" 
                    onClick={handleSubmit(onSubmit)}
                    disabled={
                        isPending ||
                        !selectedTreatmentId ||
                        (errors && Object.keys(errors).length > 0) ||
                        (sessions && sessions.length === 0)
                    }
                >
                    Asignar Tratamiento
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-components for Item Management ---

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
                                                <span className="truncate"> {/* Apply truncation here */}
                                                    {selectedValue ? selectedValue.name : "Seleccionar..."}
                                                </span>
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