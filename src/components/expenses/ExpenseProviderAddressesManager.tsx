import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { AddressAutocompleteInput } from "@/components/AddressAutocompleteInput";
import { MapDisplay } from "@/components/MapDisplay";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

interface ExpenseProviderAddress {
    id: string;
    expense_provider_id: string;
    name: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
}

const addressFormSchema = z.object({
    name: z.string().min(1, "El nombre es requerido."),
    address_line_1: z.string().nullable().optional(),
    address_line_2: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

const ExpenseProviderAddressFormCard = ({ providerId, address, onSave, onCancel }: { providerId: string, address?: ExpenseProviderAddress, onSave: () => void, onCancel: () => void }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (newAddress: AddressFormValues & { expense_provider_id: string }) =>
            fetchTenantAction("create-expense-provider-address", newAddress),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenseProviderAddresses", providerId] });
            toast({ title: "Éxito", description: "Dirección creada exitosamente.", variant: "success" });
            onSave();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedAddress: AddressFormValues & { id: string }) =>
            fetchTenantAction("update-expense-provider-address", updatedAddress),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenseProviderAddresses", providerId] });
            toast({ title: "Éxito", description: "Dirección actualizada exitosamente.", variant: "success" });
            onSave();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressFormSchema),
        defaultValues: address || {
            name: "",
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
            latitude: null,
            longitude: null,
        },
    });

    useEffect(() => {
        if (address) {
            form.reset({
                name: address.name || "",
                address_line_1: address.address_line_1 || "",
                address_line_2: address.address_line_2 || "",
                city: address.city || "",
                state: address.state || "",
                postal_code: address.postal_code || "",
                country: address.country || "",
                latitude: address.latitude || null,
                longitude: address.longitude || null,
            });
        } else {
            form.reset({
                name: "",
                address_line_1: '',
                address_line_2: '',
                city: '',
                state: '',
                postal_code: '',
                country: '',
                latitude: null,
                longitude: null,
            });
        }
    }, [address, form]);

    const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
        const get = (type: string) => place.address_components?.find(c => c.types.includes(type))?.long_name || '';
        form.setValue('address_line_1', `${get('route')} ${get('street_number')}`.trim(), { shouldDirty: true });
        form.setValue('city', get('locality'), { shouldDirty: true });
        form.setValue('state', get('administrative_area_level_1'), { shouldDirty: true });
        form.setValue('postal_code', get('postal_code'), { shouldDirty: true });
        form.setValue('country', get('country'), { shouldDirty: true });
        if (place.geometry?.location) {
            form.setValue('latitude', place.geometry.location.lat(), { shouldDirty: true });
            form.setValue('longitude', place.geometry.location.lng(), { shouldDirty: true });
        }
    };

    const onSubmit = (values: AddressFormValues) => {
        if (address) {
            updateMutation.mutate({ ...values, id: address.id });
        } else {
            createMutation.mutate({ ...values, expense_provider_id: providerId });
        }
    };

    const watchedLat = form.watch('latitude');
    const watchedLng = form.watch('longitude');

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>{address ? 'Editar Dirección' : 'Añadir Dirección'}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre de la Dirección</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ej: Casa, Oficina, Bodega" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="search_address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Buscar Dirección</FormLabel>
                                            <FormControl>
                                                <AddressAutocompleteInput onPlaceSelected={handlePlaceSelected} isGlobalSearch={true} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="address_line_1" render={({ field }) => (<FormItem><FormLabel>Línea 1</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="address_line_2" render={({ field }) => (<FormItem><FormLabel>Línea 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>Estado/Provincia</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="postal_code" render={({ field }) => (<FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-96 sticky top-24">
                                    {watchedLat && watchedLng && <MapDisplay latitude={watchedLat} longitude={watchedLng} />}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                </Form>
            </CardContent>
        </Card>
    );
};

export const ExpenseProviderAddressesManager = ({ providerId, isAdding, setIsAdding }: { providerId: string, isAdding: boolean, setIsAdding: (isAdding: boolean) => void }) => {
    const { data: addresses, isLoading } = useQuery<ExpenseProviderAddress[]>({
        queryKey: ["expenseProviderAddresses", providerId],
        queryFn: () => fetchTenantAction("get-expense-provider-addresses", { providerId }),
        enabled: !!providerId,
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [editingAddress, setEditingAddress] = useState<ExpenseProviderAddress | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => fetchTenantAction("delete-expense-provider-address", { id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenseProviderAddresses", providerId] });
            toast({ title: "Éxito", description: "Dirección eliminada exitosamente.", variant: "success" });
            setIsDeleteDialogOpen(false);
            setSelectedAddressId(null);
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            setIsDeleteDialogOpen(false);
            setSelectedAddressId(null);
        },
    });

    const handleDeleteClick = (id: string) => {
        setSelectedAddressId(id);
        setIsDeleteDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const handleSave = () => {
        setEditingAddress(null);
        setIsAdding(false);
    };

    const handleCancel = () => {
        setEditingAddress(null);
        setIsAdding(false);
    };

    return (
        <div>
            {(isAdding || editingAddress) && (
                <ExpenseProviderAddressFormCard
                    providerId={providerId}
                    address={editingAddress || undefined}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}

            <div className="space-y-4">
                {addresses?.map(address => (
                    <Card key={address.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{address.name}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => { setEditingAddress(address); setIsAdding(true); }}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteClick(address.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p>{address.address_line_1}</p>
                            {address.address_line_2 && <p>{address.address_line_2}</p>}
                            <p>{address.city}, {address.state} {address.postal_code}</p>
                            <p>{address.country}</p>
                            {address.latitude && address.longitude && (
                                <div className="w-full h-48 mt-4 rounded-lg overflow-hidden">
                                    <MapDisplay latitude={address.latitude} longitude={address.longitude} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
            <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => !open && setIsDeleteDialogOpen(false)}
                onConfirm={() => selectedAddressId && deleteMutation.mutate(selectedAddressId)}
                title="¿Estás seguro?"
                description="Esta acción eliminará la dirección permanentemente."
                isConfirming={deleteMutation.isPending}
                variant="destructive"
            />
        </div>
    );
};