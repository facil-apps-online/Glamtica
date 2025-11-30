import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUpdateTenantSlug, useCheckSlugAvailability, Tenant } from '@/hooks/useTenants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link, Save, Copy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { PublicCountry } from '@/hooks/usePublicRegistrationData';

const slugSchema = z.object({
  slug: z.string().min(3, "El alias debe tener al menos 3 caracteres.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa solo letras minúsculas, números y guiones (ej. mi-negocio).").optional().nullable(),
});

type SlugFormValues = z.infer<typeof slugSchema>;

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

interface TenantSlugFormProps {
  tenant: Partial<Tenant> | null;
  countries: PublicCountry[];
}

export function TenantSlugForm({ tenant, countries }: TenantSlugFormProps) {
  const { toast } = useToast();
  const updateSlugMutation = useUpdateTenantSlug();

  const [debouncedSlug, setDebouncedSlug] = useState('');

  const form = useForm<SlugFormValues>({
    resolver: zodResolver(slugSchema),
    defaultValues: { slug: '' },
    mode: 'onChange',
  });
  
  const watchedSlug = form.watch('slug');

  const { data: isAvailable, isLoading: isChecking } = useCheckSlugAvailability(debouncedSlug, tenant?.country_id || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (watchedSlug && watchedSlug !== tenant?.slug) {
        setDebouncedSlug(watchedSlug);
      } else {
        setDebouncedSlug('');
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [watchedSlug, tenant?.slug]);

  useEffect(() => {
    if (tenant?.slug) {
      form.reset({ slug: tenant.slug });
    }
  }, [tenant, form]);

  const onSubmit = async (values: SlugFormValues) => {
    if (values.slug === tenant?.slug) {
      toast({ title: 'Sin cambios', description: 'El alias es el mismo que ya está guardado.', variant: 'default' });
      return;
    }
    updateSlugMutation.mutate({ slug: values.slug || '' }, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'El alias de tu negocio ha sido actualizado.', variant: 'success' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleSuggestSlug = () => {
    if (tenant?.name) {
      const suggested = slugify(tenant.name);
      form.setValue('slug', suggested, { shouldValidate: true, shouldDirty: true });
    }
  };
  
  const country = countries?.find(c => c.id === tenant?.country_id);
  const countryIso = country?.iso_code?.toLowerCase() || '';
  const micrositeUrl = `${window.location.origin}/${countryIso}/${watchedSlug || ''}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(micrositeUrl);
    toast({ title: "Copiado", description: "La URL del micrositio ha sido copiada." });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Link className="h-5 w-5" />
          Alias del Negocio (Micrositio)
        </CardTitle>
        <CardDescription>
          Define una URL única y fácil de recordar para tu página pública de agendamiento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias (slug)</FormLabel>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground p-2 bg-gray-100 rounded-l-md border border-r-0 h-10 flex items-center">
                      {`${window.location.origin}/${countryIso}/`}
                    </span>
                    <div className="relative w-full">
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="ej-mi-negocio"
                          className="rounded-l-none pr-10"
                        />
                      </FormControl>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {isChecking && <Loader2 className="h-4 w-4 animate-spin" />}
                        {debouncedSlug && !isChecking && isAvailable && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {debouncedSlug && !isChecking && !isAvailable && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </div>
                  <FormDescription>
                    {debouncedSlug && !isChecking && !isAvailable && <span className="text-red-500">Este alias ya está en uso en tu país.</span>}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div>
                <Button type="button" variant="outline" size="sm" onClick={handleSuggestSlug}>
                  Sugerir Alias
                </Button>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={copyToClipboard} disabled={!watchedSlug}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar URL
                </Button>
                <Button type="submit" disabled={updateSlugMutation.isPending || watchedSlug === tenant?.slug || (debouncedSlug && !isAvailable)}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateSlugMutation.isPending ? 'Guardando...' : 'Guardar Alias'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}