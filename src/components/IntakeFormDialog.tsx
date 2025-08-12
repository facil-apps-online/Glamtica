import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";
import { ClientDocumentTemplate } from '@/hooks/useClientDocumentTemplates';

interface IntakeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ClientDocumentTemplate;
  initialFormData: any;
  onSave: (formData: any) => void;
  isSaving: boolean;
}

export const IntakeFormDialog: React.FC<IntakeFormDialogProps> = ({
  open,
  onOpenChange,
  template,
  initialFormData,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<any>(initialFormData);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Formulario de Admisión: {template.name} (v{template.version})
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <DynamicFormRenderer
            schema={template.schema}
            formData={formData}
            onFormDataChange={setFormData}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Formulario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};