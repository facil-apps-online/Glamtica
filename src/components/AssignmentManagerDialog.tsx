import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserAssignments, useUpdateUserAssignments, AssignmentFormValue } from '@/hooks/useUserAssignments';
import { useRoles } from '@/hooks/useRoles';
import { useBranches } from '@/hooks/useBranches';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScreenSize } from '@/hooks/useScreenSize'; // <-- IMPORTADO

interface AssignmentManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  tenantId: string;
  userName: string;
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
}) => {
  const { data: initialAssignments, isLoading: isLoadingAssignments, isError: isAssignmentsError } = useUserAssignments(userId, tenantId);
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const { data: branches, isLoading: isLoadingBranches } = useBranches(tenantId);
  const updateAssignmentsMutation = useUpdateUserAssignments();
  const { toast } = useToast();
  const screenSize = useScreenSize(); // <-- HOOK EN USO

  const [editableAssignments, setEditableAssignments] = useState<AssignmentFormValue[]>([]);

  useEffect(() => {
    if (initialAssignments) {
      const formattedAssignments = initialAssignments.map(a => ({
        branch_id: a.branch_id,
        role_id: a.role_id,
        status: a.status === 'pending_configuration' ? 'inactive' : a.status,
      }));
      setEditableAssignments(formattedAssignments);
    }
  }, [initialAssignments]);

  const handleAssignmentChange = (index: number, field: 'role_id' | 'branch_id' | 'status', value: string | boolean) => {
    const newAssignments = [...editableAssignments];
    const statusValue = typeof value === 'boolean' ? (value ? 'active' : 'inactive') : value;
    
    if (field === 'status') {
      newAssignments[index] = { ...newAssignments[index], status: statusValue as 'active' | 'inactive' };
    } else {
      newAssignments[index] = { ...newAssignments[index], [field]: value };
    }
    setEditableAssignments(newAssignments);
  };

  const handleAddAssignment = () => {
    setEditableAssignments([...editableAssignments, { role_id: null, branch_id: null, status: 'active' }]);
  };

  const handleRemoveAssignment = (index: number) => {
    const newAssignments = editableAssignments.filter((_, i) => i !== index);
    setEditableAssignments(newAssignments);
  };

  const handleSaveChanges = () => {
    const assignmentsToSave = editableAssignments.filter(a => a.role_id && a.branch_id);
    
    updateAssignmentsMutation.mutate(
      { userId, tenantId, assignments: assignmentsToSave },
      {
        onSuccess: (data) => {
          toast({ title: 'Éxito', description: data.message });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  const isLoading = isLoadingAssignments || isLoadingRoles || isLoadingBranches;
  const isError = isAssignmentsError;

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton />;
    if (isError) return <p className="text-red-500 text-center py-8">Error al cargar los datos necesarios.</p>;

    // --- VISTA MÓVIL ---
    if (screenSize === 'mobile') {
      return (
        <div className="space-y-4">
          {editableAssignments.map((assignment, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-3 relative">
              <Button variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => handleRemoveAssignment(index)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              
              <div className="space-y-1">
                <Label>Rol</Label>
                <Select value={assignment.role_id || ''} onValueChange={(value) => handleAssignmentChange(index, 'role_id', value)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar Rol" /></SelectTrigger>
                  <SelectContent>{roles?.map(role => <SelectItem key={role.id} value={role.id}>{role.display_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Sucursal</Label>
                <Select value={assignment.branch_id || ''} onValueChange={(value) => handleAssignmentChange(index, 'branch_id', value)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar Sucursal" /></SelectTrigger>
                  <SelectContent>{branches?.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label>Estado</Label>
                <div className="flex items-center space-x-2">
                  <Switch id={`status-mobile-${index}`} checked={assignment.status === 'active'} onCheckedChange={(checked) => handleAssignmentChange(index, 'status', checked)} />
                  <Label htmlFor={`status-mobile-${index}`} className={assignment.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                    {assignment.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Label>
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddAssignment} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Asignación
          </Button>
        </div>
      );
    }

    // --- VISTA ESCRITORIO ---
    return (
      <div className="space-y-4">
        {editableAssignments.map((assignment, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2 p-2 rounded-lg border">
            <Select value={assignment.role_id || ''} onValueChange={(value) => handleAssignmentChange(index, 'role_id', value)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar Rol" /></SelectTrigger>
              <SelectContent>{roles?.map(role => <SelectItem key={role.id} value={role.id}>{role.display_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={assignment.branch_id || ''} onValueChange={(value) => handleAssignmentChange(index, 'branch_id', value)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar Sucursal" /></SelectTrigger>
              <SelectContent>{branches?.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center space-x-2 justify-self-center px-4">
              <Switch id={`status-desktop-${index}`} checked={assignment.status === 'active'} onCheckedChange={(checked) => handleAssignmentChange(index, 'status', checked)} />
              <Label htmlFor={`status-desktop-${index}`} className={assignment.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                {assignment.status === 'active' ? 'Activo' : 'Inactivo'}
              </Label>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleRemoveAssignment(index)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={handleAddAssignment}>
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
