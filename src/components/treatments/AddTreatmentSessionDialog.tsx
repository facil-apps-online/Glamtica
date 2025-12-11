
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientTreatments, useClientTreatmentDetails } from '@/hooks/useTreatments';
import { PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface AddTreatmentSessionDialogProps {
  children: React.ReactNode;
  clientId: string;
  onSessionSelected: (session: any) => void;
}

export function AddTreatmentSessionDialog({ children, clientId, onSessionSelected }: AddTreatmentSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);

  const { data: clientTreatments, isLoading: isLoadingClientTreatments } = useClientTreatments(clientId);
  const { data: treatmentDetails, isLoading: isLoadingTreatmentDetails } = useClientTreatmentDetails(selectedTreatmentId || '');

  const handleSelectSession = (session: any) => {
    onSessionSelected(session);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Sesión de Tratamiento</DialogTitle>
          <DialogDescription>
            Selecciona un tratamiento y la sesión pendiente que deseas añadir a la atención actual.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Tratamiento del Cliente</Label>
            <Select onValueChange={setSelectedTreatmentId} value={selectedTreatmentId || ''} disabled={isLoadingClientTreatments || !clientTreatments || clientTreatments.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tratamiento asignado..." />
              </SelectTrigger>
              <SelectContent>
                {clientTreatments?.map(treatment => (
                  <SelectItem key={treatment.id} value={treatment.id}>
                    {treatment.name} ({treatment.progress.completed}/{treatment.progress.total} completadas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTreatmentId && isLoadingTreatmentDetails && <p>Cargando detalles del tratamiento...</p>}

          {treatmentDetails && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Sesiones Pendientes:</h4>
              {treatmentDetails.sessions.filter(s => s.status === 'pending').length === 0 ? (
                <p className="text-muted-foreground">No hay sesiones pendientes para este tratamiento.</p>
              ) : (
                <ul className="space-y-2">
                  {treatmentDetails.sessions
                    .filter(s => s.status === 'pending')
                    .map((session, index) => (
                      <li key={session.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium">Sesión {session.session_number}: {session.name}</p>
                          <p className="text-sm text-muted-foreground">{session.description}</p>
                          {session.payment_due && (
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">Pago:</Badge>
                                <span className="text-sm font-semibold">{formatCurrency(session.payment_due.amount)}</span>
                            </div>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleSelectSession(session)}>
                          <PlusCircle className="w-4 h-4 mr-2" />Añadir
                        </Button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
