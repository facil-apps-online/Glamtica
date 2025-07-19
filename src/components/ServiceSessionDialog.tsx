import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServiceSession, useStartServiceSession, useEndServiceSession } from "@/hooks/useServiceSessions";
import { AttentionService } from "@/hooks/useAttentionServices";
import { Play, Square, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ServiceSessionDialogProps {
  attentionService: AttentionService;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceSessionDialog = ({ attentionService, open, onOpenChange }: ServiceSessionDialogProps) => {
  const { data: session, isLoading } = useServiceSession(attentionService.id);
  const startSessionMutation = useStartServiceSession();
  const endSessionMutation = useEndServiceSession();

  const handleStartSession = async () => {
    try {
      await startSessionMutation.mutateAsync({
        attentionServiceId: attentionService.id
      });
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      await endSessionMutation.mutateAsync({
        attentionServiceId: attentionService.id
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'En Proceso':
        return <Badge variant="default" className="bg-blue-500">En Proceso</Badge>;
      case 'Completado':
        return <Badge variant="default" className="bg-green-500">Completado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "0 min";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${remainingMinutes}min`;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestión de Servicio</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información del servicio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{attentionService.services.name}</h3>
              {getStatusBadge(attentionService.status)}
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Estilista:</strong> {attentionService.stylists.name}</p>
              <p><strong>Duración estimada:</strong> {attentionService.services.duration_minutes} minutos</p>
              <p><strong>Precio:</strong> ${attentionService.service_price}</p>
              {attentionService.notes && (
                <p><strong>Notas:</strong> {attentionService.notes}</p>
              )}
            </div>
          </div>

          {/* Información de la sesión */}
          {session && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Información de la Sesión
              </h4>
              
              <div className="text-sm space-y-2">
                {session.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inicio:</span>
                    <span>{format(new Date(session.started_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                  </div>
                )}
                
                {session.ended_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin:</span>
                    <span>{format(new Date(session.ended_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                  </div>
                )}
                
                {session.duration_minutes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración:</span>
                    <span>{formatDuration(session.duration_minutes)}</span>
                  </div>
                )}
                
                {session.notes && (
                  <div>
                    <span className="text-muted-foreground">Notas de sesión:</span>
                    <p className="mt-1">{session.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            
            {!session && attentionService.status === 'Pendiente' && (
              <Button
                onClick={handleStartSession}
                disabled={startSessionMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Servicio
              </Button>
            )}
            
            {session && !session.ended_at && attentionService.status === 'En Proceso' && (
              <Button
                onClick={handleEndSession}
                disabled={endSessionMutation.isPending}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Finalizar Servicio
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};