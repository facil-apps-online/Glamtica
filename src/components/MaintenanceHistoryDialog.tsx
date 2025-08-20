import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaintenanceHistory } from '@/hooks/useMaintenanceHistory';
import { History, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  maintenance_date: z.string().min(1, "La fecha es requerida"),
  notes: z.string().min(1, "Las notas son requeridas"),
});

interface MaintenanceHistoryDialogProps {
  equipmentId: string;
  trigger?: React.ReactNode;
}

export const MaintenanceHistoryDialog: React.FC<MaintenanceHistoryDialogProps> = ({ equipmentId, trigger }) => {
  const [open, setOpen] = useState(false);
  const { history, loading, addMaintenanceRecord, refreshHistory } = useMaintenanceHistory(equipmentId);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await addMaintenanceRecord({ ...data, equipment_id: equipmentId }); // equipment_id is not in the form, but needed for the hook
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <History className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Historial de Mantenimiento</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 max-h-[80vh] overflow-y-auto p-1">
          <div>
            <h3 className="font-semibold mb-4">Añadir Registro</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex justify-end">
                <Button type="submit"><Plus className="w-4 h-4 mr-2"/>Añadir</Button>
              </div>
            </form>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Historial</h3>
            <div className="rounded-md border h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={2} className="text-center">Cargando...</TableCell></TableRow>
                  ) : (
                    history.map(record => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.maintenance_date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.notes}</TableCell>
                      </TableRow>
                    ))
                  )}
                   {history.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={2} className="text-center">No hay registros.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
         <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};