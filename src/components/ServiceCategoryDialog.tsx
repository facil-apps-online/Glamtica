import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit } from "lucide-react";
import { useCreateServiceCategory, useUpdateServiceCategory, ServiceCategory } from "@/hooks/useServiceCategories";

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

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [category, open]); // Reset form when dialog opens for new category

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      return;
    }

    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, updates: { name, description: description || undefined } });
      } else {
        await createMutation.mutateAsync({ name, description: description || undefined });
      }
      setOpen(false);
    } catch (error) {
      console.error('Error saving service category:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="ml-2">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? "Editar Categoría de Servicio" : "Nueva Categoría de Servicio"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cortes de Pelo"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la categoría..."
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {category ? (updateMutation.isPending ? 'Actualizando...' : 'Actualizar Categoría') : (createMutation.isPending ? 'Creando...' : 'Crear Categoría')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};