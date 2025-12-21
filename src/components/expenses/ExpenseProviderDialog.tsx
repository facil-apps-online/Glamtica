import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useQuery } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  document_type_id: z.string().uuid("Selecciona un tipo de documento.").nullable().optional(),
  identification_number: z.string().max(50, "El número no debe exceder 50 caracteres.").nullable().optional(),
  phone: z.string().max(20, "El teléfono no debe exceder 20 caracteres.").nullable().optional(),
  email: z.string().email("Email inválido.").max(255, "El email no debe exceder 255 caracteres.").nullable().optional(),
  address_line_1: z.string().max(255).nullable().optional(),
  address_line_2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
});

interface ExpenseProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isSubmitting: boolean;
  initialData?: z.infer<typeof formSchema> & { id?: string };
}

export const ExpenseProviderDialog: React.FC<ExpenseProviderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      document_type_id: undefined,
      identification_number: "",
      phone: "",
      email: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    },
  });

  const { data: documentTypes, isLoading: isLoadingDocumentTypes } = useQuery({
    queryKey: ["documentTypes", "expense_provider"],
    queryFn: () => fetchTenantAction("get_document_types", { applies_to: "expense_provider" }),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        document_type_id: initialData.document_type_id || undefined,
        identification_number: initialData.identification_number || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        address_line_1: initialData.address_line_1 || "",
        address_line_2: initialData.address_line_2 || "",
        city: initialData.city || "",
        state: initialData.state || "",
        postal_code: initialData.postal_code || "",
        country: initialData.country || "",
      });
    }
  }, [initialData, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Proveedor de Gastos" : "Crear Proveedor de Gastos"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del proveedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="document_type_id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo Documento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingDocumentTypes}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {documentTypes?.map((docType: any) => (
                            <SelectItem key={docType.id} value={docType.id}>
                            {docType.name}
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
                name="identification_number"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nº Identificación</FormLabel>
                    <FormControl>
                        <Input placeholder="Número" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Teléfono de contacto" {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_line_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Dirección principal" {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
