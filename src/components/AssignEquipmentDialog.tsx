import React, { useState, useEffect } from 'react';
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
import { Plus, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssignEquipmentDialogProps {
  equipmentId?: string;
  userId?: string;
  trigger?: React.ReactNode;
  onAssignmentSuccess?: () => void;
}

export const AssignEquipmentDialog: React.FC<AssignEquipmentDialogProps> = ({
  equipmentId,
  userId,
  trigger,
  onAssignmentSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userId || null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(equipmentId || null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const { assignEquipment, loading } = useEquipmentAssignments();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setSelectedUserId(userId || null);
      setSelectedEquipmentId(equipmentId || null);
      setSelectedBranchId(null);
    }
  }, [open, userId, equipmentId]);

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
      onAssignmentSuccess?.();
      setOpen(false);
    } 
    // The hook now handles success/error toasts
  };

  const isFormValid = selectedEquipmentId && selectedUserId && selectedBranchId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogTitle>Asignar Equipo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!userId && (
            <div className="space-y-2">
              <Label htmlFor="user">Usuario</Label>
              <UserSelector onSelectUser={setSelectedUserId} />
            </div>
          )}
          {!equipmentId && (
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipo</Label>
              <EquipmentSelector onSelectEquipment={setSelectedEquipmentId} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="branch">Sucursal de Asignación</Label>
            <BranchSelector onSelectBranch={setSelectedBranchId} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid || loading}>
              {loading ? 'Asignando...' : 'Asignar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};