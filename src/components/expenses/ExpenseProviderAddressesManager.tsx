import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Address {
    id: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

interface ExpenseProviderAddressesManagerProps {
    providerId: string;
}

export const ExpenseProviderAddressesManager: React.FC<ExpenseProviderAddressesManagerProps> = ({ providerId }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: addresses, isLoading } = useQuery<Address[]>({
        queryKey: ["expenseProviderAddresses", providerId],
        queryFn: () => fetchTenantAction("get-expense-provider-addresses", { providerId }),
        enabled: !!providerId,
    });

    // En un futuro se podrían añadir modales para crear/editar/eliminar direcciones.
    // Por ahora, solo se muestra la información.

    if (isLoading) return <div>Cargando direcciones...</div>;
    if (!addresses || addresses.length === 0) return <div>No hay direcciones registradas.</div>;

    return (
        <div className="space-y-2">
            {addresses.map((address) => (
                <div key={address.id} className="p-3 border rounded-md text-sm">
                    <p>{address.address_line_1}</p>
                    {address.address_line_2 && <p>{address.address_line_2}</p>}
                    <p>{address.city}, {address.state} {address.postal_code}</p>
                    <p>{address.country}</p>
                </div>
            ))}
        </div>
    );
};
