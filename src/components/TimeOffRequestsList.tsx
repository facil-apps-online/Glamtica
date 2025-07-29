
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUserTimeOff, useUpdateTimeOffRequest, TimeOffRequest } from "@/hooks/useUserTimeOff";
import { useAuth } from "@/contexts/AuthContext";

interface TimeOffRequestsListProps {
  userId: string;
  canApprove?: boolean;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const TimeOffRequestsList = ({ userId, canApprove = false }: TimeOffRequestsListProps) => {
  const { profile } = useAuth();
  const { data: requests, isLoading } = useUserTimeOff(userId);
  const updateRequestMutation = useUpdateTimeOffRequest();

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!profile?.id) return;
    try {
      await updateRequestMutation.mutateAsync({
        id: requestId,
        status,
        approved_by: profile.id,
      });
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const formatTimeOffPeriod = (request: TimeOffRequest) => {
    const startDate = format(new Date(request.start_date), "dd/MM/yyyy", { locale: es });
    const endDate = request.start_date !== request.end_date 
      ? format(new Date(request.end_date), "dd/MM/yyyy", { locale: es })
      : null;
    
    const dateRange = endDate ? `${startDate} - ${endDate}` : startDate;
    
    if (request.start_time && request.end_time) {
      return `${dateRange} de ${request.start_time.slice(0,5)} a ${request.end_time.slice(0,5)}`;
    } else {
      return `${dateRange} (día completo)`;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando solicitudes...</div>;
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay solicitudes</h3>
        <p className="text-muted-foreground">No se han realizado solicitudes de permisos aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const StatusIcon = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
        const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
        
        return (
          <Card key={request.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Solicitud de Permiso</CardTitle>
                <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig?.label || request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">
                  {formatTimeOffPeriod(request)}
                </span>
              </div>

              {request.reason && (
                <div>
                  <p className="text-sm font-medium">Motivo:</p>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>
              )}

              {canApprove && request.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproval(request.id!, 'approved')}
                    disabled={updateRequestMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(request.id!, 'rejected')}
                    disabled={updateRequestMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
