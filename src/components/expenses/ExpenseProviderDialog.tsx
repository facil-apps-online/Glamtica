import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatterBox } from "@/components/ChatterBox";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { Plus, Edit, X, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentType {
  id: string;
  name: string;
}

interface ExpenseProvider {
    id: string;
    name: string;
    identification_number: string;
    document_type_id?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
    branch_ids?: string[];
}

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  document_type_id: z.string().min(1, "El tipo de documento es requerido.").optional().nullable(),
  identification_number: z.string().min(1, "El número de documento es requerido.").optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Debe ser un email válido.").optional().or(z.literal('')),
});

type ExpenseProviderFormValues = z.infer<typeof formSchema>;

interface ExpenseProviderDialogProps {
  provider?: ExpenseProvider;
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const ExpenseProviderDialog = ({ provider: initialProvider, trigger, onOpenChange }: ExpenseProviderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const form = useForm<ExpenseProviderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        document_type_id: '',
        identification_number: '',
        phone: '',
        email: '',
    },
  });
    
      const { data: documentTypes, isLoading: isLoadingDocumentTypes } = useQuery<DocumentType[]> ({
        queryKey: ["documentTypes", "supplier"],
        queryFn: () => fetchTenantAction("get_document_types", { applies_to: "supplier" }),
      });
    
      const createMutation = useMutation({
        mutationFn: (newProvider: any) =>
          fetchTenantAction("create-expense-provider", { ...newProvider }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["expenseProviders"] });
          toast({ title: "Proveedor de Gasto creado exitosamente.", variant: "success" });
          handleOpenChange(false);
        },
        onError: (error: any) => {
          toast({
            title: "Error al crear proveedor de gasto.",
            description: error.response?.data?.error || error.message,
            variant: "destructive",
          });
        },
      });
    
      const updateMutation = useMutation({
        mutationFn: ({ id, ...updates }: { id: string; updates: any }) =>
          fetchTenantAction("update-expense-provider", { id, ...updates }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["expenseProviders"] });
          toast({ title: "Proveedor de Gasto actualizado exitosamente.", variant: "success" });
          handleOpenChange(false);
        },
        onError: (error: any) => {
          toast({
            title: "Error al actualizar proveedor de gasto.",
            description: error.response?.data?.error || error.message,
            variant: "destructive",
          });
        },
      });
      
      const { formState: { isDirty } } = form;
    
      useEffect(() => {
        if (open && initialProvider) {
            form.reset({
                ...initialProvider,
                phone: initialProvider.phone || '',
                email: initialProvider.email || '',
            });
        } else if (open && !initialProvider) {
            form.reset({
                name: '',
                document_type_id: '',
                identification_number: '',
                phone: '',
                email: '',
            });
        }
      }, [open, initialProvider, form]);
    
      const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        onOpenChange?.(isOpen);
      };
    
      const onSubmit = async (values: ExpenseProviderFormValues) => {
        if (initialProvider) {
          updateMutation.mutate({ id: initialProvider.id, ...values });
        } else {
          createMutation.mutate(values);
        }
      };
    
      return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>{trigger || <Button><Plus className="w-4 h-4 mr-2" />Nuevo Proveedor</Button>}</DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                {initialProvider ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {initialProvider ? "Editar Proveedor de Gasto" : "Nuevo Proveedor de Gasto"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="activity" disabled={!initialProvider}>Actividad</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="pt-4 space-y-4">
                     <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Proveedor</FormLabel><FormControl><Input {...field} placeholder="Ej: Papelería El Lápiz" required /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="document_type_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Identificación</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                            <SelectContent>{isLoadingDocumentTypes ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : documentTypes?.map((type) => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="identification_number" render={({ field }) => (<FormItem><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} placeholder="Ej: 123456789-0" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} value={field.value || ''} placeholder="Ej: +57 3001234567" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ''} placeholder="contacto@proveedor.com" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </TabsContent>

              <TabsContent value="activity">
                {initialProvider && tenantId && (
                  <ChatterBox
                    resourceType="expense_providers"
                    resourceId={initialProvider.id}
                    tenantId={tenantId}
                    containerClassName="h-[50vh]"
                  />
                )}
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    <X className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Cancelar</span>
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || (initialProvider && !isDirty)}>
                    <Save className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{initialProvider ? "Actualizar" : "Crear Proveedor"}</span>
                </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};