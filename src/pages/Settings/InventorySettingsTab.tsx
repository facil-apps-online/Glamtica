import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Save } from "lucide-react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface InventorySettingsForm {
  costing_method: string;
}

export function InventorySettingsTab() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSetting();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
    reset,
  } = useForm<InventorySettingsForm>({
    defaultValues: {
      costing_method: 'average',
    }
  });

  useEffect(() => {
    if (settings) {
      const costingMethod = settings.find(s => s.key === 'costing_method')?.value || 'average';
      reset({ costing_method: costingMethod });
    }
  }, [settings, reset]);

  const onSubmit = async (data: InventorySettingsForm) => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({ key: 'costing_method', value: data.costing_method });
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han guardado correctamente.",
      });
      reset(data);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectChange = (key: keyof InventorySettingsForm, value: string) => {
    setValue(key, value, { shouldDirty: true });
  };

  if (isLoading) {
    return <p className="mt-4">Cargando configuración de inventario...</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Package className="w-5 h-5" />
            Configuración de Inventario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="costing_method">Método de Costeo</Label>
            <Select 
              value={watch("costing_method") || "average"} 
              onValueChange={(value) => handleSelectChange("costing_method", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="average">Promedio</SelectItem>
                <SelectItem value="last_purchase">Última Compra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-slate-600">
            <p><strong>Promedio:</strong> Calcula el costo promediando el costo anterior con el nuevo costo de compra.</p>
            <p><strong>Última Compra:</strong> Usa el costo de la última compra realizada como costo del producto.</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!isDirty || isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
