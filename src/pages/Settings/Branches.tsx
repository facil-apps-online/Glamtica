import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches, useDeleteBranch, Branch } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import BranchDialog from '@/components/BranchDialog';
import { useToast } from '@/hooks/use-toast';
import { BranchCard } from "@/components/BranchCard";


import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from '@/components/PageHeader';

export default function BranchesPage() {
  const { user } = useAuth();
  const { data: branches, isLoading } = useBranches(user?.tenant_id || '');
  const deleteBranchMutation = useDeleteBranch();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const handleAdd = () => {
    setBranchToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setBranchToEdit(branch);
    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (branch: Branch) => {
    if (branch.is_main_branch) {
      toast({ title: 'Acción no permitida', description: 'No se puede eliminar la sucursal principal.', variant: 'destructive' });
      return;
    }
    setBranchToDelete(branch);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!branchToDelete) return;
    try {
      await deleteBranchMutation.mutateAsync(branchToDelete.id);
      toast({ title: 'Éxito', description: 'Sucursal eliminada correctamente.', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsAlertOpen(false);
      setBranchToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Gestionar Sucursales"
        subtitle="Añade, edita y administra las ubicaciones de tu negocio."
      >
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Sucursal
        </Button>
      </PageHeader>

      {isLoading ? (
        <p>Cargando sucursales...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches?.map(branch => (
            <BranchCard
              key={branch.id}
              branch={branch}
              handleEdit={handleEdit}
              handleDeleteRequest={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      <BranchDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        branchToEdit={branchToEdit}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la sucursal "{branchToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}