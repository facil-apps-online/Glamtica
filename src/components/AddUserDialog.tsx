import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { InviteOrAssignUserFormValues } from '@/hooks/useInviteOrAssignUser';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useBranches } from '@/hooks/useBranches';

type AddUserFormValues = z.infer<ReturnType<typeof createValidationSchema>>;

const createValidationSchema = (userExists: boolean, roles: any[] = []) =>
  z.object({
    email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
    password: z.string().optional(),
    roleId: z.string().min(1, { message: 'Por favor, selecciona un rol.' }),
    branchId: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (!userExists && (!data.password || data.password.length < 8)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La contraseña debe tener al menos 8 caracteres.',
        path: ['password'],
      });
    }
    const selectedRole = roles.find((r) => r.id === data.roleId);
    if (selectedRole && selectedRole.name !== 'tenant_super_admin' && !data.branchId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Por favor, selecciona una sucursal.',
        path: ['branchId'],
      });
    }
  });

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InviteOrAssignUserFormValues) => void;
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

  const { currentAssignment, supabaseClient } = useAuth();
  const { data: roles, isLoading: isLoadingRoles } = useRoles(currentAssignment?.platform_id);
  const { data: branches, isLoading: isLoadingBranches } = useBranches(currentAssignment?.tenant_id);

  const tenantSuperAdminRole = useMemo(
    () => roles?.find((role) => role.name === 'tenant_super_admin'),
    [roles]
  );

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(createValidationSchema(userExists, roles)),
    defaultValues: { email: '', password: '', roleId: '', branchId: '' },
  });

  const watchedRoleId = useWatch({ control: form.control, name: 'roleId' });
  const isSuperAdminSelected = useMemo(
    () => !!(watchedRoleId && tenantSuperAdminRole && watchedRoleId === tenantSuperAdminRole.id),
    [watchedRoleId, tenantSuperAdminRole]
  );

  useEffect(() => {
    if (isSuperAdminSelected) {
      form.setValue('branchId', '');
      form.clearErrors('branchId');
    }
  }, [isSuperAdminSelected, form]);

  useEffect(() => {
    if (!open) {
      form.reset();
      setUserExists(false);
    }
  }, [open, form]);

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
          payload: { email, platformId: currentAssignment.platform_id },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.message);
      setUserExists(data.exists);
      if (data.exists) {
        form.clearErrors('password');
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
    } finally {
      setIsCheckingUser(false);
    }
  }, [form, currentAssignment, supabaseClient]);

  const debouncedCheckUser = useDebounce(checkUserExists, 500);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    form.setValue('email', email);
    debouncedCheckUser(email);
  };

  const handleFormSubmit = (values: AddUserFormValues) => {
    const submissionValues: InviteOrAssignUserFormValues = { ...values };
    if (userExists) {
      delete submissionValues.password;
    }
    if (isSuperAdminSelected) {
      delete submissionValues.branchId;
    }
    if (currentAssignment?.platform_id) {
      submissionValues.platformId = currentAssignment.platform_id;
    } else {
      console.error("Error: currentAssignment.platform_id no está disponible.");
      return;
    }
    onSubmit(submissionValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invitar Usuario al Negocio</DialogTitle>
          <DialogDescription>
            {isCheckingUser ? 'Verificando...' : userExists
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
                    <FormControl><Input type="password" placeholder="********" {...field} /></FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingRoles}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.display_name}</SelectItem>
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSuperAdminSelected || isLoadingBranches}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isSuperAdminSelected ? "No aplica para este rol" : "Selecciona una sucursal"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
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