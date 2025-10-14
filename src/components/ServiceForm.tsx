
import React from 'react';
import { useForm, Controller, UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { MasterService } from "@/types/services";
import { useTaxTypes } from "@/hooks/useTaxTypes";
import { ServiceCategory } from "@/hooks/useServiceCategories";

interface ServiceFormProps {
  form: UseFormReturn<Partial<MasterService & { tax_type_ids: string[] }>>;
  onSubmit: (data: Partial<MasterService & { tax_type_ids: string[] }>) => void;
  isEdit: boolean;
  isLoading: boolean;
  onCancel?: () => void;
  serviceCategories: ServiceCategory[] | undefined;
  isLoadingCategories: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ form, onSubmit, isEdit, isLoading, onCancel, serviceCategories, isLoadingCategories }) => {
  const { register, handleSubmit, control, formState: { errors, isDirty } } = form;
  const { data: taxTypes, isLoading: isLoadingTaxTypes } = useTaxTypes();

  const taxTypeOptions = React.useMemo(() => {
    return taxTypes?.map(tt => ({ value: tt.id, label: tt.name })) || [];
  }, [taxTypes]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Servicio</Label>
        <Input id="name" {...register("name", { required: "El nombre es obligatorio" })} placeholder="Ej: Corte de Cabello" />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" {...register("description")} placeholder="Descripción detallada del servicio" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category_id">Categoría</Label>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>Cargando...</SelectItem>
                  ) : (
                    serviceCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duración (minutos)</Label>
          <Input id="duration_minutes" type="number" {...register("duration_minutes", { valueAsNumber: true, min: { value: 0, message: "La duración no puede ser negativa" } })} placeholder="Ej: 30" />
          {errors.duration_minutes && <p className="text-sm text-red-600">{errors.duration_minutes.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tax_type_ids">Tipos de Impuesto</Label>
        <Controller
            name="tax_type_ids"
            control={control}
            render={({ field }) => (
                 <MultiSelect
                    options={taxTypeOptions}
                    selected={field.value || []}
                    onSelectedChange={field.onChange}
                    placeholder="Seleccionar tipos de impuesto"
                    disabled={isLoadingTaxTypes}
                />
            )}
        />
      </div>
      <div className="flex justify-end space-x-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" disabled={isLoading || (isEdit && !isDirty)}>
          {isEdit ? "Guardar Cambios" : "Crear Servicio"}
        </Button>
      </div>
    </form>
  );
};
