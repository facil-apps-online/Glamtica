import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useScreenSize } from '@/hooks/useScreenSize';
import { AssignmentCard } from './AssignmentCard';

interface EquipmentAssignmentHistoryTabProps {
  equipmentId: string;
}

export const EquipmentAssignmentHistoryTab: React.FC<EquipmentAssignmentHistoryTabProps> = ({ equipmentId }) => {
  const { assignments, loading, returnEquipment, refreshAssignments } = useEquipmentAssignments(equipmentId);
  const screenSize = useScreenSize();
  const isSmallScreen = screenSize === 'sm';

  const renderContent = () => {
    if (loading) {
      return <p>Cargando historial...</p>;
    }

    if (assignments.length === 0) {
      return <p>No hay historial de asignaciones para este equipo.</p>;
    }

    if (isSmallScreen) {
      return (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} onReturn={returnEquipment} />
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Fecha de Asignación</TableHead>
            <TableHead>Fecha de Devolución</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>{assignment.user_name}</TableCell>
              <TableCell>{assignment.branch_name}</TableCell>
              <TableCell>{new Date(assignment.assignment_date).toLocaleDateString()}</TableCell>
              <TableCell>{assignment.return_date ? new Date(assignment.return_date).toLocaleDateString() : 'Asignado'}</TableCell>
              <TableCell className="text-right">
                {!assignment.return_date && (
                  <Button variant="outline" size="sm" onClick={() => returnEquipment(assignment.id)}>Devolver</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="py-4">
      <div className="h-64 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};
