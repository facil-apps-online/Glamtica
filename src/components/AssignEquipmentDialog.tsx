import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserSelector } from './UserSelector';
import { BranchSelector } from './BranchSelector';
import { EquipmentSelector } from './EquipmentSelector';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import { useUserAssignedEquipment } from '@/hooks/useUserAssignedEquipment';
import { Plus, Briefcase, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSchedulableUsers } from '@/hooks/useSchedulableUsers';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface AssignEquipmentDialogProps {
  equipmentId?: string;
  userId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const AssignEquipmentDialog: React.FC<AssignEquipmentDialogProps> = ({
  equipmentId,
  userId,
  trigger,
  onSuccess,
  onOpenChange,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
  };

  const [selectedUserId, setSelectedUserId] = useState<string | null>(userId || null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(equipmentId || null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const { assignEquipment, returnEquipment, loading: isAssigning } = useEquipmentAssignments();
  const { data: assignedEquipment, isLoading: isLoadingAssigned } = useUserAssignedEquipment(userId || null);
  const { toast } = useToast();
  const { data: users, isLoading: usersLoading } = useSchedulableUsers();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setSelectedUserId(userId || null);
      setSelectedEquipmentId(equipmentId || null); // Keep equipment selection from props
      setSelectedBranchId(null);
    }
  }, [open, userId, equipmentId]);

  const handleReturn = async (assignmentId: string) => {
    const success = await returnEquipment(assignmentId);
    if (success) {
      onSuccess?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId || !selectedUserId || !selectedBranchId) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos.",
        variant: "destructive",
      });
      return;
    }

    const success = await assignEquipment(selectedEquipmentId, selectedUserId, selectedBranchId);
    if (success) {
      onSuccess?.();
      setSelectedEquipmentId(null);
      setSelectedBranchId(null);
      queryClient.invalidateQueries({ queryKey: ['userAssignedEquipment', selectedUserId] });
    }
  };

  const isFormValid = selectedEquipmentId && selectedUserId && selectedBranchId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Asignar Equipo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestionar Equipo de Usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Assigned Equipment List */}
          <div className="space-y-2">
            <h4 className="font-medium">Equipo Asignado</h4>
            {isLoadingAssigned ? (
              <p>Cargando...</p>
            ) : assignedEquipment && assignedEquipment.length > 0 ? (
              <ul className="space-y-2">
                {assignedEquipment.map((item) => (
                  <li key={item.assignment_id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{item.equipment_name}</span>
                    <Button variant="destructive" size="sm" onClick={() => handleReturn(item.assignment_id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Devolver
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Este usuario no tiene equipo asignado.</p>
            )}
          </div>

          {/* Assign New Equipment Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t">
            <h4 className="font-medium">Asignar Nuevo Equipo</h4>
            {!userId && (
              <div className="space-y-2">
                
                <UserSelector
                  users={users}
                  selectedUserId={selectedUserId}
                  onUserChange={setSelectedUserId}
                />
              </div>
            )}
            {!equipmentId && (
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipo</Label>
                <EquipmentSelector 
                  selectedEquipmentId={selectedEquipmentId}
                  onSelectEquipment={setSelectedEquipmentId} 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="branch">Sucursal de Asignación</Label>
              <BranchSelector
                selectedValue={selectedBranchId}
                onSelectBranch={setSelectedBranchId}
                showInactive={true}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isFormValid || isAssigning}>
                {isAssigning ? 'Asignando...' : 'Asignar'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};