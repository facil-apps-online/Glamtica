import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";

interface FormViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: any;
  formData: any;
  formName?: string;
  formVersion?: number;
}

export const FormViewerDialog: React.FC<FormViewerDialogProps> = ({
  open,
  onOpenChange,
  schema,
  formData,
  formName,
  formVersion,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formName ? `Detalles del Formulario: ${formName}` : "Detalles del Formulario"}
            {formVersion && <span className="text-sm text-gray-500"> (v{formVersion})</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <DynamicFormRenderer schema={schema} formData={formData} readOnly={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
};