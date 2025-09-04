import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { useCreatePlanPrice } from '@/hooks/usePlanPriceHistory';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

registerLocale("es", es);

const newPriceSchema = z.object({
  subscription_plan_id: z.string().min(1, "Debe seleccionar un plan."),
  base_price_cop: z.coerce.number().gt(0, "El precio debe ser mayor que cero."),
  extra_branch_price_cop: z.coerce.number().min(0, "El precio puede ser cero o positivo."),
  effective_date: z.date({ required_error: "Debe seleccionar una fecha." }),
});

export function NewPriceScheduler({ plans, isLoading }) {
  const createPlanPriceMutation = useCreatePlanPrice();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof newPriceSchema>>({
    resolver: zodResolver(newPriceSchema),
    defaultValues: { subscription_plan_id: '', base_price_cop: 0, extra_branch_price_cop: 0, effective_date: new Date() },
  });

  const onAddNewPrice = (values: z.infer<typeof newPriceSchema>) => {
    createPlanPriceMutation.mutate({ ...values, effective_date: format(values.effective_date, 'yyyy-MM-dd') }, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Nuevo precio programado correctamente.', variant: 'success' });
        form.reset();
      },
      onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Programar Nuevo Precio</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onAddNewPrice)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
            <FormField control={form.control} name="subscription_plan_id" render={({ field }) => (
              <FormItem><FormLabel>Plan</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl><SelectContent>{plans?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="base_price_cop" render={({ field }) => (
              <FormItem><FormLabel>Nuevo Precio Base (COP)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="extra_branch_price_cop" render={({ field }) => (
              <FormItem><FormLabel>Nuevo Precio Sucursal Extra (COP)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
            <Button type="submit" className="self-end" disabled={createPlanPriceMutation.isPending || isLoading}><PlusCircle className="mr-2 h-4 w-4" /> Programar</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}