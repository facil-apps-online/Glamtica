import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateBranch, useUpdateBranch, Branch } from '@/hooks/useBranches';
import { useToast } from '@/hooks/use-toast';

interface BranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchToEdit?: Branch | null;
}

export default function BranchDialog({ isOpen, onClose, branchToEdit }: BranchDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const { toast } = useToast();

  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();

  useEffect(() => {
    if (branchToEdit) {
      setName(branchToEdit.name || '');
      setAddress(branchToEdit.address_line_1 || '');
    } else {
      setName('');
      setAddress('');
    }
  }, [branchToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Error', description: 'El nombre de la sucursal es requerido.', variant: 'destructive' });
      return;
    }

    const branchData = {
      name: name.trim(),
      address_line_1: address.trim(),
    };

    try {
      if (branchToEdit) {
        await updateBranchMutation.mutateAsync({ id: branchToEdit.id, ...branchData });
        toast({ title: 'Éxito', description: 'Sucursal actualizada correctamente.' });
      } else {
        await createBranchMutation.mutateAsync(branchData);
        toast({ title: 'Éxito', description: 'Sucursal creada correctamente.' });
      }
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const isLoading = createBranchMutation.isLoading || updateBranchMutation.isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{branchToEdit ? 'Editar Sucursal' : 'Añadir Nueva Sucursal'}</DialogTitle>
            <DialogDescription>
              {branchToEdit ? 'Modifica los detalles de la sucursal.' : 'Completa los detalles de la nueva sucursal.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Dirección</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}