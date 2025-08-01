import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { LinkUserFormValues } from '@/hooks/useLinkUserToTenant';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useBranches } from '@/hooks/useBranches';

// Esquema de validación base (con rol y sucursal)
const baseSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleId: z.string().uuid({ message: 'Por favor, selecciona un rol válido.' }),
  branchId: z.string().uuid({ message: 'Por favor, selecciona una sucursal válida.' }),
});

// Esquema para cuando el usuario es nuevo (requiere contraseña)
const newUserSchema = baseSchema.extend({
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
});

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LinkUserFormValues) => void;
  isSubmitting: boolean;
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}) => {
  const [userExists, setUserExists] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const form = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(userExists ? baseSchema : newUserSchema),
    defaultValues: { email: '', password: '', roleId: '', branchId: '' },
  });
  
  // Resetear el estado cuando el diálogo se cierra
  useEffect(() => {
    if (!open) {
      form.reset();
      setUserExists(false);
    }
  }, [open, form]);

  const { currentAssignment, supabaseClient } = useAuth();

  const { data: roles, isLoading: isLoadingRoles } = useRoles(currentAssignment?.platform_id);
  const { data: branches, isLoading: isLoadingBranches } = useBranches(currentAssignment?.platform_id);

  const checkUserExists = useCallback(async (email: string) => {
    if (!email || !z.string().email().safeParse(email).success) {
      setUserExists(false);
      return;
    }
    setIsCheckingUser(true);
    try {
      if (!currentAssignment || !currentAssignment.platform_id) {
        throw new Error('No se pudo obtener el ID de la plataforma del usuario actual.');
      }

      const { data, error } = await supabaseClient.functions.invoke('user-actions', {
        body: {
          action: 'check_user_exists_in_auth',
          payload: {
            email: email,
            platformId: currentAssignment.platform_id,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Error al verificar la existencia del usuario.');
      }
      if (!data.success) {
        throw new Error(data.message || 'Error al verificar la existencia del usuario.');
      }
      setUserExists(data.exists);
      if (data.exists) {
        form.clearErrors('password');
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
    } finally {
      setIsCheckingUser(false);
    }
  }, [form, currentAssignment]);

  const debouncedCheckUser = useDebounce(checkUserExists, 500);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    form.setValue('email', email);
    debouncedCheckUser(email);
  };
  
  const handleFormSubmit = (values: z.infer<typeof newUserSchema>) => {
    const submissionValues: LinkUserFormValues = { ...values };
    if (userExists) {
      delete submissionValues.password;
    }
    onSubmit(submissionValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invitar Usuario al Negocio</DialogTitle>
          <DialogDescription>
            {userExists 
              ? "Este usuario ya existe en la plataforma. Se le vinculará a tu negocio."
              : "Completa los datos para crear un nuevo usuario y vincularlo a tu negocio."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@ejemplo.com" {...field} onChange={handleEmailChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!userExists && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingRoles}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.display_name}
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
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingBranches}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isCheckingUser || isLoadingRoles || isLoadingBranches}>
                {isSubmitting ? 'Guardando...' : (userExists ? 'Vincular Usuario' : 'Crear y Vincular')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};