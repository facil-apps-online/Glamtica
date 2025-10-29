import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaintenanceHistory } from '@/hooks/useMaintenanceHistory';
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { MaintenanceRecordFormDialog } from '@/components/MaintenanceRecordFormDialog';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MaintenanceCard } from './MaintenanceCard';

interface MaintenanceHistoryTabProps {
  equipmentId: string;
}

export const MaintenanceHistoryTab: React.FC<MaintenanceHistoryTabProps> = ({ equipmentId }) => {
  const { history, loading, deleteMaintenanceRecord, refreshHistory } = useMaintenanceHistory(equipmentId);
  const { toast } = useToast();
  const screenSize = useScreenSize();
  const isSmallScreen = screenSize === 'sm';

  const handleDelete = async (id: string) => {
    try {
      await deleteMaintenanceRecord(id);
    } catch (error: any) {
      toast({ title: "Error", description: `Error al eliminar: ${error.message}`, variant: "destructive" });
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p>Cargando historial...</p>;
    }

    if (history.length === 0) {
      return <p>No hay registros de mantenimiento.</p>;
    }

    if (isSmallScreen) {
      return (
        <div className="space-y-2">
          {history.map((record) => (
            <MaintenanceCard
              key={record.id}
              equipmentId={equipmentId}
              record={record}
              onSuccess={refreshHistory}
              onDelete={handleDelete}
            />
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map(record => (
            <TableRow key={record.id}>
              <TableCell>
                {new Date(record.maintenance_date).toLocaleDateString()}
              </TableCell>
              <TableCell>{record.notes}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <MaintenanceRecordFormDialog
                    equipmentId={equipmentId}
                    record={record}
                    onSuccess={refreshHistory}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    }
                  />
                  <ConfirmationDialog
                    onConfirm={() => handleDelete(record.id)}
                    title="Confirmar Eliminación"
                    description="¿Estás seguro de que quieres eliminar este registro de mantenimiento?"
                  >
                    <Button variant="ghost" size="icon" >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </ConfirmationDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end">
        <MaintenanceRecordFormDialog
          equipmentId={equipmentId}
          onSuccess={refreshHistory}
          trigger={
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Registro
            </Button>
          }
        />
      </div>
      <div className="h-64 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};
