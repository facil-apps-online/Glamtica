import React from 'react';
import { useForm, Controller, UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "@/hooks/useClients";
import { useGetDocumentTypes } from '@/hooks/useDocumentTypes';
import { PhoneInput } from '@/components/PhoneInput';
import { useCountries } from '@/hooks/useCountries';

interface ClientFormProps {
  form: UseFormReturn<Client>;
  onSubmit: (data: Client) => void;
  isEdit: boolean;
  isLoading: boolean;
  countryId?: string | null;
}

export const ClientForm: React.FC<ClientFormProps> = ({ form, onSubmit, isEdit, isLoading, countryId }) => {
  const { register, handleSubmit, control, formState: { errors, isDirty } } = form;
  const { data: documentTypes, isLoading: isLoadingDocumentTypes } = useGetDocumentTypes('client');
  const { data: countries } = useCountries();

  const countryIsoCode = countries?.find(c => c.id === countryId)?.iso_code;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" {...register("name", { required: "El nombre es obligatorio" })} placeholder="Nombre completo del cliente" />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                {...field}
                defaultCountryIsoCode={countryIsoCode}
              />
            )}
          />
          {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="document_type_id">Tipo de Documento</Label>
          <Controller
            name="document_type_id"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDocumentTypes ? (
                    <SelectItem value="loading" disabled>Cargando...</SelectItem>
                  ) : (
                    documentTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document_number">Número de Documento</Label>
          <Input id="document_number" {...register("document_number")} placeholder="123456789" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="email@ejemplo.com" />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading || (isEdit && !isDirty)}>
          {isEdit ? "Guardar Cambios" : "Guardar"}
        </Button>
      </div>
    </form>
  );
};