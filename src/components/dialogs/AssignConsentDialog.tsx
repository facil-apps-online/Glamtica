import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConsentTemplates, useAssignConsentToService } from "@/hooks/useConsentTemplates";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AssignConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attentionId: string;
  attentionServiceId: string;
}

export function AssignConsentDialog({ open, onOpenChange, attentionId, attentionServiceId }: AssignConsentDialogProps) {
  const { toast } = useToast();
  const { data: availableTemplates, isLoading: isLoadingTemplates } = useConsentTemplates();
  const { mutate: assignConsent, isPending: isAssigning } = useAssignConsentToService();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [observations, setObservations] = useState('');

  const handleAssign = () => {
    if (!selectedTemplateId) {
      toast({ title: "Advertencia", description: "Selecciona una plantilla para asignar.", variant: "warning" });
      return;
    }

    assignConsent({ 
      attentionId, 
      templateId: selectedTemplateId, 
      attentionServiceId,
      professionalObservations: observations 
    }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: `Plantilla asignada correctamente.`, variant: "success" });
        setSelectedTemplateId(null);
        setObservations('');
        onOpenChange(false);
      },
      onError: (e) => {
        toast({ title: "Error", description: `No se pudo asignar la plantilla: ${(e as Error).message}`, variant: "destructive" });
      },
    });
  };

  const activeTemplates = availableTemplates?.filter(t => t.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Consentimiento a la Atención</DialogTitle>
          <DialogDescription>
            Selecciona la plantilla de consentimiento y añade las observaciones del profesional.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Plantilla de Consentimiento</Label>
            <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId || ''} disabled={isLoadingTemplates}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTemplates ? "Cargando plantillas..." : "Selecciona una plantilla"} />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.length === 0 ? (
                  <SelectItem value="no-templates" disabled>No hay plantillas activas</SelectItem>
                ) : (
                  activeTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professional-observations">Observaciones del Profesional</Label>
            <Textarea
              id="professional-observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Añade aquí cualquier observación relevante para este consentimiento..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAssign} disabled={isAssigning || !selectedTemplateId}>
            {isAssigning ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}