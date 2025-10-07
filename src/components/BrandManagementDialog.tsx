import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand, useToggleBrandStatus, Brand } from "@/hooks/useBrands";
import { BrandDialog } from "./BrandDialog";

export function BrandManagementDialog({ trigger }: { trigger: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: brands, isLoading } = useBrands();
  const toggleStatusMutation = useToggleBrandStatus();
  const deleteBrandMutation = useDeleteBrand();

  const filteredBrands = brands?.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (brandId: string, currentStatus: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: brandId, is_active: !currentStatus });
    } catch (error) {
      console.error('Error toggling brand status:', error);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    try {
      await deleteBrandMutation.mutateAsync(brandId);
    } catch (error) {
      console.error('Error deleting brand:', error);
    }
  };

  if (isLoading) {
    return <p>Cargando marcas...</p>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Gestión de Marcas de Producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Buscar marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <BrandDialog />
          </div>

          <Card>
            <CardContent className="p-0">
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
                  {filteredBrands?.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>{brand.description || '-'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={brand.is_active || false}
                          onCheckedChange={() => handleToggleStatus(brand.id, brand.is_active || false)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <span className="ml-2 text-sm">
                          {brand.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Botón de edición (abre el mismo BrandDialog en modo edición) */}
                          <BrandDialog
                            brand={brand}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <ConfirmationDialog
                            onConfirm={() => handleDeleteBrand(brand.id)}
                            title="Confirmar Eliminación"
                            description="¿Estás seguro de que quieres eliminar esta marca? Esta acción no se puede deshacer."
                          >
                            <Button
                              variant="destructive" size="sm"
                              disabled={deleteBrandMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </ConfirmationDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredBrands?.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No se encontraron marcas.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
