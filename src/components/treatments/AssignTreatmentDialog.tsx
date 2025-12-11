import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useTreatments, useTreatmentDetails, useAssignTreatmentToClient } from '@/hooks/useTreatments'; // Updated import
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/hooks/useClients';
import { formatCurrency } from '@/lib/utils';

const formSchema = z.object({
  treatment_id: z.string().uuid("Debes seleccionar un tratamiento."), // Updated name
  selected_price_type: z.enum(['upfront', 'financed'], { required_error: "Debes seleccionar un tipo de precio." }),
  custom_final_price: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0).optional()
  ),
  start_date: z.string().min(1, "La fecha de inicio es requerida."),
});

type FormData = z.infer<typeof formSchema>;

interface AssignTreatmentDialogProps {
  children: React.ReactNode;
  client: Client;
  onSuccess?: () => void;
}

export function AssignTreatmentDialog({ children, client, onSuccess }: AssignTreatmentDialogProps) {
  const [open, setOpen] = useState(false);
  const { tenantId } = useAuth(); // Corrected: use tenantId from useAuth

  const { data: treatments, isLoading: isLoadingTreatments } = useTreatments(tenantId || '', 'treatment'); // Updated variable
  
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedTreatmentId = watch('treatment_id'); // Updated variable
  const selectedPriceType = watch('selected_price_type');
  
  const { data: treatmentDetails, isLoading: isLoadingDetails } = useTreatmentDetails(selectedTreatmentId); // Updated hook and variable
  const { mutate: assignTreatment, isPending } = useAssignTreatmentToClient();

  const finalPrice = watch('custom_final_price') ?? 
                     (selectedPriceType === 'upfront' ? treatmentDetails?.upfront_price : treatmentDetails?.financed_price) ?? 0; // Updated variable

  const calculatedPlan = React.useMemo(() => {
    if (!treatmentDetails || !selectedPriceType) return []; // Updated variable
    if (selectedPriceType === 'upfront') {
        return [{ session_number: 1, amount: finalPrice }];
    }
    if (selectedPriceType === 'financed') {
        return treatmentDetails.sessions // Updated variable
            .map(session => {
                let amount = 0;
                if (session.fixed_payment_amount && session.fixed_payment_amount > 0) {
                    amount = session.fixed_payment_amount;
                } else if (session.payment_percentage && session.payment_percentage > 0) {
                    amount = finalPrice * (session.payment_percentage / 100);
                }
                return { session_number: session.session_number, amount };
            })
            .filter(p => p.amount > 0);
    }
    return [];
  }, [treatmentDetails, selectedPriceType, finalPrice]); // Updated variable

  const onSubmit = (data: FormData) => {
    if (!tenantId || !client.id) return;

    assignTreatment({
      client_id: client.id,
      treatment_id: data.treatment_id, // Updated name
      selected_price_type: data.selected_price_type,
      start_date: data.start_date,
      custom_final_price: data.custom_final_price ? Number(data.custom_final_price) : null,
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
            Selecciona un tratamiento y personaliza los detalles del tratamiento para este cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label>Tratamiento</Label> {/* Updated text */}
                <Controller
                    name="treatment_id" // Updated name
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger disabled={isLoadingTreatments}>
                                <SelectValue placeholder="Selecciona un tratamiento..." /> {/* Updated text */}
                            </SelectTrigger>
                            <SelectContent>
                                {treatments?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)} {/* Updated variable */}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.treatment_id && <p className="text-sm text-red-500">{errors.treatment_id.message}</p>} {/* Updated name */}
            </div>

            {treatmentDetails && ( // Updated variable
                <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo de Precio</Label>
                            <div className="flex gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant={selectedPriceType === 'upfront' ? 'default' : 'outline'}
                                    onClick={() => setValue('selected_price_type', 'upfront')}
                                >
                                    Contado ({formatCurrency(treatmentDetails.upfront_price)}) {/* Updated variable */}
                                </Button>
                                <Button
                                    type="button"
                                    variant={selectedPriceType === 'financed' ? 'default' : 'outline'}
                                    onClick={() => setValue('selected_price_type', 'financed')}
                                >
                                    Financiado ({formatCurrency(treatmentDetails.financed_price)}) {/* Updated variable */}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label>Precio Final (Personalizado)</Label>
                            <Input
                                type="number"
                                placeholder="Dejar en blanco para usar el del tratamiento" // Updated text
                                step="0.01"
                                {...register('custom_final_price')}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha de Inicio</Label>
                            <Input type="date" {...register('start_date')} />
                        </div>
                    </div>
                    
                    <div className="p-4 bg-muted/20 rounded-lg">
                        <h4 className="font-semibold mb-2">Plan de Pagos Calculado</h4>
                        <p className="text-sm">Precio Final: <span className="font-bold">{formatCurrency(finalPrice)}</span></p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            {calculatedPlan.map((payment, index) => (
                                <li key={index}>
                                    - Sesión {payment.session_number}: <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <DialogFooter>
                <Button type="submit" disabled={isPending || !selectedTreatmentId}> {/* Updated variable */}
                    Asignar Tratamiento
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}