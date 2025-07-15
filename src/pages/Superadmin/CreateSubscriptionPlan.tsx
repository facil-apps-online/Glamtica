import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreateSubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  max_users: z.coerce.number().int().positive().optional().nullable(),
  max_branches: z.coerce.number().int().positive().optional().nullable(),
  features: z.string().optional(),
});

export default function CreateSubscriptionPlan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createPlanMutation = useCreateSubscriptionPlan();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
      max_users: null,
      max_branches: null,
      features: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const planData = {
      ...values,
      features: values.features ? values.features.split(',').map(f => f.trim()) : null,
    };

    createPlanMutation.mutate(planData, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Plan de suscripción creado correctamente.' });
        navigate('/superadmin/subscription-plans');
      },
      onError: (error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      },
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Plan de Suscripción</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Plan</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Básico, Profesional, Enterprise" {...field} />
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
                  <Textarea placeholder="Describe las características principales de este plan." {...field} />
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
                  <Input placeholder="Ej: Facturación, Inventario, Reportes (separadas por comas)" {...field} />
                </FormControl>
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
          <Button type="submit" disabled={createPlanMutation.isPending}>
            {createPlanMutation.isPending ? 'Creando...' : 'Crear Plan'}
          </Button>
        </form>
      </Form>
    </div>
  );
}