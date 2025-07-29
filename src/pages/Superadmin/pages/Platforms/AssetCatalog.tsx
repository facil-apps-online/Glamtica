import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';

// --- Zod Schema for Asset Form ---
const assetSchema = z.object({
  asset_key: z.string().min(3, { message: "La clave debe tener al menos 3 caracteres." }).regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guiones bajos."),
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  description: z.string().optional(),
  data_type: z.enum(['boolean', 'numeric']),
});
type AssetFormValues = z.infer<typeof assetSchema>;

// --- Types ---
interface PlanAsset {
  id: string;
  asset_key: string;
  name: string;
  description: string | null;
  data_type: 'boolean' | 'numeric';
}

export default function AssetCatalog() {
  const { platformId } = useParams<{ platformId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assets, setAssets] = useState<PlanAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PlanAsset | null>(null);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
  });

  const fetchAssets = async () => {
    if (!platformId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_plan_assets_by_platform', payload: { platformId } },
      });
      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      toast({ title: "Error al cargar activos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [platformId]);

  const handleDialogOpen = (asset: PlanAsset | null = null) => {
    setEditingAsset(asset);
    form.reset(asset ? { ...asset, description: asset.description || '' } : { asset_key: '', name: '', description: '', data_type: 'numeric' });
    setDialogOpen(true);
  };

  const onSubmit = async (values: AssetFormValues) => {
    try {
      const action = editingAsset ? 'update_plan_asset' : 'create_plan_asset';
      const payload = editingAsset
        ? { assetId: editingAsset.id, assetData: values }
        : { assetData: { ...values, platform_id: platformId } };

      const { error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action, payload },
      });
      if (error) throw error;

      toast({ title: `Activo ${editingAsset ? 'actualizado' : 'creado'}` });
      setDialogOpen(false);
      fetchAssets(); // Refresh list
    } catch (err: any) {
      toast({ title: "Error al guardar el activo", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      const { error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'delete_plan_asset', payload: { assetId } },
      });
      if (error) throw error;
      toast({ title: "Activo eliminado" });
      fetchAssets(); // Refresh list
    } catch (err: any) {
      toast({ title: "Error al eliminar el activo", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/superadmin/platforms')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Catálogo de Activos</h1>
        </div>
        <Button onClick={() => handleDialogOpen()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Activo
        </Button>
      </div>

      {/* Asset Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Editar Activo' : 'Crear Nuevo Activo'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre para UI</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="asset_key" render={({ field }) => ( <FormItem><FormLabel>Clave (para código)</FormLabel><FormControl><Input {...field} disabled={!!editingAsset} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="data_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Dato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="numeric">Numérico</SelectItem>
                      <SelectItem value="boolean">Booleano (Sí/No)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assets Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Clave</TableHead><TableHead>Tipo</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center">Cargando...</TableCell></TableRow> :
             assets.length > 0 ? assets.map(asset => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name}</TableCell>
                <TableCell><code>{asset.asset_key}</code></TableCell>
                <TableCell>{asset.data_type}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleDialogOpen(asset)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(asset.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={4} className="text-center">No hay activos definidos.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
