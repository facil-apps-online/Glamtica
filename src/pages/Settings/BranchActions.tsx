import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Archive, Play, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useArchiveBranch } from '@/hooks/useBranches';
import { useNavigate } from 'react-router-dom';
import { ActivateBranchesBatchDialog } from './ActivateBranchesBatchDialog';

export function BranchActions({ branch, onSuccess, tenantId }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const archiveBranchMutation = useArchiveBranch(tenantId);
  const [isActivateDialogOpen, setActivateDialogOpen] = useState(false);

  const handleArchive = () => {
    archiveBranchMutation.mutate(branch.id, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'La sucursal ha sido archivada.', variant: 'success' });
        onSuccess();
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo archivar la sucursal: ${error.message}`, variant: 'destructive' });
      }
    });
  };

  const handleActivateClick = () => {
    setActivateDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => navigate(`/app/branches/${branch.id}/settings`)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </DropdownMenuItem>
          {(branch.status === 'pending_activation' || branch.status === 'archived') && (
            <DropdownMenuItem onClick={handleActivateClick}>
              <Play className="mr-2 h-4 w-4" />
              {branch.status === 'pending_activation' ? 'Activar' : 'Desarchivar'}
            </DropdownMenuItem>
          )}
          {branch.status === 'active' && !branch.is_main_branch && (
            <DropdownMenuItem onClick={handleArchive} disabled={archiveBranchMutation.isPending}>
              <Archive className="mr-2 h-4 w-4" />
              Archivar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ActivateBranchesBatchDialog
        isOpen={isActivateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        branchIds={[branch.id]}
        onSuccess={() => {
          onSuccess();
          setActivateDialogOpen(false);
        }}
        tenantId={tenantId}
      />
    </>
  );
}