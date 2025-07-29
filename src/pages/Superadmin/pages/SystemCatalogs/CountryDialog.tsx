import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Country, useCreateCountry, useUpdateCountry, useLocalizations } from '@/hooks/useLocalization';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTimezones } from '@/hooks/useTimezones';
import { usePhonePrefixes } from '@/hooks/usePhonePrefixes';

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  iso_code: z.string().length(2, "El código debe tener 2 caracteres."),
  phone_prefix_id: z.string().nullable(),
  default_currency_id: z.string().nullable(),
  default_localization_id: z.string().nullable(),
  timezone: z.string().nullable(),
  is_active: z.boolean(),
});

interface CountryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  country?: Country;
}

export function CountryDialog({ isOpen, onClose, country }: CountryDialogProps) {
  const createMutation = useCreateCountry();
  const updateMutation = useUpdateCountry();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();
  const { data: localizations, isLoading: isLoadingLocalizations } = useLocalizations();
  const { data: timezones, isLoading: isLoadingTimezones } = useTimezones();
  const { data: phonePrefixes, isLoading: isLoadingPrefixes } = usePhonePrefixes();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: country ? {
      ...country,
      is_active: country.is_active ?? true,
    } : {
      name: '',
      iso_code: '',
      phone_prefix_id: null,
      default_currency_id: null,
      default_localization_id: null,
      timezone: null,
      is_active: true,
    },
  });

  const onSubmit = (values: z.infer<typeof countryFormSchema>) => {
    onSave(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{country ? 'Editar País' : 'Crear Nuevo País'}</DialogTitle>
          <DialogDescription>
            Completa los detalles del país y sus configuraciones regionales por defecto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del País</FormLabel>
                  <FormControl><Input placeholder="Ej: Colombia" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="iso_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código ISO</FormLabel>
                  <FormControl><Input placeholder="Ej: CO" {...field} maxLength={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>
                      Si está inactivo, el país no se podrá seleccionar en nuevos registros.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="phone_prefix_id"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Prefijo Telefónico</FormLabel>
                    <SearchableSelect
                      options={phonePrefixes?.map(p => ({ value: p.id, label: `${p.country_name} (${p.prefix})` })) || []}
                      value={phonePrefixes?.map(p => ({ value: p.id, label: `${p.country_name} (${p.prefix})` })).find(p => p.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : null)}
                      placeholder="Selecciona un prefijo"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                name="default_currency_id"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Moneda por Defecto</FormLabel>
                    <SearchableSelect
                      options={currencies?.map(c => ({ value: c.id, label: `${c.name} (${c.code})` })) || []}
                      value={currencies?.map(c => ({ value: c.id, label: `${c.name} (${c.code})` })).find(c => c.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : null)}
                      placeholder="Selecciona una moneda"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                name="default_localization_id"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Localización por Defecto</FormLabel>
                    <SearchableSelect
                      options={localizations?.map(l => ({ value: l.id, label: l.name })) || []}
                      value={localizations?.map(l => ({ value: l.id, label: l.name })).find(l => l.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : null)}
                      placeholder="Selecciona una localización"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                name="timezone"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Zona Horaria por Defecto</FormLabel>
                    <SearchableSelect
                      options={timezones?.map(t => ({ value: t.name, label: t.name })) || []}
                      value={timezones?.map(t => ({ value: t.name, label: t.name })).find(t => t.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : null)}
                      placeholder="Selecciona una zona horaria"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
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
