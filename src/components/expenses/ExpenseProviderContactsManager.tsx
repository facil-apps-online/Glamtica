import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Plus } from "lucide-react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ExpenseProviderContactDialog } from "./ExpenseProviderContactDialog";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contact_types: { name: string };
}

interface ExpenseProviderContactsManagerProps {
  providerId: string;
}

export const ExpenseProviderContactsManager: React.FC<ExpenseProviderContactsManagerProps> = ({ providerId }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["expenseProviderContacts", providerId],
    queryFn: () => fetchTenantAction("get-expense-provider-contacts", { providerId }),
    enabled: !!providerId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchTenantAction("delete-expense-provider-contact", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseProviderContacts", providerId] });
      toast({ title: "Éxito", description: "Contacto eliminado exitosamente.", variant: "success" });
      setIsDeleteDialogOpen(false);
      setSelectedContactId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar contacto.",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setSelectedContactId(null);
    },
  });

  const handleDeleteClick = (id: string) => {
    setSelectedContactId(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div>
        {isLoading && <p>Cargando contactos...</p>}
        {!isLoading && contacts?.length === 0 && (
          <p className="text-sm text-gray-500">No hay contactos registrados para este proveedor.</p>
        )}
        {contacts?.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="font-semibold">{contact.name}</p>
              <p className="text-sm text-gray-500">{contact.contact_types?.name}</p>
              {contact.email && <p className="text-sm">{contact.email}</p>}
              {contact.phone && <p className="text-sm">{contact.phone}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <ExpenseProviderContactDialog
                providerId={providerId}
                contact={contact}
              >
                <Button type="button" variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </ExpenseProviderContactDialog>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteClick(contact.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => !open && setIsDeleteDialogOpen(false)}
        onConfirm={() => selectedContactId && deleteMutation.mutate(selectedContactId)}
        title="¿Estás seguro?"
        description="Esta acción eliminará el contacto permanentemente."
        isConfirming={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
};
