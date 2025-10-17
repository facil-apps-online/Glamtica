import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useSupplierContacts, useCreateSupplierContact, useUpdateSupplierContact, useDeleteSupplierContact } from "@/hooks/useSupplierRelations";
import type { SupplierContact } from "@/hooks/useSupplierRelations";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";

import { useGetContactTypes } from "@/hooks/useContactTypes";

const contactFormSchema = z.object({
    contact_type_id: z.string().min(1, "El tipo de contacto es requerido."),
    name: z.string().min(1, "El nombre es requerido."),
    email: z.string().email("Debe ser un email válido.").optional().or(z.literal('')),
    phone: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export const SupplierContactDialog = ({ supplierId, contact, children }: { supplierId: string, contact?: SupplierContact, children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const createMutation = useCreateSupplierContact();
    const updateMutation = useUpdateSupplierContact();
    const { data: contactTypes, isLoading: isLoadingContactTypes } = useGetContactTypes();

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            contact_type_id: '',
            name: '',
            email: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (contact) {
                form.reset(contact);
            } else {
                form.reset({
                    contact_type_id: '',
                    name: '',
                    email: '',
                    phone: '',
                });
            }
        }
    }, [open, contact, form]);

    const onSubmit = (values: ContactFormValues) => {
        if (contact) {
            updateMutation.mutate({ ...values, id: contact.id }, { onSuccess: () => setOpen(false) });
        } else {
            createMutation.mutate({ ...values, supplier_id: supplierId }, { onSuccess: () => setOpen(false) });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{contact ? 'Editar Contacto' : 'Añadir Contacto'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={(e) => { e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="contact_type_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Contacto</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {isLoadingContactTypes ? (
                                                <SelectItem value="loading" disabled>Cargando...</SelectItem>
                                            ) : (
                                                contactTypes?.filter(ct => ct.is_for_supplier).map(ct => (
                                                    <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} />
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
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export const SupplierContactsManager = ({ supplierId }: { supplierId: string }) => {
    const { data: contacts, isLoading } = useSupplierContacts(supplierId);
    const { mutate: deleteContact } = useDeleteSupplierContact();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/4" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div>

            <div className="space-y-4">
                {contacts?.map(contact => (
                    <Card key={contact.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="capitalize">{contact.contact_types.name}</CardTitle>
                            <div className="flex items-center gap-2">
                                <SupplierContactDialog supplierId={supplierId} contact={contact}>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </SupplierContactDialog>
                                <Button variant="ghost" size="icon" onClick={() => deleteContact({ id: contact.id })}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Nombre:</strong> {contact.name}</p>
                            <p><strong>Email:</strong> {contact.email}</p>
                            <p><strong>Teléfono:</strong> {contact.phone}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};