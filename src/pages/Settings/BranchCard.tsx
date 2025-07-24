import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Archive, Power } from 'lucide-react';
import { ActivateBranchDialog } from './ActivateBranchDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useArchiveBranch } from '@/hooks/useBranches';

const statusConfig = {
  active: { label: 'Activa', color: 'bg-green-500' },
  pending_activation: { label: 'Pendiente de Activación', color: 'bg-yellow-500' },
  archived: { label: 'Archivada', color: 'bg-slate-500' },
};

export function BranchCard({ branch, onSuccess }) {
  const [isActivateDialogOpen, setActivateDialogOpen] = useState(false);
  const { toast } = useToast();
  const archiveBranchMutation = useArchiveBranch();

  const handleArchive = async () => {
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

  const config = statusConfig[branch.status] || statusConfig.archived;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-primary flex items-center">
              <Badge className={`mr-2 ${config.color} text-white`}>{config.label}</Badge>
              {branch.name}
            </CardTitle>
            <CardDescription className="mt-1">{branch.address}</CardDescription>
          </div>
          {branch.status === 'active' && !branch.is_main_branch && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleArchive} disabled={archiveBranchMutation.isLoading}>
                  <Archive className="mr-2 h-4 w-4" /> Archivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {branch.status === 'pending_activation' && (
          <Button className="w-full" onClick={() => setActivateDialogOpen(true)}>
            <Power className="mr-2 h-4 w-4" />
            Activar Sucursal
          </Button>
        )}
        {branch.is_main_branch && <p className="text-sm text-slate-500">Esta es tu sucursal principal.</p>}
      </CardContent>

      <ActivateBranchDialog
        isOpen={isActivateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        branchId={branch.id}
        branchName={branch.name}
        onSuccess={onSuccess}
      />
    </Card>
  );
}
