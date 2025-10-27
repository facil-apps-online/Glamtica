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
import { Plus, Edit, Trash2, ListFilter } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useProductCategories, useCreateProductCategory, useUpdateProductCategory, useDeleteProductCategory, useToggleProductCategoryStatus, ProductCategory } from "@/hooks/useProductCategories";
import { ProductCategoryDialog } from "./ProductCategoryDialog";

export function ProductCategoryManagementDialog({ trigger }: { trigger: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: categories, isLoading } = useProductCategories();
  const toggleStatusMutation = useToggleProductCategoryStatus();
  const deleteCategoryMutation = useDeleteProductCategory();

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: categoryId, is_active: !currentStatus });
    } catch (error) {
      console.error('Error toggling category status:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  if (isLoading) {
    return <p>Cargando categorías...</p>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Gestión de Categorías de Producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <ProductCategoryDialog
              trigger={              
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Categoría
                </Button>
              }
            />
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
                  {filteredCategories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={category.is_active || false}
                          onCheckedChange={() => handleToggleStatus(category.id, category.is_active || false)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <span className="ml-2 text-sm">
                          {category.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Botón de edición (abre el mismo ProductCategoryDialog en modo edición) */}
                          <ProductCategoryDialog
                            category={category}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <ConfirmationDialog
                            onConfirm={() => handleDeleteCategory(category.id)}
                            title="Confirmar Eliminación"
                            description="¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer."
                          >
                            <Button
                              variant="destructive" size="sm"
                              disabled={deleteCategoryMutation.isPending}
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
              {filteredCategories?.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No se encontraron categorías.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
