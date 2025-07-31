import { Button } from '@/components/ui/button';
import { MoreHorizontal, Archive, Play } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useArchiveBranch, useActivateBranch } from '@/hooks/useBranches';

export function BranchActions({ branch, onSuccess, tenantId }) {
  const { toast } = useToast();
  const archiveBranchMutation = useArchiveBranch(tenantId);
  const activateBranchMutation = useActivateBranch(tenantId);

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

  const handleActivate = () => {
    activateBranchMutation.mutate(branch.id, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'La sucursal ha sido activada.' });
        onSuccess();
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo activar la sucursal: ${error.message}`, variant: 'destructive' });
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {branch.status === 'pending_activation' && (
          <DropdownMenuItem onClick={handleActivate} disabled={activateBranchMutation.isPending}>
            <Play className="mr-2 h-4 w-4" />
            Activar
          </DropdownMenuItem>
        )}
        {branch.status === 'archived' && (
          <DropdownMenuItem onClick={handleActivate} disabled={activateBranchMutation.isPending}>
            <Play className="mr-2 h-4 w-4" />
            Desarchivar
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
  );
}
