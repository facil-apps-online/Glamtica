import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSaveClientDocumentInstance, ClientDocumentTemplate } from "@/hooks/useClientDocumentTemplates";
import { Attention } from "@/hooks/useAttentions";
import { useToast } from "@/hooks/use-toast";

interface FillFormInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ClientDocumentTemplate | null;
  attention: Attention | null;
}

export function FillFormInstanceDialog({ open, onOpenChange, template, attention }: FillFormInstanceDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { mutate: saveInstance, isLoading: isSaving } = useSaveClientDocumentInstance();

  useEffect(() => {
    // Reset form data when dialog opens or template changes
    if (open) {
      setFormData({});
    }
  }, [open, template]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = () => {
    if (!template || !attention) return;

    saveInstance({
      client_id: attention.client_id,
      template_id: template.id,
      attention_id: attention.id,
      data: formData,
    }, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Ficha técnica guardada correctamente.', variant: 'success' });
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast({ title: 'Error', description: `No se pudo guardar la ficha: ${error.message}`, variant: 'destructive' });
      }
    });
  };

  const renderField = (field: { id: string; label: string; type: string; required: boolean; }) => {
    switch (field.type) {
      case 'text':
        return <Input value={formData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} />;
      case 'textarea':
        return <Textarea value={formData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} />;
      case 'number':
        return <Input type="number" value={formData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.valueAsNumber)} />;
      case 'date':
        return <Input type="date" value={formData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} />;
      case 'checkbox':
        return <Switch checked={formData[field.id] || false} onCheckedChange={checked => handleFieldChange(field.id, checked)} />;
      default:
        return <p className="text-sm text-red-500">Tipo de campo no soportado: {field.type}</p>;
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Llenar: {template.name}</DialogTitle>
          <DialogDescription>{template.description || 'Complete los campos de la ficha técnica.'}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-4">
          {template.schema?.fields?.map((field: any) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}{field.required && <span className="text-red-500">*</span>}</Label>
              {renderField(field)}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Ficha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
