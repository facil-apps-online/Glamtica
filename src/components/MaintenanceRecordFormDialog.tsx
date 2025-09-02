import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMaintenanceHistory, MaintenanceEvent } from '@/hooks/useMaintenanceHistory';
import { Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  maintenance_date: z.string().min(1, "La fecha es requerida"),
  notes: z.string().min(1, "Las notas son requeridas"),
});

interface MaintenanceRecordFormDialogProps {
  trigger?: React.ReactNode;
  record?: MaintenanceEvent; // Optional, for editing
  equipmentId: string; // Required to pass to the hook
  onSuccess?: () => void;
}

export const MaintenanceRecordFormDialog: React.FC<MaintenanceRecordFormDialogProps> = ({ trigger, record, equipmentId, onSuccess }) => {
  const [open, setOpen] = useState(false); // Added open state
  const { addMaintenanceRecord, updateMaintenanceRecord } = useMaintenanceHistory(equipmentId);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (record) {
      reset({
        maintenance_date: record.maintenance_date,
        notes: record.notes,
      });
    } else {
      reset({
        maintenance_date: '',
        notes: '',
      });
    }
  }, [record, reset]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (record) {
        await updateMaintenanceRecord(record.id, data);
      } else {
        await addMaintenanceRecord(data); 
      }
      onSuccess?.(); // Call onSuccess to refresh parent list
      setOpen(false); // Close the dialog after successful submission
    } catch (error: any) {
      console.error('Error saving maintenance record:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al guardar el registro: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}> {/* Added open and onOpenChange props */}
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Registro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{record ? 'Editar Registro de Mantenimiento' : 'Nuevo Registro de Mantenimiento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="maintenance_date">Fecha de Mantenimiento</Label>
            <Input id="maintenance_date" type="date" {...register('maintenance_date')} />
            {errors.maintenance_date && <p className="text-red-500 text-sm mt-1">{errors.maintenance_date.message}</p>}
          </div>
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register('notes')} />
            {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit">
              {record ? 'Guardar Cambios' : 'Crear Registro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};