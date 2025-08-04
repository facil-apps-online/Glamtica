import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranches } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { PlusCircle, Power, Store } from 'lucide-react';
import { CreateBranchDialog } from '@/components/CreateBranchDialog';
import { BranchCard } from '@/pages/Settings/BranchCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BranchActions } from '@/pages/Settings/BranchActions';
import { Checkbox } from '@/components/ui/checkbox';
import { ActivateBranchesBatchDialog } from '@/pages/Settings/ActivateBranchesBatchDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';

const statusConfig = {
  active: { label: 'Activa', className: 'bg-green-100 text-green-800' },
  pending_activation: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  archived: { label: 'Archivada', className: 'bg-slate-100 text-slate-800' },
};

export default function BranchesPage() {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const navigate = useNavigate();
  const [isBatchActivateDialogOpen, setBatchActivateDialogOpen] = useState(false);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const { data: branches, isLoading, error } = useBranches(tenantId);
  
  const queryClient = useQueryClient();
  const screenSize = useScreenSize();

  const pendingBranches = useMemo(() => {
    return branches?.filter(b => b.status === 'pending_activation') || [];
  }, [branches]);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    setSelectedBranchIds([]);
    setBatchActivateDialogOpen(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBranchIds(pendingBranches.map(b => b.id));
    } else {
      setSelectedBranchIds([]);
    }
  };

  const handleSelectRow = (branchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBranchIds(prev => [...prev, branchId]);
    } else {
      setSelectedBranchIds(prev => prev.filter(id => id !== branchId));
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return screenSize === 'mobile'
        ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
        : <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
    }

    if (error) {
      return <p className="text-red-500">Error al cargar las sucursales: {error.message}</p>;
    }

    if (!branches || branches.length === 0) {
      return <p>No hay sucursales para este tenant.</p>
    }

    if (screenSize === 'mobile') {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} onSuccess={handleSuccess} tenantId={tenantId} />
          ))}
        </div>
      );
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedBranchIds.length > 0 && selectedBranchIds.length === pendingBranches.length}
                  onCheckedChange={handleSelectAll}
                  disabled={pendingBranches.length === 0}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => {
              const config = statusConfig[branch.status] || statusConfig.archived;
              const isSelected = selectedBranchIds.includes(branch.id);
              return (
                <TableRow key={branch.id} data-state={isSelected ? "selected" : ""}>
                  <TableCell>
                    {branch.status === 'pending_activation' && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(branch.id, !!checked)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell className="text-slate-600">{branch.address}</TableCell>
                  <TableCell className="text-slate-600">{branch.contact_phone || branch.whatsapp_phone}</TableCell>
                  <TableCell>
                    {branch.is_main_branch ? (
                      <Badge variant="secondary">Principal</Badge>
                    ) : (
                      <Badge variant="outline">Sucursal</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={config.className}>{config.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <BranchActions branch={branch} onSuccess={handleSuccess} tenantId={tenantId} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Store className="h-5 w-5" />
                Gestionar Sucursales
              </CardTitle>
              <CardDescription>Crea, activa y administra las sucursales del tenant.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedBranchIds.length > 0 && (
                <Button variant="outline" onClick={() => setBatchActivateDialogOpen(true)}>
                  <Power className="mr-2 h-4 w-4" />
                  Activar ({selectedBranchIds.length})
                </Button>
              )}
              <Button onClick={() => navigate('/branches/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Sucursal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      <ActivateBranchesBatchDialog
        isOpen={isBatchActivateDialogOpen}
        onOpenChange={setBatchActivateDialogOpen}
        branchIds={selectedBranchIds}
        onSuccess={handleSuccess}
        tenantId={tenantId}
      />
    </div>
  );
}
