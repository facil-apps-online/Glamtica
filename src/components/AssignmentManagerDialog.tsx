import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AssignmentFormValue } from '@/hooks/useUserAssignments';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeUserAction } from '@/hooks/useUserActions';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useBranches } from '@/hooks/useBranches';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScreenSize } from '@/hooks/useScreenSize';

import { TenantUserAssignment } from '@/hooks/useTenantUsers';

interface AssignmentFormValue {
  assignment_id?: string;
  tenant_id: string;
  branch_id: string | null;
  role_id: string | null;
  status: 'active' | 'inactive' | 'pending_configuration';
  is_schedulable: boolean;
  base_salary?: number;
  default_product_commission_rate?: number;
  default_service_commission_rate?: number;
}

interface AssignmentManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  tenantId: string;
  userName: string;
  initialUserAssignments: TenantUserAssignment[];
}

const LoadingSkeleton = () => (
  <div className="space-y-4 pt-4">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 flex-grow" />
      <Skeleton className="h-10 flex-grow" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-10" />
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 flex-grow" />
      <Skeleton className="h-10 flex-grow" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-10" />
    </div>
    <Skeleton className="h-10 w-32" />
  </div>
);

export const AssignmentManagerDialog: React.FC<AssignmentManagerDialogProps> = ({
  open,
  onOpenChange,
  userId,
  tenantId,
  userName,
  initialUserAssignments,
}) => {
  const queryClient = useQueryClient();
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const { data: branches, isLoading: isLoadingBranches } = useBranches(tenantId);
  const { refreshUser } = useAuth();
  const updateAssignmentsMutation = useMutation<any, Error, { userId: string; tenantId: string; assignments: AssignmentFormValue[] }>({
    mutationFn: async ({ userId, tenantId, assignments }) => {
      return invokeUserAction('update-assignments', { userId, tenantId, assignments });
    },
    onSuccess: async () => {
      toast({ title: 'Éxito', description: 'Asignaciones actualizadas correctamente.', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['tenantUsers', tenantId] });
      onOpenChange(false);
      await refreshUser(); // Refresh user session to reflect changes
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
  const { toast } = useToast();
  const screenSize = useScreenSize();

  const [editableAssignments, setEditableAssignments] = useState<AssignmentFormValue[]>([]);

  const superAdminRoleId = useMemo(() => {
    return roles?.find(r => r.name === 'tenant_super_admin')?.id;
  }, [roles]);

  useEffect(() => {
    if (initialUserAssignments) {
      const formattedAssignments = initialUserAssignments.map(a => ({
        assignment_id: a.assignment_id,
        tenant_id: tenantId,
        branch_id: a.branch_id,
        role_id: a.role_id,
        status: a.status === 'pending_configuration' ? 'inactive' : a.status,
        is_schedulable: a.is_schedulable ?? false,
        base_salary: a.base_salary ?? 0,
        default_product_commission_rate: a.default_product_commission_rate ?? 0,
        default_service_commission_rate: a.default_service_commission_rate ?? 0,
      }));
      setEditableAssignments(formattedAssignments);
    }
  }, [initialUserAssignments, open, tenantId]);

  const handleAssignmentChange = (index: number, field: keyof AssignmentFormValue, value: string | boolean | number | null) => {
    const newAssignments = [...editableAssignments];
    const currentAssignment = { ...newAssignments[index] };

    if (field === 'status') {
      currentAssignment.status = typeof value === 'boolean' ? (value ? 'active' : 'inactive') : value as 'active' | 'inactive';
    } else if (field === 'base_salary' || field === 'default_product_commission_rate' || field === 'default_service_commission_rate') {
      // Convertir a número, asegurando que no sea NaN. Usar 0 como fallback.
      const numericValue = Number(value);
      (currentAssignment[field] as any) = isNaN(numericValue) ? 0 : numericValue;
    }
    else {
      (currentAssignment[field] as any) = value;
    }

    // Super Admin Rule: if role is super admin, branch must be null
    if (field === 'role_id' && value === superAdminRoleId) {
      currentAssignment.branch_id = null;
    }
    
    newAssignments[index] = currentAssignment;
    setEditableAssignments(newAssignments);
  };

  const handleAddAssignment = () => {
    setEditableAssignments([...editableAssignments, { 
      tenant_id: tenantId, 
      role_id: null, 
      branch_id: null, 
      status: 'active',
      base_salary: 0,
      default_product_commission_rate: 0,
      default_service_commission_rate: 0,
    }]);
  };

  const handleRemoveAssignment = (index: number) => {
    const newAssignments = editableAssignments.filter((_, i) => i !== index);
    setEditableAssignments(newAssignments);
  };

  const handleSaveChanges = () => {
    const assignmentsToSave = editableAssignments.map(a => ({
      ...a,
      // Ensure branch_id is null if role is super_admin before saving
      branch_id: a.role_id === superAdminRoleId ? null : a.branch_id,
    }));
    updateAssignmentsMutation.mutate({ userId, tenantId, assignments: assignmentsToSave });
  };

  const isLoading = isLoadingRoles || isLoadingBranches;
  const isError = false;

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton />;
    if (isError) return <p className="text-red-500 text-center py-8">Error al cargar los datos necesarios.</p>;

    const usedBranchIds = editableAssignments.map(a => a.branch_id).filter(Boolean);

    const renderAssignmentRow = (assignment: AssignmentFormValue, index: number) => {
      const isSuperAdmin = assignment.role_id === superAdminRoleId;
      const availableBranches = branches?.filter(b => !usedBranchIds.includes(b.id) || b.id === assignment.branch_id);

      // Diseño de tarjeta unificado y responsivo para cada asignación
      return (
        <div key={index} className="p-4 border rounded-lg space-y-4 relative bg-muted/20">
          
          {/* Encabezado de la tarjeta con título y botón de eliminar */}
          <div className="flex justify-between items-start">
            <h4 className="font-semibold pt-1">Asignación #{index + 1}</h4>
            <Button variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => handleRemoveAssignment(index)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          {/* Fila para Rol y Sucursal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select value={assignment.role_id || ''} onValueChange={(value) => handleAssignmentChange(index, 'role_id', value)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar Rol" /></SelectTrigger>
                <SelectContent>{roles?.map(role => <SelectItem key={role.id} value={role.id}>{role.display_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sucursal</Label>
              <Select
                value={assignment.branch_id || ''}
                onValueChange={(value) => handleAssignmentChange(index, 'branch_id', value)}
                disabled={isSuperAdmin}
              >
                <SelectTrigger><SelectValue placeholder={isSuperAdmin ? "N/A (Super Admin)" : "Seleccionar Sucursal"} /></SelectTrigger>
                <SelectContent>
                  {availableBranches?.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila para Salario y Comisiones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                  <Label htmlFor={`base_salary-${index}`}>Salario Base</Label>
                  <Input
                      id={`base_salary-${index}`}
                      type="number"
                      value={assignment.base_salary ?? ''}
                      onChange={(e) => handleAssignmentChange(index, 'base_salary', e.target.value)}
                      placeholder="0.00"
                      className="text-right"
                  />
              </div>
              <div className="space-y-1">
                  <Label htmlFor={`product_commission-${index}`}>Com. Prod. (%)</Label>
                  <Input
                      id={`product_commission-${index}`}
                      type="number"
                      value={assignment.default_product_commission_rate ?? ''}
                      onChange={(e) => handleAssignmentChange(index, 'default_product_commission_rate', e.target.value)}
                      placeholder="0.00"
                      className="text-right"
                  />
              </div>
              <div className="space-y-1">
                  <Label htmlFor={`service_commission-${index}`}>Com. Serv. (%)</Label>
                  <Input
                      id={`service_commission-${index}`}
                      type="number"
                      value={assignment.default_service_commission_rate ?? ''}
                      onChange={(e) => handleAssignmentChange(index, 'default_service_commission_rate', e.target.value)}
                      placeholder="0.00"
                      className="text-right"
                  />
              </div>
          </div>

          {/* Fila para Agendable */}
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor={`schedulable-${index}`} className="font-medium">Agendable</Label>
            <div className="flex items-center space-x-2">
              <Switch id={`schedulable-${index}`} checked={!!assignment.is_schedulable} onCheckedChange={(checked) => handleAssignmentChange(index, 'is_schedulable', checked)} />
              <Label htmlFor={`schedulable-${index}`} className={assignment.is_schedulable ? 'text-blue-600' : 'text-gray-500'}>
                {assignment.is_schedulable ? 'Sí' : 'No'}
              </Label>
            </div>
          </div>

          {/* Fila para el Estado */}
          <div className="flex items-center justify-between pt-2">
            <Label>Estado de la Asignación</Label>
            <div className="flex items-center space-x-2">
              <Switch id={`status-${index}`} checked={assignment.status === 'active'} onCheckedChange={(checked) => handleAssignmentChange(index, 'status', checked)} />
              <Label htmlFor={`status-${index}`} className={assignment.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                {assignment.status === 'active' ? 'Activo' : 'Inactivo'}
              </Label>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {editableAssignments.map(renderAssignmentRow)}
        <Button variant="outline" onClick={handleAddAssignment} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Asignación
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Asignaciones de {userName}</DialogTitle>
          <DialogDescription>
            Añade, edita o elimina los roles y sucursales para este usuario. Los cambios se guardarán para todas las asignaciones.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-auto p-1 pr-4">
          {renderContent()}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSaveChanges}
            disabled={isLoading || isError || updateAssignmentsMutation.isPending}
          >
            {updateAssignmentsMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

