
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useStylistTimeOff, useUpdateTimeOffRequest } from "@/hooks/useStylistTimeOff";

interface TimeOffRequestsListProps {
  stylistId: string;
  canApprove?: boolean;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const TYPE_LABELS = {
  vacation: 'Vacaciones',
  sick: 'Enfermedad',
  personal: 'Personal',
  training: 'Capacitación',
  other: 'Otro',
};

export const TimeOffRequestsList = ({ stylistId, canApprove = false }: TimeOffRequestsListProps) => {
  const { data: requests, isLoading } = useStylistTimeOff(stylistId);
  const updateRequestMutation = useUpdateTimeOffRequest();

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await updateRequestMutation.mutateAsync({
        id: requestId,
        status,
        approved_by: 'admin', // In a real app, this would be the current user's ID
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
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-slate-600">Cargando solicitudes...</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No hay solicitudes</h3>
        <p className="text-slate-600">No se han realizado solicitudes de permisos aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const StatusIcon = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
        const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
        
        return (
          <Card key={request.id} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {TYPE_LABELS[request.type as keyof typeof TYPE_LABELS] || request.type}
                </CardTitle>
                <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig?.label || request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">
                  {formatTimeOffPeriod(request)}
                </span>
              </div>

              {request.reason && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Motivo:</p>
                  <p className="text-sm text-slate-600">{request.reason}</p>
                </div>
              )}

              {request.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Notas:</p>
                  <p className="text-sm text-slate-600">{request.notes}</p>
                </div>
              )}

              {canApprove && request.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproval(request.id, 'approved')}
                    disabled={updateRequestMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(request.id, 'rejected')}
                    disabled={updateRequestMutation.isPending}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              )}

              {request.approved_at && (
                <p className="text-xs text-slate-500">
                  {request.status === 'approved' ? 'Aprobado' : 'Actualizado'} el{' '}
                  {format(new Date(request.approved_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  {request.approved_by && ` por ${request.approved_by}`}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
