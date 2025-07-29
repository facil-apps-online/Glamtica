import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Fetching Functions ---
const fetchPlatformDetails = async (platformId: string) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { action: 'get_platform_by_id', payload: { platformId } },
  });
  if (error) throw new Error(error.message);
  return data;
};

const fetchSystemCatalogs = async () => {
  const { data: countries, error: countriesError } = await supabase.from('countries').select('*').order('name');
  const { data: languages, error: languagesError } = await supabase.from('languages').select('*').order('name');
  const { data: currencies, error: currenciesError } = await supabase.from('currencies').select('*').order('name');
  // TODO: Add timezones fetching when available
  if (countriesError || languagesError || currenciesError) {
    throw new Error('Failed to fetch system catalogs');
  }
  return { countries, languages, currencies };
};

const fetchAssignedCountries = async (platformId: string) => {
    const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_countries_for_platform', payload: { platformId } },
    });
    if (error) throw new Error(error.message);
    return data as string[];
};

// --- Zod Schema ---
const settingsSchema = z.object({
  default_currency_id: z.string().uuid().nullable(),
  default_language_id: z.string().uuid().nullable(),
  default_timezone: z.string().nullable(), // TODO: Change to ID when timezones table is ready
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function PlatformSettings() {
  const { platformId } = useParams<{ platformId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- State ---
  const [assignedCountryIds, setAssignedCountryIds] = useState<Set<string>>(new Set());

  // --- Queries ---
  const { data: platform, isLoading: isLoadingPlatform } = useQuery({
    queryKey: ['platform', platformId],
    queryFn: () => fetchPlatformDetails(platformId!),
    enabled: !!platformId,
  });

  const { data: catalogs, isLoading: isLoadingCatalogs } = useQuery({
    queryKey: ['systemCatalogs'],
    queryFn: fetchSystemCatalogs,
  });

  const { data: initialAssignedIds, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['platformCountries', platformId],
    queryFn: () => fetchAssignedCountries(platformId!),
    enabled: !!platformId,
  });

  // --- Mutations ---
  const updateSettingsMutation = useMutation({
    mutationFn: (values: SettingsFormValues) => supabase.functions.invoke('superadmin-actions', {
      body: { action: 'update_platform_settings', payload: { platformId, settings: values } },
    }),
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Configuración general actualizada.' });
      queryClient.invalidateQueries({ queryKey: ['platform', platformId] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const assignCountryMutation = useMutation({
    mutationFn: (countryId: string) => supabase.functions.invoke('superadmin-actions', {
        body: { action: 'assign_country_to_platform', payload: { platformId, countryId } },
    }),
    onSuccess: (_, countryId) => {
        setAssignedCountryIds(prev => new Set(prev).add(countryId));
    }
  });

  const removeCountryMutation = useMutation({
    mutationFn: (countryId: string) => supabase.functions.invoke('superadmin-actions', {
        body: { action: 'remove_country_from_platform', payload: { platformId, countryId } },
    }),
    onSuccess: (_, countryId) => {
        setAssignedCountryIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(countryId);
            return newSet;
        });
    }
  });

  // --- Form ---
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  // --- Effects ---
  useEffect(() => {
    if (platform) {
      form.reset({
        default_currency_id: platform.default_currency_id,
        default_language_id: platform.default_language_id,
        default_timezone: platform.default_timezone,
      });
    }
  }, [platform, form]);

  useEffect(() => {
    if (initialAssignedIds) {
      setAssignedCountryIds(new Set(initialAssignedIds));
    }
  }, [initialAssignedIds]);

  // --- Handlers ---
  const onSubmit = (values: SettingsFormValues) => {
    updateSettingsMutation.mutate(values);
  };

  const handleCountryToggle = (countryId: string, isAssigned: boolean) => {
    if (isAssigned) {
        removeCountryMutation.mutate(countryId);
    } else {
        assignCountryMutation.mutate(countryId);
    }
  };

  // --- Render ---
  const isLoading = isLoadingPlatform || isLoadingCatalogs || isLoadingAssigned;

  if (isLoading) {
    return <div>Cargando configuración de la plataforma...</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/superadmin/platforms')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Configuración de: {platform?.name || 'Plataforma'}</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="countries">Países Disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Configuración General</CardTitle>
                  <CardDescription>Define la moneda, idioma y zona horaria por defecto para esta plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="default_currency_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda por Defecto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar moneda..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {catalogs?.currencies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="default_language_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma por Defecto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar idioma..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {catalogs?.languages?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* TODO: Add Timezone Select when ready */}
                </CardContent>
                <div className="flex justify-end p-6">
                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Configuración
                    </Button>
                </div>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="countries">
            <Card>
                <CardHeader>
                    <CardTitle>Países Disponibles</CardTitle>
                    <CardDescription>Selecciona los países en los que esta plataforma podrá operar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {catalogs?.countries?.map(country => (
                        <div key={country.id} className="flex items-center justify-between p-3 border rounded-md">
                            <span>{country.name}</span>
                            <Switch
                                checked={assignedCountryIds.has(country.id)}
                                onCheckedChange={() => handleCountryToggle(country.id, assignedCountryIds.has(country.id))}
                                disabled={assignCountryMutation.isPending || removeCountryMutation.isPending}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
