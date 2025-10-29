import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EquipmentAssignment } from '@/hooks/useEquipmentAssignments';

interface AssignmentCardProps {
  assignment: EquipmentAssignment;
  onReturn: (assignmentId: string) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onReturn }) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between">
          <span className="font-semibold">Usuario:</span>
          <span>{assignment.user_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Sucursal:</span>
          <span>{assignment.branch_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Fecha de Asignación:</span>
          <span>{new Date(assignment.assignment_date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Fecha de Devolución:</span>
          <span>{assignment.return_date ? new Date(assignment.return_date).toLocaleDateString() : 'Asignado'}</span>
        </div>
      </CardContent>
      {!assignment.return_date && (
        <CardFooter className="flex justify-end p-2">
          <Button variant="outline" size="sm" onClick={() => onReturn(assignment.id)}>Devolver</Button>
        </CardFooter>
      )}
    </Card>
  );
};
