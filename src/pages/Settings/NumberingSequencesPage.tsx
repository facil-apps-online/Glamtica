import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from '@/components/PageHeader';
import { Plus, Edit, Trash2, FileDigit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BranchSelector } from '@/components/BranchSelector';

import { useDocumentSequences, DocumentSequence } from '@/hooks/useDocumentSequences';
import { useCreateDocumentSequence, useUpdateDocumentSequence, useDeleteDocumentSequence } from '@/hooks/useManageDocumentSequences';
import { useBranches } from '@/hooks/useBranches';

const sequenceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  branch_id: z.string().optional(),
  document_type: z.string().min(1, "El tipo de documento es requerido."),
  prefix: z.string().optional(),
  format_template: z.string().optional(),
  current_number: z.coerce.number().min(1, "El número debe ser al menos 1."),
  padding: z.coerce.number().min(1, "El relleno debe ser al menos 1.").max(10),
  is_active: z.boolean(),
  country_specific_data: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Debe ser un JSON válido o estar vacío." }),
});

const SequenceForm = ({ sequence, onFinished }: { sequence?: DocumentSequence, onFinished: () => void }) => {
  const createSequence = useCreateDocumentSequence();
  const updateSequence = useUpdateDocumentSequence();
  const templateInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof sequenceSchema>>({
    resolver: zodResolver(sequenceSchema),
    defaultValues: {
      name: sequence?.name || '',
      branch_id: sequence?.branch_id || undefined,
      document_type: sequence?.document_type || '',
      prefix: sequence?.prefix || '',
      format_template: sequence?.format_template || '{prefix}{sequence}',
      current_number: sequence?.current_number || 1,
      padding: sequence?.padding || 7,
      is_active: sequence?.is_active ?? true,
      country_specific_data: sequence?.country_specific_data ? JSON.stringify(sequence.country_specific_data, null, 2) : '',
    },
  });

  const placeholders = [
    { label: 'Prefijo', value: '{prefix}' },
    { label: 'Secuencia', value: '{sequence}' },
    { label: 'Año (YYYY)', value: '{YYYY}' },
    { label: 'Año (YY)', value: '{YY}' },
    { label: 'Mes', value: '{MM}' },
    { label: 'Día', value: '{DD}' },
    { label: 'Cod. Sucursal', value: '{branch_code}' },
  ];

  const [preview, setPreview] = React.useState('');
  const watchedFields = form.watch(['format_template', 'prefix', 'padding', 'current_number']);

  React.useEffect(() => {
    const [format_template, prefix, padding, current_number] = watchedFields;
    let example = format_template || '';
    
    const now = new Date();
    example = example.replace('{YYYY}', String(now.getFullYear()));
    example = example.replace('{YY}', String(now.getFullYear()).slice(-2));
    example = example.replace('{MM}', String(now.getMonth() + 1).padStart(2, '0'));
    example = example.replace('{DD}', String(now.getDate()).padStart(2, '0'));
    
    example = example.replace('{prefix}', prefix || '');
    example = example.replace('{sequence}', String(current_number).padStart(padding || 7, '0'));
    example = example.replace('{branch_code}', 'SUC1'); // Use a static example for branch code in preview

    setPreview(example);
  }, [watchedFields]);

  const handlePlaceholderClick = (placeholder: string) => {
    const input = templateInputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = form.getValues('format_template') || '';
    
    const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
    
    form.setValue('format_template', newValue, { shouldValidate: true });
    
    setTimeout(() => {
      input.focus();
      const newCursorPos = start + placeholder.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const onSubmit = (values: z.infer<typeof sequenceSchema>) => {
    const submissionData = {
      ...values,
      branch_id: values.branch_id === 'all' ? null : values.branch_id,
      country_specific_data: values.country_specific_data ? JSON.parse(values.country_specific_data) : null,
    };

    if (sequence) {
      updateSequence.mutate({ sequenceId: sequence.id, updates: submissionData }, {
        onSuccess: onFinished,
      });
    } else {
      createSequence.mutate(submissionData as any, {
        onSuccess: onFinished,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nombre Descriptivo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField control={form.control} name="branch_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Sucursal (Opcional)</FormLabel>
            <BranchSelector includeAllOption={true} selectedBranchId={field.value || 'all'} onBranchChange={field.onChange} />
            <FormDescription>Asigna esta secuencia a una sucursal específica, o déjala en "Todas" para que sea general.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="document_type" render={({ field }) => (
          <FormItem><FormLabel>Tipo de Documento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo..." /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="SALE">Venta (Recibo)</SelectItem>
                <SelectItem value="INVOICE">Factura</SelectItem>
                <SelectItem value="CREDIT_NOTE">Nota de Crédito</SelectItem>
                <SelectItem value="DEBIT_NOTE">Nota de Débito</SelectItem>
                <SelectItem value="TRANSFER">Traslado</SelectItem>
                <SelectItem value="WRITE_OFF">Baja de Inventario</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="prefix" render={({ field }) => (
          <FormItem><FormLabel>Prefijo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="format_template" render={({ field }) => (
          <FormItem>
            <FormLabel>Plantilla de Formato</FormLabel>
            <FormControl><Input {...field} ref={templateInputRef} /></FormControl>
            <div className="flex flex-wrap gap-1 pt-2">
              {placeholders.map(p => (
                <Button
                  type="button"
                  key={p.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlaceholderClick(p.value)}
                  className="text-xs h-6 px-2"
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {preview && (
              <FormDescription className="pt-2">
                Vista Previa: <code className="font-bold bg-muted p-1 rounded-sm">{preview}</code>
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="current_number" render={({ field }) => (
            <FormItem><FormLabel>Siguiente Número</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="padding" render={({ field }) => (
            <FormItem><FormLabel>Relleno (ceros)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="country_specific_data" render={({ field }) => (
          <FormItem>
            <FormLabel>Datos Específicos (JSON)</FormLabel>
            <FormControl><Textarea {...field} rows={4} /></FormControl>
            <FormDescription>
                Para datos de localización. Ej: resolución de facturación para Colombia.
                <code className="text-xs block bg-muted p-2 rounded-sm mt-2">{"{\"resolution_number\": \"18760000001\", \"resolution_date\": \"2023-01-01\"}"}</code>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="is_active" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <FormLabel>Activa</FormLabel>
                <FormDescription>Solo las secuencias activas pueden ser utilizadas.</FormDescription>
            </div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <Button type="submit" disabled={createSequence.isPending || updateSequence.isPending}>
          {createSequence.isPending || updateSequence.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Form>
  );
};

const TableSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
  </div>
);

const SequenceCard = ({ sequence, branchMap, onEdit, onDelete }: { sequence: DocumentSequence, branchMap: Map<string, string>, onEdit: (seq: DocumentSequence) => void, onDelete: (id: string) => void }) => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>{sequence.name}</CardTitle>
                    <CardDescription>{branchMap.get(sequence.branch_id) || 'General (Todas)'}</CardDescription>
                </div>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${sequence.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {sequence.is_active ? 'Activa' : 'Inactiva'}
                </span>
            </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tipo de Documento</span>
                <span className="font-medium">{sequence.document_type}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Siguiente Número</span>
                <span className="font-medium">{sequence.current_number}</span>
            </div>
            <div className="space-y-1">
                <span className="text-muted-foreground">Plantilla de Formato</span>
                <code className="text-xs block w-full truncate bg-muted p-1 rounded-sm">{sequence.format_template || ''}</code>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 bg-slate-50/50 p-3">
            <Button variant="outline" size="sm" onClick={() => onEdit(sequence)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(sequence.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
            </Button>
        </CardFooter>
    </Card>
);

export default function NumberingSequencesPage() {
  const { data: sequences = [], isLoading, error } = useDocumentSequences();
  const { data: branches = [] } = useBranches();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<DocumentSequence | undefined>(undefined);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingSequenceId, setDeletingSequenceId] = useState<string | null>(null);

  const deleteSequence = useDeleteDocumentSequence();

  const branchMap = useMemo(() => {
    return new Map(branches.map(branch => [branch.id, branch.name]));
  }, [branches]);

  const handleOpenForm = (sequence?: DocumentSequence) => {
    setEditingSequence(sequence);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSequence(undefined);
  };

  const openDeleteConfirm = (sequenceId: string) => {
    setDeletingSequenceId(sequenceId);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (deletingSequenceId) {
      deleteSequence.mutate(deletingSequenceId, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false);
          setDeletingSequenceId(null);
        }
      });
    }
  };

  if (error) {
    return <div className="text-red-500">Error al cargar las secuencias: {error.message}</div>;
  }

  return (
    <div className="mt-4">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <FileDigit className="h-5 w-5" />
                  <span className="sm:hidden">Sec. de Numeración</span>
                  <span className="hidden sm:inline">Secuencias de Numeración</span>
                </CardTitle>
                <CardDescription>Define los formatos y contadores para tus documentos.</CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Crear Nueva Secuencia</span>
            </Button>
          </CardHeader>
          <CardContent>
            {/* Mobile View: Grid of Cards */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {isLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-60 w-full" />)
              ) : sequences.map((seq) => (
                <SequenceCard 
                  key={seq.id}
                  sequence={seq}
                  branchMap={branchMap}
                  onEdit={handleOpenForm}
                  onDelete={openDeleteConfirm}
                />
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plantilla</TableHead>
                    <TableHead>Siguiente #</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7}><TableSkeleton /></TableCell></TableRow>
                  ) : sequences.map((seq) => (
                    <TableRow key={seq.id}>
                      <TableCell className="font-medium">{seq.name}</TableCell>
                      <TableCell>{branchMap.get(seq.branch_id) || 'General (Todas)'}</TableCell>
                      <TableCell>{seq.document_type}</TableCell>
                      <TableCell><code className="text-xs">{seq.format_template || ''}</code></TableCell>
                      <TableCell>{seq.current_number}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${seq.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {seq.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenForm(seq)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDeleteConfirm(seq.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingSequence ? 'Editar Secuencia' : 'Crear Nueva Secuencia'}</DialogTitle></DialogHeader>
          <div className="overflow-y-auto -mx-6 px-6 py-4">
            <SequenceForm sequence={editingSequence} onFinished={handleCloseForm} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente la secuencia de numeración.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteSequence.isPending}>
              {deleteSequence.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
