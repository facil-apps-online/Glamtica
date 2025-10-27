import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormItem, FormLabel } from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRegionalSettingsData } from '@/hooks/useRegionalSettingsData';
import { useTimezones } from '@/hooks/useTimezones';
import { useUpdateRegionalSettings } from '@/hooks/useProfileSettings'; // Hook específico

const regionalSettingsFormSchema = z.object({
  country_id: z.string().uuid("Debe ser un UUID válido.").optional().nullable(),
  language_id: z.string().uuid("Debe ser un UUID válido.").optional().nullable(),
  currency_id: z.string().uuid("Debe ser un UUID válido.").optional().nullable(),
  timezone: z.string().optional().nullable(),
});

export const RegionalSettingsTab = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: regionalSettingsData, isLoading: isLoadingRegionalSettings } = useRegionalSettingsData();
  const { countries, localizations, currencies } = regionalSettingsData || {};

  const regionalSettingsMutation = useUpdateRegionalSettings(); // Mutación específica

  const form = useForm<z.infer<typeof regionalSettingsFormSchema>>({
    resolver: zodResolver(regionalSettingsFormSchema),
    defaultValues: {
      country_id: null,
      language_id: null,
      currency_id: null,
      timezone: null,
    },
  });

  useEffect(() => {
    if (profile && countries && localizations && currencies) {
      form.reset({
        country_id: profile.country_id || null,
        language_id: profile.language_id || null,
        currency_id: profile.currency_id || null,
        timezone: profile.timezone || null,
      });
    }
  }, [profile, form.reset, countries, localizations, currencies]);

  const onSubmit = (values: z.infer<typeof regionalSettingsFormSchema>) => {
    regionalSettingsMutation.mutate(values, {
      onSuccess: () => toast({ title: 'Éxito', description: 'Configuración regional actualizada.', variant: 'success' }),
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const activeCountryOptions = useMemo(() => 
    countries?.filter(c => c.is_active).map(c => ({ value: c.id, label: c.name })) || [],
    [countries]
  );
  
  const countryId = form.watch('country_id');

  const activeLanguageOptions = useMemo(() => {
    if (countryId) {
      const selectedCountry = countries?.find(c => c.id === countryId);
      if (selectedCountry && selectedCountry.default_localization_id) {
        return localizations?.filter(l => l.id === selectedCountry.default_localization_id).map(l => ({ value: l.id, label: l.name })) || [];
      }
      return []; // If country selected but no default localization, show empty
    }
    return localizations?.filter(l => l.is_active).map(l => ({ value: l.id, label: l.name })) || [];
  }, [localizations, countryId, countries]);

  const activeCurrencyOptions = useMemo(() => {
    if (countryId) {
      const selectedCountry = countries?.find(c => c.id === countryId);
      if (selectedCountry && selectedCountry.default_currency_id) {
        return currencies?.filter(c => c.id === selectedCountry.default_currency_id).map(c => ({ value: c.id, label: `${c.name} (${c.code})` })) || [];
      }
      return []; // If country selected but no default currency, show empty
    }
    return currencies?.filter(c => c.is_active).map(c => ({ value: c.id, label: `${c.name} (${c.code})` })) || [];
  }, [currencies, countryId, countries]);

  const timezoneOptions = useMemo(() => {
    if (!countryId) {
      return [];
    }
    const selectedCountry = countries?.find(c => c.id === countryId);
    if (!selectedCountry || !selectedCountry.timezones) {
      return [];
    }
    return selectedCountry.timezones.map(tz => ({ value: tz, label: tz }));
  }, [countryId, countries]);

  const isLoading = isLoadingRegionalSettings;



  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Configuración Regional</CardTitle>
          <CardDescription>Define tu país, idioma, moneda y zona horaria preferidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="country_id"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <SearchableSelect
                      options={activeCountryOptions}
                      value={activeCountryOptions.find(c => c.value === field.value) || null}
                      onChange={(option) => {
                        field.onChange(option ? option.value : null);
                        const selectedCountry = countries?.find(c => c.id === option?.value);
                        if (selectedCountry) {
                          form.setValue('language_id', selectedCountry.default_localization_id || null, { shouldDirty: true });
                          form.setValue('currency_id', selectedCountry.default_currency_id || null, { shouldDirty: true });
                          form.setValue('timezone', selectedCountry.timezone || null, { shouldDirty: true });
                        }
                      }}
                      placeholder="Selecciona un país"
                      isLoading={isLoading}
                    />
                  </FormItem>
                )}
              />

              <Controller
                name="language_id"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <SearchableSelect
                      options={activeLanguageOptions}
                      value={activeLanguageOptions.find(l => l.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : null)}
                      placeholder="Selecciona un idioma"
                      isLoading={isLoading}
                    />
                  </FormItem>
                )}
              />

              <Controller
                name="currency_id"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <SearchableSelect
                      options={activeCurrencyOptions}
                      value={activeCurrencyOptions.find(c => c.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : null)}
                      placeholder="Selecciona una moneda"
                      isLoading={isLoading}
                    />
                  </FormItem>
                )}
              />

              <Controller
                name="timezone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona Horaria</FormLabel>
                    <SearchableSelect
                      options={timezoneOptions}
                      value={timezoneOptions.find(t => t.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : null)}
                      placeholder="Selecciona una zona horaria"
                      isLoading={isLoading}
                    />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={regionalSettingsMutation.isPending || !form.formState.isDirty}>
                  {regionalSettingsMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};