import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaintenanceHistory, MaintenanceEvent } from '@/hooks/useMaintenanceHistory';
import { History, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { MaintenanceRecordFormDialog } from '@/components/MaintenanceRecordFormDialog'; // NEW IMPORT

interface MaintenanceHistoryDialogProps {
  equipmentId: string;
  trigger?: React.ReactNode;
}

export const MaintenanceHistoryDialog: React.FC<MaintenanceHistoryDialogProps> = ({ equipmentId, trigger }) => {
  const [open, setOpen] = useState(false);
  const { history, loading, deleteMaintenanceRecord, refreshHistory } = useMaintenanceHistory(equipmentId);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteMaintenanceRecord(id);
    } catch (error: any) {
      toast({ title: "Error", description: `Error al eliminar: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <History className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Mantenimiento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-end">
            {/* Button to open the form dialog for adding a new record */}
            <MaintenanceRecordFormDialog
              equipmentId={equipmentId}
              onSuccess={refreshHistory}
              trigger={
                <Button variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              }
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>
                ) : (
                  history.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(
                          parseInt(record.maintenance_date.substring(0, 4)), // Año
                          parseInt(record.maintenance_date.substring(5, 7)) - 1, // Mes (0-indexado)
                          parseInt(record.maintenance_date.substring(8, 10)) // Día
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.notes}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Button to open the form dialog for editing an existing record */}
                          <MaintenanceRecordFormDialog
                            equipmentId={equipmentId}
                            record={record}
                            onSuccess={refreshHistory}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <ConfirmationDialog
                            onConfirm={() => handleDelete(record.id)}
                            title="Confirmar Eliminación"
                            description="¿Estás seguro de que quieres eliminar este registro de mantenimiento? Esta acción no se puede deshacer."
                          >
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </ConfirmationDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && history.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center">No hay registros de mantenimiento.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};