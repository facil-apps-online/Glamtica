import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit } from "lucide-react";
import { useCreateServiceCategory, useUpdateServiceCategory, ServiceCategory } from "@/hooks/useServiceCategories";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatterBox } from "@/components/ChatterBox";
import { useScreenSize, type ScreenSize } from "@/hooks/useScreenSize";
import { useToast } from "@/hooks/use-toast";

interface ServiceCategoryDialogProps {
  category?: ServiceCategory;
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const ServiceCategoryDialog = ({ category, trigger, onOpenChange }: ServiceCategoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [activeTab, setActiveTab] = useState("general");

  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const createMutation = useCreateServiceCategory();
  const updateMutation = useUpdateServiceCategory();
  const { toast } = useToast();

  const screenSize: ScreenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  useEffect(() => {
    if (open) {
        if (category) {
            setName(category.name || "");
            setDescription(category.description || "");
        } else {
            setName("");
            setDescription("");
        }
        setActiveTab("general");
    } else {
        onOpenChange?.(false);
    }
  }, [category, open]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        onOpenChange?.(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const action = category ? updateMutation.mutateAsync : createMutation.mutateAsync;
    const data = category
      ? { id: category.id, updates: { name, description: description || undefined } }
      : { name, description: description || undefined };

    try {
      await action(data as any);
      toast({ title: "Éxito", description: `Categoría ${category ? 'actualizada' : 'creada'} correctamente.` });
      setOpen(false);
    } catch (error) {
      toast({ title: "Error", description: `No se pudo ${category ? 'actualizar' : 'crear'} la categoría.`, variant: "destructive" });
    }
  };

  const tabs = [
    { value: "general", label: "General", disabled: false },
    { value: "activity", label: "Actividad", disabled: !category },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="ml-2">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {category ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {category ? "Editar Categoría de Servicio" : "Nueva Categoría de Servicio"}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isMobile ? (
            <div className="px-1 mb-4">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una sección" />
                </SelectTrigger>
                <SelectContent>
                  {tabs.map(tab => (
                    <SelectItem key={tab.value} value={tab.value} disabled={tab.disabled}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <TabsList className="grid w-full grid-cols-2">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          <TabsContent value="general">
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cortes de Pelo" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción de la categoría..." />
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="activity">
            {category && tenantId && (
              <ChatterBox
                resourceType="service_categories"
                resourceId={category.id}
                tenantId={tenantId}
                containerClassName="h-[50vh] mt-4"
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};