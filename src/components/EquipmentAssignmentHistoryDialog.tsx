
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEquipmentAssignments, EquipmentAssignment } from '@/hooks/useEquipmentAssignments';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EquipmentAssignmentHistoryDialogProps {
  equipmentId: string;
  trigger?: React.ReactNode;
}

export const EquipmentAssignmentHistoryDialog: React.FC<EquipmentAssignmentHistoryDialogProps> = ({
  equipmentId,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const { assignments, fetchEquipmentAssignments, loading } = useEquipmentAssignments();

  useEffect(() => {
    if (open) {
      fetchEquipmentAssignments(equipmentId);
    }
  }, [open, equipmentId, fetchEquipmentAssignments]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Ver Historial</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Historial de Asignaciones</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <p>Cargando historial...</p>
          ) : assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Fecha de Asignación</TableHead>
                  <TableHead>Fecha de Devolución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.user_name}</TableCell>
                    <TableCell>{assignment.branch_name}</TableCell>
                    <TableCell>{assignment.assignment_date}</TableCell>
                    <TableCell>{assignment.return_date || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No hay historial de asignaciones para este equipo.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
