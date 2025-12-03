import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Trash2, Edit, Save, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  SOCIAL_NETWORK_OPTIONS,
  SocialNetworkType,
  useTenantSocialNetworks,
  useAddTenantSocialNetwork,
  useUpdateTenantSocialNetwork,
  useDeleteTenantSocialNetwork,
  useBranchSocialNetworks,
  useAddBranchSocialNetwork,
  useUpdateBranchSocialNetwork,
  useDeleteBranchSocialNetwork,
  TenantSocialNetwork,
  BranchSocialNetwork,
} from '@/hooks/useSocialNetworks';
import { SocialIcon } from '@/components/SocialIcon'; // Assuming this component will be created

const socialNetworkSchema = z.object({
  network: z.enum(
    SOCIAL_NETWORK_OPTIONS.map((opt) => opt.value) as [string, ...string[]],
    { required_error: 'La red social es obligatoria.' }
  ),
  url: z.string().url('Ingresa una URL válida.').min(5, 'La URL es demasiado corta.'),
});

interface SocialNetworkManagerProps {
  tenantId?: string;
  branchId?: string;
}

export const SocialNetworkManager: React.FC<SocialNetworkManagerProps> = ({
  tenantId,
  branchId,
}) => {
  type SocialNetwork = TenantSocialNetwork | BranchSocialNetwork;

  const isTenantLevel = !!tenantId;
  const isBranchLevel = !!branchId;

  const {
    data: socialNetworks,
    isLoading,
    error,
  } = isTenantLevel
    ? useTenantSocialNetworks(tenantId)
    : useBranchSocialNetworks(branchId);

  const addTenantMutation = useAddTenantSocialNetwork(tenantId);
  const updateTenantMutation = useUpdateTenantSocialNetwork(tenantId);
  const deleteTenantMutation = useDeleteTenantSocialNetwork(tenantId);

  const addBranchMutation = useAddBranchSocialNetwork(branchId);
  const updateBranchMutation = useUpdateBranchSocialNetwork(branchId);
  const deleteBranchMutation = useDeleteBranchSocialNetwork(branchId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<z.infer<typeof socialNetworkSchema>>({
    resolver: zodResolver(socialNetworkSchema),
    defaultValues: {
      network: 'Website',
      url: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof socialNetworkSchema>) => {
    try {
      if (editingId) {
        // Update existing
        const mutationVars = { id: editingId, ...values };
        if (isTenantLevel) {
          await updateTenantMutation.mutateAsync(mutationVars);
        } else if (isBranchLevel) {
          await updateBranchMutation.mutateAsync(mutationVars);
        }
        toast.success('Red social actualizada con éxito.');
        setEditingId(null);
      } else {
        // Add new
        const mutationVars = values;
        if (isTenantLevel) {
          await addTenantMutation.mutateAsync(mutationVars);
        } else if (isBranchLevel) {
          await addBranchMutation.mutateAsync(mutationVars);
        }
        toast.success('Red social añadida con éxito.');
        setIsAdding(false);
      }
      form.reset();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta red social?')) return;
    try {
      if (isTenantLevel) {
        await deleteTenantMutation.mutateAsync(id);
      } else if (isBranchLevel) {
        await deleteBranchMutation.mutateAsync(id);
      }
      toast.success('Red social eliminada con éxito.');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleEdit = (social: SocialNetwork) => {
    setEditingId(social.id);
    setIsAdding(false);
    form.reset({
      network: social.network,
      url: social.url,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    form.reset();
  };

  if (!tenantId && !branchId) {
    return <p className="text-red-500">Error: Se requiere un ID de tenant o de sucursal.</p>;
  }

  if (isLoading) {
    return <CardContent>Cargando redes sociales...</CardContent>;
  }

  if (error) {
    return <CardContent className="text-red-500">Error al cargar redes sociales: {error.message}</CardContent>;
  }

  return (
    <div className="space-y-4">
      {socialNetworks?.map((social) => (
        <div
          key={social.id}
          className="flex items-center justify-between rounded-md border p-3"
        >
          {editingId === social.id ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col sm:flex-row gap-2 w-full"
              >
                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una red" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOCIAL_NETWORK_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem className="flex-grow-[2]">
                      <FormControl>
                        <Input placeholder="URL de la red social" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="icon">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelEdit}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex items-center gap-3 flex-grow">
              <SocialIcon networkName={social.network} className="h-5 w-5" />
              <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {social.url}
              </a>
            </div>
          )}
          {editingId !== social.id && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(social)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(social.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {isAdding && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col sm:flex-row gap-2 w-full mt-4 p-3 border rounded-md"
          >
            <FormField
              control={form.control}
              name="network"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel className="sr-only">Red Social</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una red" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SOCIAL_NETWORK_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="flex-grow-[2]">
                  <FormLabel className="sr-only">URL</FormLabel>
                  <FormControl>
                    <Input placeholder="URL de la red social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" size="icon">
                <Save className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancelEdit}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {!isAdding && !editingId && (
        <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Red Social
        </Button>
      )}
    </div>
  );
};