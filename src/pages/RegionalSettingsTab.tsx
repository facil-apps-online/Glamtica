import React, { useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries, useLocalizations } from '@/hooks/useLocalization';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTimezones } from '@/hooks/useTimezones';
import { useUpdateRegionalSettings } from '@/hooks/useProfileSettings';

const regionalSettingsFormSchema = z.object({
  countryId: z.string().uuid("Debe ser un UUID válido.").optional().nullable(),
  languageId: z.string().uuid("Debe ser un UUID válido.").optional().nullable(),
  currencyId: z.string().uuid("Debe ser un UUID válido.").optional().nullable(),
  timezoneId: z.string().optional().nullable(),
});

export const RegionalSettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: countries, isLoading: isLoadingCountries } = useCountries();
  const { data: localizations, isLoading: isLoadingLocalizations } = useLocalizations();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();
  const { data: timezones, isLoading: isLoadingTimezones } = useTimezones();
  const updateRegionalSettingsMutation = useUpdateRegionalSettings();

  const form = useForm<z.infer<typeof regionalSettingsFormSchema>>({
    resolver: zodResolver(regionalSettingsFormSchema),
    defaultValues: {
      countryId: user?.country_id || null,
      languageId: user?.language_id || null,
      currencyId: user?.currency_id || null,
      timezoneId: user?.timezone_id || null,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        countryId: user.country_id || null,
        languageId: user.language_id || null,
        currencyId: user.currency_id || null,
        timezoneId: user.timezone_id || null,
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof regionalSettingsFormSchema>) => {
    updateRegionalSettingsMutation.mutate(values, {
      onSuccess: () => toast({ title: 'Éxito', description: 'Configuración regional actualizada.' }),
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  // Opciones filtradas
  const activeCountryOptions = useMemo(() => 
    countries?.filter(c => c.is_active).map(c => ({ value: c.id, label: c.name })) || [],
    [countries]
  );
  
  const activeLanguageOptions = useMemo(() => 
    localizations?.filter(l => l.is_active).map(l => ({ value: l.id, label: l.name })) || [],
    [localizations]
  );

  const activeCurrencyOptions = useMemo(() => 
    currencies?.filter(c => c.is_active).map(c => ({ value: c.id, label: `${c.name} (${c.code})` })) || [],
    [currencies]
  );

  const timezoneOptions = useMemo(() => 
    timezones?.map(t => ({ value: t.id, label: t.formattedLabel })) || [],
    [timezones]
  );

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Configuración Regional</CardTitle>
          <CardDescription>Define tu país, idioma, moneda y zona horaria preferidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="countryId"
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
                          form.setValue('languageId', selectedCountry.default_localization_id || null);
                          form.setValue('currencyId', selectedCountry.default_currency_id || null);
                          const defaultTimezone = timezones?.find(t => t.name === selectedCountry.timezone);
                          form.setValue('timezoneId', defaultTimezone?.id || null);
                        } else {
                          form.setValue('languageId', null);
                          form.setValue('currencyId', null);
                          form.setValue('timezoneId', null);
                        }
                      }}
                      placeholder="Selecciona un país"
                      isClearable={false}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                name="languageId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <SearchableSelect
                      options={activeLanguageOptions}
                      value={activeLanguageOptions.find(l => l.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : '')}
                      placeholder="Selecciona un idioma"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                name="currencyId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <SearchableSelect
                      options={activeCurrencyOptions}
                      value={activeCurrencyOptions.find(c => c.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : '')}
                      placeholder="Selecciona una moneda"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                name="timezoneId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona Horaria</FormLabel>
                    <SearchableSelect
                      options={timezoneOptions}
                      value={timezoneOptions.find(t => t.value === field.value) || null}
                      onChange={(option) => field.onChange(option ? option.value : '')}
                      placeholder="Selecciona una zona horaria"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateRegionalSettingsMutation.isPending}>
                {updateRegionalSettingsMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
