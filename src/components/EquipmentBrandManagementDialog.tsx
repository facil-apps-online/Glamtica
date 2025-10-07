import React, { useState } from 'react';
import { useEquipmentBrands, EquipmentBrand } from '@/hooks/useEquipmentBrands';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Tag, Plus } from 'lucide-react';
import { EquipmentBrandDialog } from '@/components/EquipmentBrandDialog';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

interface EquipmentBrandManagementDialogProps {
  trigger: React.ReactNode;
}

export const EquipmentBrandManagementDialog: React.FC<EquipmentBrandManagementDialogProps> = ({ trigger }) => {
  const { brands, loading, deleteBrand, updateBrand } = useEquipmentBrands();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteBrand(id);
    } catch (error: any) {
      toast({ title: "Error", description: `Error al eliminar: ${error.message}`, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (brand: EquipmentBrand) => {
    try {
      await updateBrand({ id: brand.id, updates: { is_active: !brand.is_active } });
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
          <DialogTitle className="text-primary">Gestión de Marcas de Equipo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <EquipmentBrandDialog onSuccess={() => {}} trigger={
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
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell>{brand.description || '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={brand.is_active}
                            onCheckedChange={() => handleToggleStatus(brand)}
                          />
                          <span className="ml-2 text-sm">
                            {brand.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EquipmentBrandDialog
                              brand={brand}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              }
                              onSuccess={() => {}}
                            />
                            <ConfirmationDialog
                              onConfirm={() => handleDelete(brand.id)}
                              title="Confirmar Eliminación"
                              description={`¿Estás seguro de que quieres eliminar la marca "${brand.name}"? Esta acción no se puede deshacer.`}
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
              {!loading && filteredBrands.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No se encontraron marcas de equipo.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
