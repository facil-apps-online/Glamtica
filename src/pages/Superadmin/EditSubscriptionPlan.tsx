import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import FeaturesInput from '@/components/ui/FeaturesInput';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSubscriptionPlanById, useUpdateSubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  max_users: z.coerce.number().int().positive().optional().nullable(),
  max_branches: z.coerce.number().int().positive().optional().nullable(),
  features: z.array(z.string()).default([]), // El schema ahora espera un array de strings
});

export default function EditSubscriptionPlan() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: plan, isLoading, isError, error } = useSubscriptionPlanById(planId!);
  const updatePlanMutation = useUpdateSubscriptionPlan();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
      max_users: null,
      max_branches: null,
      features: [],
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description,
        is_active: plan.is_active,
        max_users: plan.max_users,
        max_branches: plan.max_branches,
        features: plan.features || [], // Ahora se asigna directamente el array
      });
    }
  }, [plan, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const planData = {
      id: planId,
      ...values,
    };

    updatePlanMutation.mutate(planData, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Plan de suscripción actualizado correctamente.' });
        navigate('/superadmin/subscription-plans');
      },
      onError: (error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      },
    });
  };

  if (isLoading) return <div>Cargando datos del plan...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editar Plan de Suscripción</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Plan</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="max_users"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de Usuarios</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Dejar en blanco para ilimitado" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_branches"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de Sedes</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Dejar en blanco para ilimitado" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="features"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lista de Características</FormLabel>
                <FormControl>
                  <FeaturesInput {...field} />
                </FormControl>
                <FormDescription>
                  Escribe una característica y presiona Enter o coma para añadirla.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Plan Activo</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Los planes inactivos no se podrán asignar a nuevos tenants.
                  </p>
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
          <Button type="submit" disabled={updatePlanMutation.isPending}>
            {updatePlanMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </Form>
    </div>
  );
}