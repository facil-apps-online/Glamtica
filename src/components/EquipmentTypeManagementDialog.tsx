import React, { useState } from 'react';
import { useEquipmentTypes, EquipmentType } from '@/hooks/useEquipmentTypes';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, ListFilter, Plus } from 'lucide-react';
import { EquipmentTypeDialog } from '@/components/EquipmentTypeDialog';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

interface EquipmentTypeManagementDialogProps {
  trigger: React.ReactNode;
}

export const EquipmentTypeManagementDialog: React.FC<EquipmentTypeManagementDialogProps> = ({ trigger }) => {
  const { types, loading, deleteType, updateType } = useEquipmentTypes();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredTypes = types.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteType(id);
    } catch (error: any) {
      toast({ title: "Error", description: `Error al eliminar: ${error.message}`, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (type: EquipmentType) => {
    try {
      await updateType({ id: type.id, updates: { is_active: !type.is_active } });
      toast({ title: "Éxito", description: "Estado actualizado correctamente.", variant: "success" });
    } catch (error: any) {
      toast({ title: "Error", description: `Error al cambiar estado: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Gestión de Tipos de Equipo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <EquipmentTypeDialog onSuccess={() => {}} trigger={
              <Button variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            } />
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>{type.description || '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={type.is_active}
                            onCheckedChange={() => handleToggleStatus(type)}
                          />
                          <span className="ml-2 text-sm">
                            {type.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EquipmentTypeDialog
                              type={type}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              }
                              onSuccess={() => {}}
                            />
                            <ConfirmationDialog
                              onConfirm={() => handleDelete(type.id)}
                              title="Confirmar Eliminación"
                              description={`¿Estás seguro de que quieres eliminar el tipo "${type.name}"? Esta acción no se puede deshacer.`}
                            >
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </ConfirmationDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!loading && filteredTypes.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No se encontraron tipos de equipo.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
