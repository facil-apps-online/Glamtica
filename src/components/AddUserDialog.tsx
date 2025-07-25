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
import { supabase } from '@/lib/supabaseClient';
import { useDebounce } from '@/hooks/useDebounce';
import { LinkUserFormValues } from '@/hooks/useLinkUserToTenant';

// Esquema de validación base (sin rol ni sucursal)
const baseSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  firstName: z.string().min(1, { message: 'El nombre es obligatorio.' }),
  lastName: z.string().min(1, { message: 'El apellido es obligatorio.' }),
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
    defaultValues: { email: '', firstName: '', lastName: '', password: '' },
  });
  
  // Resetear el estado cuando el diálogo se cierra
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
      const { data, error } = await supabase.rpc('check_user_exists_by_email', { p_email: email });
      if (error) throw error;
      setUserExists(data);
      if (data) {
        form.clearErrors('password');
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
    } finally {
      setIsCheckingUser(false);
    }
  }, [form]);

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
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} disabled={userExists} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} disabled={userExists} />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isCheckingUser}>
                {isSubmitting ? 'Guardando...' : (userExists ? 'Vincular Usuario' : 'Crear y Vincular')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};