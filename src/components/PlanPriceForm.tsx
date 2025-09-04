import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

registerLocale("es", es);

const priceSchema = z.object({
  base_price_cop: z.coerce.number().gt(0, "El precio debe ser mayor que cero."),
  extra_branch_price_cop: z.coerce.number().min(0, "El precio puede ser cero o positivo."),
  effective_date: z.date({ required_error: "Debe seleccionar una fecha." }),
});

interface PlanPriceFormProps {
  planId: string;
  onPriceScheduled: () => void; // Callback to refresh the history list
}

export function PlanPriceForm({ planId, onPriceScheduled }: PlanPriceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof priceSchema>>({
    resolver: zodResolver(priceSchema),
    defaultValues: { base_price_cop: 0, extra_branch_price_cop: 0, effective_date: new Date() },
  });

  const onSubmit = async (values: z.infer<typeof priceSchema>) => {
    setIsSubmitting(true);
    try {
      const priceData = {
        subscription_plan_id: planId,
        ...values,
        effective_date: format(values.effective_date, 'yyyy-MM-dd'),
      };

      // We will create a new 'schedule_new_price' action
      const { error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'schedule_new_price', payload: { priceData } },
      });

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Nuevo precio programado correctamente.', variant: 'success' });
      form.reset();
      onPriceScheduled(); // Trigger refresh
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Programar Nuevo Precio</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <FormField control={form.control} name="base_price_cop" render={({ field }) => (
              <FormItem><FormLabel>Precio Base (COP)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="extra_branch_price_cop" render={({ field }) => (
              <FormItem><FormLabel>Precio Sucursal Extra (COP)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="effective_date" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Fecha de Vigencia</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    locale="es"
                    dateFormat="dd/MM/yyyy"
                    popperPlacement="bottom-start"
                    className="w-full h-10 px-3 py-2 border border-input rounded-md"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="self-end" disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4" /> Programar</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}