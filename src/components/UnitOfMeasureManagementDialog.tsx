import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, SlidersHorizontal } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useUnitsOfMeasure } from "@/hooks/useUnitsOfMeasure";
import { UnitOfMeasureDialog } from "./UnitOfMeasureDialog";

interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  is_global?: boolean;
}

interface UnitOfMeasureManagementDialogProps {
  trigger: React.ReactNode;
}

export const UnitOfMeasureManagementDialog: React.FC<UnitOfMeasureManagementDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { units, isLoading, deleteUnit } = useUnitsOfMeasure();

  const filteredUnits = units?.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (unitId: string) => {
    try {
      await deleteUnit(unitId);
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Gestión de Unidades de Medida</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Buscar por nombre o abreviatura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <UnitOfMeasureDialog />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Abreviatura</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                    </TableRow>
                  ) : (
                    filteredUnits?.map((unit: UnitOfMeasure) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.abbreviation}</TableCell>
                        <TableCell className="text-right">
                          {unit.is_global ? (
                            <span className="text-xs text-gray-500">No editable</span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <UnitOfMeasureDialog
                                unit={unit}
                                trigger={
                                  <Button variant="outline" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                }
                              />
                              <ConfirmationDialog
                                onConfirm={() => handleDelete(unit.id)}
                                title="Confirmar Eliminación"
                                description={`¿Estás seguro de que quieres eliminar la unidad "${unit.name}"? Esta acción no se puede deshacer.`}
                              >
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </ConfirmationDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {!isLoading && filteredUnits?.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No se encontraron unidades de medida.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};