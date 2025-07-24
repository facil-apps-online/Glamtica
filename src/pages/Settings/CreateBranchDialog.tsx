import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCreateBranch } from '@/hooks/useBranches'; // Use the hook

export function CreateBranchDialog({ isOpen, onOpenChange, onSuccess }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const { toast } = useToast();
  const createBranchMutation = useCreateBranch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    createBranchMutation.mutate({
      p_name: name,
      p_address: address,
    }, {
      onSuccess: () => {
        toast({
          title: '¡Éxito!',
          description: 'La nueva sucursal está lista para ser activada.',
        });
        onSuccess();
        onOpenChange(false);
        setName('');
        setAddress('');
      },
      onError: (error) => {
        toast({
          title: 'Error al crear la sucursal',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Nueva Sucursal</DialogTitle>
          <DialogDescription>
            Configura una nueva sucursal. Podrás activarla inmediatamente después de crearla.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nombre de la Sucursal</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={createBranchMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBranchMutation.isPending}>
              {createBranchMutation.isPending ? 'Creando...' : 'Crear Sucursal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}