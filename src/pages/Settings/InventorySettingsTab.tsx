import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Save } from "lucide-react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface InventorySettingsForm {
  costing_method: string;
  purchase_independence_method: string;
}

export function InventorySettingsTab() {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const { data: settings, isLoading } = useSettings({ enabled: !!tenantId });
  const updateMutation = useUpdateSetting();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [defaultFormValues, setDefaultFormValues] = useState<InventorySettingsForm>({
    costing_method: 'average',
    purchase_independence_method: 'centralized',
  });

  useEffect(() => {
    if (settings) {
      setDefaultFormValues({
        costing_method: settings.costing_method || 'average',
        purchase_independence_method: settings.purchase_independence_method || 'centralized',
      });
    }
  }, [settings]);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
    reset,
  } = useForm<InventorySettingsForm>({
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    reset(defaultFormValues);
  }, [defaultFormValues, reset]);

  const onSubmit = async (data: InventorySettingsForm) => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(data);
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

  if (isLoading || !tenantId) {
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
        <CardContent className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Método de Costeo</CardTitle>
              <CardDescription>Define cómo se calcula el costo de tus productos.</CardDescription>
            </CardHeader>
            <CardContent>
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
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p><strong>Promedio:</strong> Calcula el costo promediando el costo anterior con el nuevo costo de compra.</p>
                <p><strong>Última Compra:</strong> Usa el costo de la última compra realizada como costo del producto.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Independencia de Compras</CardTitle>
              <CardDescription>Define si las compras se gestionan de forma central o por sucursal.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={watch("purchase_independence_method") || "centralized"} 
                onValueChange={(value) => handleSelectChange("purchase_independence_method", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centralized">Centralizada</SelectItem>
                  <SelectItem value="independent">Independiente</SelectItem>
                  <SelectItem value="mixed">Mixta</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p><strong>Centralizada:</strong> Todas las compras se gestionan desde una única ubicación central.</p>
                <p><strong>Independiente:</strong> Cada sucursal gestiona sus propias compras de forma autónoma.</p>
                <p><strong>Mixta:</strong> Algunas compras son centralizadas y otras son gestionadas por cada sucursal.</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!isDirty || isSaving || !tenantId}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
