import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches, useDeleteBranch, Branch } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BranchDialog from '@/components/BranchDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
      toast({ title: 'Éxito', description: 'Sucursal eliminada correctamente.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsAlertOpen(false);
      setBranchToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestionar Sucursales</h1>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Sucursal
        </Button>
      </div>

      {isLoading ? (
        <p>Cargando sucursales...</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches?.map(branch => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">
                    {branch.name}
                    {branch.is_main_branch && <span className="ml-2 text-xs text-muted-foreground">(Principal)</span>}
                  </TableCell>
                  <TableCell>{branch.address_line_1 || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(branch)} disabled={branch.is_main_branch}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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