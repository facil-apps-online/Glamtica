
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

interface DynamicFormRendererProps {
  schema: { fields: FormField[] };
  formData: { [key: string]: any };
  onFormDataChange: (data: { [key: string]: any }) => void;
  readOnly?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ schema, formData, onFormDataChange, readOnly = false }) => {

  const handleChange = (fieldId: string, value: any) => {
    onFormDataChange({
      ...formData,
      [fieldId]: value,
    });
  };

  if (!schema || !schema.fields || schema.fields.length === 0) {
    return <p className="text-center text-slate-500">No hay campos definidos para este formulario.</p>;
  }

  return (
    <div className="space-y-4">
      {schema.fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.type === 'text' && (
            <Input
              id={field.id}
              type="text"
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              readOnly={readOnly}
            />
          )}
          {field.type === 'textarea' && (
            <Textarea
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              readOnly={readOnly}
            />
          )}
          {field.type === 'number' && (
            <Input
              id={field.id}
              type="number"
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              readOnly={readOnly}
            />
          )}
          {field.type === 'date' && (
            <Input
              id={field.id}
              type="date"
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              readOnly={readOnly}
            />
          )}
          {field.type === 'checkbox' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={formData[field.id] || false}
                onCheckedChange={(checked) => handleChange(field.id, checked)}
                required={field.required}
                disabled={readOnly}
              />
              <Label htmlFor={field.id}>{field.label}</Label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
