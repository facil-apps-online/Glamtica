
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit } from "lucide-react";
import { useCreateBrand, useUpdateBrand, Brand } from "@/hooks/useBrands";

interface BrandDialogProps {
  brand?: Brand;
  trigger?: React.ReactNode;
}

export const BrandDialog = ({ brand, trigger }: BrandDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(brand?.name || "");
  const [description, setDescription] = useState(brand?.description || "");

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    const brandData = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    try {
      if (brand) {
        await updateMutation.mutateAsync({
          id: brand.id,
          updates: brandData,
        });
      } else {
        await createMutation.mutateAsync(brandData);
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving brand:', error);
    }
  };

  const resetForm = () => {
    if (!brand) {
      setName("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {brand ? "Editar Marca" : "Nueva Marca"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Marca</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: L'Oréal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la marca..."
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
              {brand ? "Actualizar" : "Crear"} Marca
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
