import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Currency, useCreateCurrency, useUpdateCurrency } from '@/hooks/useCurrencies';

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  code: z.string().length(3, "El código debe tener 3 caracteres."),
  symbol: z.string().min(1, "El símbolo es requerido."),
  symbol_position: z.enum(['before', 'after']),
  decimal_separator: z.string().length(1, "Debe ser un solo carácter."),
  thousands_separator: z.string().length(1, "Debe ser un solo carácter."),
  decimal_places: z.coerce.number().int().min(0).max(4),
});

interface CurrencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: Currency;
}

export function CurrencyDialog({ isOpen, onClose, currency }: CurrencyDialogProps) {
  const createMutation = useCreateCurrency();
  const updateMutation = useUpdateCurrency();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: currency ? {
      ...currency,
      code: currency.code.toUpperCase(),
    } : {
      name: '',
      code: '',
      symbol: '',
      symbol_position: 'before',
      decimal_separator: '.',
      thousands_separator: ',',
      decimal_places: 2,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const decimalPart = values.decimal_places > 0
        ? values.decimal_separator + '0'.repeat(values.decimal_places)
        : '';
      const numberFormat = `#${values.thousands_separator}##0${decimalPart}`;
      const finalFormat = values.symbol_position === 'before'
        ? `${values.symbol}${numberFormat}`
        : `${numberFormat}${values.symbol}`;

      const dataToSend = {
        ...values,
        format: finalFormat,
      };

      if (currency) {
        await updateMutation.mutateAsync({ ...dataToSend, id: currency.id });
      } else {
        await createMutation.mutateAsync(dataToSend);
      }
      form.reset();
      onClose();
    } catch (error) {
      // El hook ya muestra un toast de error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currency ? 'Editar Moneda' : 'Crear Nueva Moneda'}</DialogTitle>
          <DialogDescription>
            Define los detalles y el formato de la moneda para todo el sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Ej: Dólar Americano" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código (ISO)</FormLabel>
                  <FormControl><Input placeholder="Ej: USD" {...field} maxLength={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="symbol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Símbolo</FormLabel>
                  <FormControl><Input placeholder="Ej: $" {...field} maxLength={5} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="symbol_position" render={({ field }) => (
                <FormItem>
                  <FormLabel>Posición del Símbolo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="before">Antes ($100)</SelectItem>
                      <SelectItem value="after">Después (100€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="decimal_places" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº de Decimales</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="decimal_separator" render={({ field }) => (
                <FormItem>
                  <FormLabel>Separador Decimal</FormLabel>
                  <FormControl><Input placeholder="." {...field} maxLength={1} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="thousands_separator" render={({ field }) => (
                <FormItem>
                  <FormLabel>Separador de Miles</FormLabel>
                  <FormControl><Input placeholder="," {...field} maxLength={1} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
