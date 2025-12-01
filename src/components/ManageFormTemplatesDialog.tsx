import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useClientDocumentTemplates, useToggleDocumentTemplateStatus, useUpdateDocumentTemplate, ClientDocumentTemplate } from "@/hooks/useClientDocumentTemplates";
import { FormBuilderDialog } from '@/components/FormBuilderDialog';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit } from 'lucide-react';

interface ManageFormTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageFormTemplatesDialog({ open, onOpenChange }: ManageFormTemplatesDialogProps) {
  const { toast } = useToast();
  const { data: templates, isLoading } = useClientDocumentTemplates();
  const { mutate: toggleStatus, isLoading: isTogglingStatus } = useToggleDocumentTemplateStatus();
  const { mutate: updateTemplate, isLoading: isUpdatingTemplate } = useUpdateDocumentTemplate();

  const [isBuilderOpen, setBuilderOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ClientDocumentTemplate | null>(null);

  const handleToggleStatus = (template: ClientDocumentTemplate) => {
    toast({ title: 'Actualizando estado...', description: `Cambiando estado de ${template.name}.` });
    toggleStatus({ id: template.id, is_active: !template.is_active }, {
      onSuccess: () => toast({ title: 'Éxito', description: 'El estado de la plantilla ha sido actualizado.', variant: "success" }),
      onError: (error: any) => toast({ title: 'Error', description: `No se pudo actualizar: ${error.message}`, variant: 'destructive' })
    });
  };

  const handleToggleFillOnAttention = (template: ClientDocumentTemplate) => {
    toast({ title: 'Actualizando opción...', description: `Cambiando opción para ${template.name}.` });
    const newStatus = !template.fill_on_attention;
    updateTemplate({ id: template.id, updates: { fill_on_attention: newStatus } }, {
      onSuccess: () => toast({ title: 'Éxito', description: 'La opción de llenado en atención ha sido actualizada.', variant: "success" }),
      onError: (error: any) => toast({ title: 'Error', description: `No se pudo actualizar la opción: ${error.message}`, variant: 'destructive' })
    });
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setBuilderOpen(true);
  };

  const handleEdit = (template: ClientDocumentTemplate) => {
    setSelectedTemplate(template);
    setBuilderOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestionar Plantillas de Formularios</DialogTitle>
            <DialogDescription>
              Crea, edita y administra las plantillas de formularios para tus clientes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end">
              <Button onClick={handleCreate}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Nueva Plantilla
              </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Llenar en Atención</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Cargando plantillas...</TableCell></TableRow>
                ) : templates && templates.length > 0 ? (
                  templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell><Badge variant="outline">v{template.version}</Badge></TableCell>
                      <TableCell>
                        <Switch
                          checked={template.fill_on_attention ?? false}
                          onCheckedChange={() => handleToggleFillOnAttention(template)}
                          disabled={isUpdatingTemplate}
                        />
                      </TableCell>
                      <TableCell>
                          <Badge variant={template.is_active ? 'default' : 'destructive'}>
                              {template.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                          <Switch
                              checked={template.is_active}
                              onCheckedChange={() => handleToggleStatus(template)}
                              disabled={isTogglingStatus}
                          />
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center">No se encontraron plantillas.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <FormBuilderDialog 
        open={isBuilderOpen} 
        onOpenChange={setBuilderOpen} 
        template={selectedTemplate} 
      />
    </>
  );
}