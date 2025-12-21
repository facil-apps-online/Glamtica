import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";

interface ContactType {
  id: string;
  name: string;
}

interface ExpenseProviderContactDialogProps {
  providerId: string;
  contact?: z.infer<typeof formSchema> & { id: string };
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const formSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  contact_type_id: z.string().min(1, "El tipo de contacto es requerido."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export const ExpenseProviderContactDialog: React.FC<ExpenseProviderContactDialogProps> = ({ providerId, contact, onSuccess, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: contact || {
      name: "",
      contact_type_id: "",
      email: "",
      phone: "",
    },
  });

  const { data: contactTypes, isLoading: isLoadingContactTypes } = useQuery<ContactType[]>({
    queryKey: ["contactTypes", "expense_provider"],
    queryFn: () => fetchTenantAction("get_contact_types", { applies_to: "expense_provider" }),
  });

  const mutation = useMutation({
    mutationFn: (newContact: FormValues & { expense_provider_id: string; id?: string }) => {
      const action = newContact.id ? "update-expense-provider-contact" : "create-expense-provider-contact";
      return fetchTenantAction(action, newContact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseProviderContacts", providerId] });
      toast({ title: `Contacto ${contact ? 'actualizado' : 'creado'} exitosamente.`, variant: "success" });
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: `Error al ${contact ? 'actualizar' : 'crear'} contacto.`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(contact || { name: "", contact_type_id: "", email: "", phone: "" });
    }
  }, [isOpen, contact, form]);

  const onSubmit = (values: FormValues) => {
    mutation.mutate({ ...values, expense_provider_id: providerId, id: contact?.id });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
            <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> Añadir Contacto
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Editar Contacto" : "Añadir Contacto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="contact_type_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contacto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingContactTypes}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                  <SelectContent>{contactTypes?.map(type => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
