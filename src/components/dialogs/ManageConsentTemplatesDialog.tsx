import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConsentTemplates, useCreateConsentTemplate, useUpdateConsentTemplate, useToggleConsentTemplateStatus, ConsentTemplate } from "@/hooks/useConsentTemplates";
import { getConsentTemplatesColumns } from "@/components/tables/consent-templates-columns";
import { DataTable } from "@/components/DataTable"; // Assuming a generic DataTable component exists
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConsentEditor } from '@/components/editors/ConsentEditor'; // Import the new editor

interface ManageConsentTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditorForm = ({ template, onSave, onCancel, isSaving }: { template: Partial<ConsentTemplate>, onSave: (updates: Partial<ConsentTemplate>) => void, onCancel: () => void, isSaving: boolean }) => {
  const [name, setName] = useState(template.name || '');
  const [content, setContent] = useState(template.content || '');

  // Determine if there are changes
  const hasChanges = name !== (template.name || '') || content !== (template.content || '');

  const handleSave = () => {
    onSave({ ...template, name, content });
  };

  return (
    <div className="space-y-4 py-4">
      <h3 className="text-lg font-semibold">{template.id ? 'Editar' : 'Crear'} Plantilla</h3>
      <div className="space-y-2">
        <Label htmlFor="template-name">Nombre de la Plantilla</Label>
        <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Consentimiento para Micropigmentación" />
      </div>
      <div className="space-y-2">
        <Label>Contenido de la Plantilla</Label>
        <ConsentEditor content={content} onContentChange={setContent} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>Guardar</Button>
      </div>
    </div>
  );
};

export function ManageConsentTemplatesDialog({ open, onOpenChange }: ManageConsentTemplatesDialogProps) {
  const { toast } = useToast();
  const { data: templates, isLoading } = useConsentTemplates();
  const { mutate: createTemplate, isLoading: isCreating } = useCreateConsentTemplate();
  const { mutate: updateTemplate, isLoading: isUpdating } = useUpdateConsentTemplate();
  const { mutate: toggleTemplateStatus } = useToggleConsentTemplateStatus();

  const [editingTemplate, setEditingTemplate] = useState<Partial<ConsentTemplate> | null>(null);

  const handleEdit = (template: ConsentTemplate) => {
    setEditingTemplate(template);
  };

  const handleToggleStatus = (template: ConsentTemplate) => {
    toggleTemplateStatus({ id: template.id }, {
      onSuccess: () => toast({ title: 'Éxito', description: 'Estado de la plantilla actualizado.', variant: 'success' }),
      onError: (e) => toast({ title: 'Error', description: `No se pudo actualizar: ${(e as Error).message}`, variant: 'destructive' }),
    });
  };

  const handleSave = (updates: Partial<ConsentTemplate>) => {
    const action = updates.id ? updateTemplate : createTemplate;
    action(updates as any, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Plantilla guardada correctamente.', variant: 'success' });
        setEditingTemplate(null);
      },
      onError: (e) => toast({ title: 'Error', description: `No se pudo guardar: ${(e as Error).message}`, variant: 'destructive' }),
    });
  };

  const columns = getConsentTemplatesColumns(handleEdit, handleToggleStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gestionar Plantillas de Consentimiento</DialogTitle>
          <DialogDescription>
            Crea y administra las plantillas para los consentimientos informados que usarás en tu negocio.
          </DialogDescription>
        </DialogHeader>
        
        {editingTemplate ? (
          <EditorForm template={editingTemplate} onSave={handleSave} onCancel={() => setEditingTemplate(null)} isSaving={isCreating || isUpdating} />
        ) : (
          <div className="py-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setEditingTemplate({})}>Crear Nueva Plantilla</Button>
            </div>
            {isLoading ? (
              <p>Cargando plantillas...</p>
            ) : (
              <DataTable columns={columns} data={templates || []} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
