import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientDocumentInstance } from "@/hooks/useClientDocumentTemplates";
import { Badge } from "@/components/ui/badge";

interface ViewFichaTecnicaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: ClientDocumentInstance | null;
}

export function ViewFichaTecnicaDialog({ open, onOpenChange, instance }: ViewFichaTecnicaDialogProps) {
  if (!instance) return null;

  const { template, data, created_at } = instance;
  const fields = template?.schema?.fields || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle de Ficha: {template?.name}</DialogTitle>
          <DialogDescription>
            Ficha llenada el {new Date(created_at).toLocaleString('es-ES')}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-4">
          {fields.map((field: any) => {
            const value = data[field.id];
            return (
              <div key={field.id} className="grid grid-cols-3 gap-4 items-start">
                <span className="font-semibold col-span-1">{field.label}:</span>
                <div className="col-span-2">
                  {field.type === 'checkbox' ? (
                    <Badge variant={value ? 'default' : 'outline'}>{value ? 'Sí' : 'No'}</Badge>
                  ) : (
                    <p className="text-sm">{value?.toString() || <em>No respondido</em>}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
