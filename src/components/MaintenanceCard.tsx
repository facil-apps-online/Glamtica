import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from 'lucide-react';
import { MaintenanceEvent } from '@/hooks/useMaintenanceHistory';

import { MaintenanceRecordFormDialog } from '@/components/MaintenanceRecordFormDialog';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface MaintenanceCardProps {
  equipmentId: string;
  record: MaintenanceEvent;
  onSuccess: () => void;
  onDelete: (id: string) => void;
}

export const MaintenanceCard: React.FC<MaintenanceCardProps> = ({ equipmentId, record, onSuccess, onDelete }) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between">
          <span className="font-semibold">Fecha:</span>
          <span>{new Date(record.maintenance_date).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="font-semibold">Notas:</span>
          <p className="text-sm text-muted-foreground">{record.notes}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 p-2">
        <MaintenanceRecordFormDialog
          equipmentId={equipmentId}
          record={record}
          onSuccess={onSuccess}
          trigger={
            <Button variant="ghost" size="icon">
              <Edit className="w-4 h-4" />
            </Button>
          }
        />
        <ConfirmationDialog
          onConfirm={() => onDelete(record.id)}
          title="Confirmar Eliminación"
          description="¿Estás seguro de que quieres eliminar este registro de mantenimiento?"
        >
          <Button variant="ghost" size="icon" >
            <Trash2 className="w-4 h-4" />
          </Button>
        </ConfirmationDialog>
      </CardFooter>
    </Card>
  );
};
