import React, { useState } from 'react';
import { useEquipmentTypes, EquipmentType } from '@/hooks/useEquipmentTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { EquipmentTypeManagementDialog } from '@/components/EquipmentTypeManagementDialog';

const EquipmentTypeManagementPage: React.FC = () => {
  const { types, loading, deleteType } = useEquipmentTypes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EquipmentType | null>(null);

  const handleAdd = () => {
    setSelectedType(null);
    setDialogOpen(true);
  };

  const handleEdit = (type: EquipmentType) => {
    setSelectedType(type);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteType(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Tipos de Equipos</h1>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : (
                types.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell>{type.is_active ? 'Activo' : 'Inactivo'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(type)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(type.id)}>
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EquipmentTypeManagementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={selectedType}
        isQuickAddMode={false}
      />
    </div>
  );
};

export default EquipmentTypeManagementPage;