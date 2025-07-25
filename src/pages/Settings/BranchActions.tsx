import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Archive } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useArchiveBranch } from '@/hooks/useBranches';

export function BranchActions({ branch, onSuccess, tenantId }) {
  const { toast } = useToast();
  const archiveBranchMutation = useArchiveBranch(tenantId);

  const handleArchive = () => {
    archiveBranchMutation.mutate(branch.id, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'La sucursal ha sido archivada.' });
        onSuccess();
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo archivar la sucursal: ${error.message}`, variant: 'destructive' });
      }
    });
  };

  if (branch.is_main_branch || branch.status === 'pending_activation') {
    return null;
  }

  if (branch.status === 'active') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleArchive} disabled={archiveBranchMutation.isPending}>
            <Archive className="mr-2 h-4 w-4" />
            Archivar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}
