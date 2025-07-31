import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Tipos para la estructura del config_schema que genera tu panel
interface FormField {
  id: string;
  name: string;
  type: 'text' | 'password' | 'email'; // Se pueden añadir más tipos si es necesario
  label: string;
  helpText?: string;
  required?: boolean;
}

interface DynamicFormProps {
  configSchema: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  isSaving: boolean;
  initialData?: Record<string, any> | null;
}

const DynamicIntegrationForm: React.FC<DynamicFormProps> = ({ configSchema, onSubmit, isSaving, initialData }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {configSchema.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            type={field.type}
            {...register(field.name, { required: field.required })}
            placeholder={field.helpText}
          />
          {errors[field.name] && <p className="text-sm text-red-500">{field.label} es requerido.</p>}
        </div>
      ))}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Credenciales'}
        </Button>
      </div>
    </form>
  );
};

export default DynamicIntegrationForm;
