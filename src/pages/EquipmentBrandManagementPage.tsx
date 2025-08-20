import React, { useState } from 'react';
import { useEquipmentBrands, EquipmentBrand } from '@/hooks/useEquipmentBrands';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { EquipmentBrandDialog } from '@/components/EquipmentBrandDialog';

const EquipmentBrandManagementPage: React.FC = () => {
  const { brands, loading, deleteBrand } = useEquipmentBrands();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<EquipmentBrand | null>(null);

  const handleAdd = () => {
    setSelectedBrand(null);
    setDialogOpen(true);
  };

  const handleEdit = (brand: EquipmentBrand) => {
    setSelectedBrand(brand);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteBrand(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Marcas de Equipos</h1>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Marca
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marcas Existentes</CardTitle>
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
                brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>{brand.name}</TableCell>
                    <TableCell>{brand.description}</TableCell>
                    <TableCell>{brand.is_active ? 'Activo' : 'Inactivo'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(brand)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(brand.id)}>
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

      <EquipmentBrandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brand={selectedBrand}
      />
    </div>
  );
};

export default EquipmentBrandManagementPage;