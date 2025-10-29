import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Equipment, useEquipment } from '@/hooks/useEquipment';
import { useEquipmentBrands } from '@/hooks/useEquipmentBrands';
import { useScreenSize } from '@/hooks/useScreenSize';
import { EquipmentAssignmentHistoryTab } from './EquipmentAssignmentHistoryTab';
import { MaintenanceHistoryTab } from './MaintenanceHistoryTab';
import { ChatterBox } from './ChatterBox';

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type_id: z.string().min(1, "El tipo es requerido"),
  brand_id: z.string().uuid().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  last_maintenance_date: z.string().optional(),
  maintenance_frequency: z.coerce.number().optional(),
  maintenance_frequency_unit: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

interface EquipmentDialogProps {
  trigger?: React.ReactNode;
  equipment?: Equipment;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const EquipmentDialog: React.FC<EquipmentDialogProps> = ({ trigger, equipment, onSuccess, onOpenChange }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const screenSize = useScreenSize();
  const isSmallScreen = screenSize === 'sm';


  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  };
  const { types: equipmentTypes, loading: typesLoading } = useEquipmentTypes();
  const { brands: equipmentBrands, loading: brandsLoading } = useEquipmentBrands();
  const { toast } = useToast();
  const { session } = useAuth();

  const { createEquipment, updateEquipment, loading: equipmentMutating } = useEquipment();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      model: '',
      serial_number: '',
      notes: '',
      is_active: true,
      maintenance_frequency: undefined,
    }
  });

  useEffect(() => {
    if (equipment) {
      reset({
        name: equipment.name || '',
        type_id: equipment.type_id || '',
        brand_id: equipment.brand_id || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        purchase_date: equipment.purchase_date ? new Date(equipment.purchase_date).toISOString().split('T')[0] : '',
        last_maintenance_date: equipment.last_maintenance_date ? new Date(equipment.last_maintenance_date).toISOString().split('T')[0] : '',
        maintenance_frequency: equipment.maintenance_frequency || undefined,
        maintenance_frequency_unit: equipment.maintenance_frequency_unit || '',
        notes: equipment.notes || '',
        is_active: equipment.is_active ?? true,
      });
    } else {
      reset({
        name: '',
        model: '',
        serial_number: '',
        notes: '',
        is_active: true,
        maintenance_frequency: undefined,
      });
    }
  }, [equipment, reset]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      toast({
        title: 'Error',
        description: 'Tenant ID not found. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    const equipmentData = {
      ...data,
      tenant_id: session.user.app_metadata.assignments[0].tenant_id,
      purchase_date: data.purchase_date || null,
      last_maintenance_date: data.last_maintenance_date || null,
    };

    try {
      if (equipment) {
        await updateEquipment({ equipmentId: equipment.id, equipmentData: equipmentData });
      } else {
        await createEquipment(equipmentData);
      }
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving equipment:', error.message);
      toast({
        title: 'Error',
        description: `Error al guardar equipo: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Añadir Equipo
            </Button>
          )}
        </DialogTrigger>
        <DialogContent onInteractOutside={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenChange(false); }} className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{equipment ? 'Editar Equipo' : 'Añadir Equipo'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="block sm:hidden mb-4">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar pestaña..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="details">Detalles</SelectItem>
                  <SelectItem value="assignments" disabled={!equipment}>Asignaciones</SelectItem>
                  <SelectItem value="maintenance" disabled={!equipment}>Mantenimientos</SelectItem>
                  <SelectItem value="activity" disabled={!equipment}>Actividad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TabsList className="hidden sm:flex">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="assignments" disabled={!equipment}>Asignaciones</TabsTrigger>
              <TabsTrigger value="maintenance" disabled={!equipment}>Mantenimientos</TabsTrigger>
              <TabsTrigger value="activity" disabled={!equipment}>Actividad</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <div className="flex gap-2">
                      <Controller
                        name="type_id"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={typesLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                              {equipmentTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {errors.type_id && <p className="text-red-500 text-sm mt-1">{errors.type_id.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <div className="flex gap-2">
                      <Controller
                        name="brand_id"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={brandsLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar marca..." />
                            </SelectTrigger>
                            <SelectContent>
                              {equipmentBrands.map(brand => (
                                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input id="model" {...register('model')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Número de Serie</Label>
                    <Input id="serial_number" {...register('serial_number')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Fecha de Compra</Label>
                    <Input id="purchase_date" type="date" {...register('purchase_date')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_maintenance_date">Último Mantenimiento</Label>
                    <Input id="last_maintenance_date" type="date" {...register('last_maintenance_date')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_frequency">Frec. Mantenimiento</Label>
                      <Input id="maintenance_frequency" type="number" {...register('maintenance_frequency')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_frequency_unit">Unidad</Label>
                      <Controller
                        name="maintenance_frequency_unit"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days">Días</SelectItem>
                              <SelectItem value="weeks">Semanas</SelectItem>
                              <SelectItem value="months">Meses</SelectItem>
                              <SelectItem value="years">Años</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" {...register('notes')} />
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                      <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label htmlFor="is_active">Activo</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={equipmentMutating}>
                    Guardar
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="assignments">
              {equipment && <EquipmentAssignmentHistoryTab equipmentId={equipment.id} />}
            </TabsContent>
            <TabsContent value="maintenance">
              {equipment && <MaintenanceHistoryTab equipmentId={equipment.id} />}
            </TabsContent>
            <TabsContent value="activity">
              {equipment && session?.user?.app_metadata?.assignments?.[0]?.tenant_id && (
                <ChatterBox
                  resourceType="equipment"
                  resourceId={equipment.id}
                  tenantId={session.user.app_metadata.assignments[0].tenant_id}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      </>
  );
};