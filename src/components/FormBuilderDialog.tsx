import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateDocumentTemplate, useUpdateDocumentTemplate, ClientDocumentTemplate } from "@/hooks/useClientDocumentTemplates";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Define los tipos de campos que el usuario puede agregar
const fieldTypes = [
  { id: 'text', name: 'Texto Corto' },
  { id: 'textarea', name: 'Texto Largo' },
  { id: 'number', name: 'Número' },
  { id: 'date', name: 'Fecha' },
  { id: 'checkbox', name: 'Casilla de Verificación' },
];

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

interface FormBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ClientDocumentTemplate | null;
}

export function FormBuilderDialog({ open, onOpenChange, template }: FormBuilderDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);

  const { mutate: createTemplate, isLoading: isCreating } = useCreateDocumentTemplate();
  const { mutate: updateTemplate, isLoading: isUpdating } = useUpdateDocumentTemplate();

  useEffect(() => {
    if (template && open) {
      setName(template.name);
      setDescription(template.description || '');
      setFields(template.schema?.fields || []);
    } else {
      setName('');
      setDescription('');
      setFields([]);
    }
  }, [template, open]);

  const addField = () => {
    setFields([...fields, { id: uuidv4(), label: '', type: 'text', required: false }]);
  };

  const updateField = (id: string, newValues: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...newValues } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = () => {
    const schema = { fields };
    if (template) {
      updateTemplate({ id: template.id, updates: { name, description, schema } }, {
        onSuccess: () => {
          toast({ title: 'Éxito', description: 'Plantilla actualizada.', variant: 'success' });
          onOpenChange(false);
        },
        onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
      });
    } else {
      createTemplate({ name, description, schema }, {
        onSuccess: () => {
          toast({ title: 'Éxito', description: 'Plantilla creada.', variant: 'success' });
          onOpenChange(false);
        },
        onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</DialogTitle>
          <DialogDescription>Define los campos que aparecerán en tu formulario.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nombre de la Plantilla</Label>
            <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ficha de Cliente Inicial" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Descripción</Label>
            <Textarea id="template-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="(Opcional) Describe el propósito de este formulario" />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Campos del Formulario</h3>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-4 border p-4 rounded-md">
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`field-label-${field.id}`}>Etiqueta del Campo</Label>
                      <Input
                        id={`field-label-${field.id}`}
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder={`Campo #${index + 1}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`field-type-${field.id}`}>Tipo de Campo</Label>
                      <Select value={field.type} onValueChange={(value) => updateField(field.id, { type: value })}>
                        <SelectTrigger id={`field-type-${field.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 flex items-center space-x-2 mt-2">
                        <Switch id={`field-required-${field.id}`} checked={field.required} onCheckedChange={(checked) => updateField(field.id, { required: checked })} />
                        <Label htmlFor={`field-required-${field.id}`}>Requerido</Label>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} className="mt-6">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-center text-slate-500 py-8 border rounded-md">
                  Añade tu primer campo para empezar a construir el formulario.
                </p>
              )}
            </div>
            <Button variant="outline" className="mt-4" onClick={addField}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Campo
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isCreating || isUpdating || !name}>
            {isCreating || isUpdating ? 'Guardando...' : 'Guardar Plantilla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}