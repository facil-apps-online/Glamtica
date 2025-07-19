
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit } from "lucide-react";
import { useCreateServiceCategory, useUpdateServiceCategory } from "@/hooks/useServiceCategories";
import type { ServiceCategory } from "@/hooks/useServiceCategories";

interface ServiceCategoryDialogProps {
  category?: ServiceCategory;
  trigger?: React.ReactNode;
}

export const ServiceCategoryDialog = ({ category, trigger }: ServiceCategoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");

  const createMutation = useCreateServiceCategory();
  const updateMutation = useUpdateServiceCategory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    const categoryData = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_active: true,
    };

    try {
      if (category) {
        await updateMutation.mutateAsync({
          id: category.id,
          updates: categoryData,
        });
      } else {
        await createMutation.mutateAsync(categoryData);
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service category:', error);
    }
  };

  const resetForm = () => {
    if (!category) {
      setName("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Categoría</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cortes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la categoría..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {category ? "Actualizar" : "Crear"} Categoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
