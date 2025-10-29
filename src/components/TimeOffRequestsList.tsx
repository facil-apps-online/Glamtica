import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { useUserTimeOff, useUpdateTimeOffRequest, TimeOffRequest } from "@/hooks/useUserTimeOff";
import { useAuth } from "@/contexts/AuthContext";
import { TimeOffCardSkeleton } from "./TimeOffCardSkeleton";
import { TimeOffTableSkeleton } from "./TimeOffTableSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/EmptyState";

interface TimeOffRequestsListProps {
  canApprove?: boolean;
  branchId?: string;
  statusFilter?: TimeOffRequest['status'] | 'all' | TimeOffRequest['status'][];
  typeFilter?: string;
  dateRange?: { from?: Date; to?: Date };
  searchTerm?: string;
  userId?: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const TimeOffRequestsList = ({
  canApprove = false,
  branchId,
  statusFilter = 'pending',
  typeFilter,
  dateRange,
  searchTerm,
  userId,
}: TimeOffRequestsListProps) => {
  const { profile, currentAssignment } = useAuth();

  let branchIdToUse: string | undefined = undefined;

  if (currentAssignment?.role_name === 'tenant_super_admin') {
    branchIdToUse = branchId;
  } else if (currentAssignment?.branch_id) {
    branchIdToUse = currentAssignment.branch_id;
  }

  const { data: requests, isLoading } = useUserTimeOff(userId, statusFilter, typeFilter, dateRange, branchIdToUse, searchTerm);
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
    const userTimezone = profile?.timezone || 'UTC';

    const startDateFormatted = formatInTimeZone(request.start_date, userTimezone, "dd/MM/yyyy", { locale: es });
    const endDateFormatted = formatInTimeZone(request.end_date, userTimezone, "dd/MM/yyyy", { locale: es });

    let periodString = '';

    if (request.is_partial_day) {
      const startTime = formatInTimeZone(request.start_date, userTimezone, "HH:mm", { locale: es });
      const endTime = formatInTimeZone(request.end_date, userTimezone, "HH:mm", { locale: es });
      
      if (startDateFormatted === endDateFormatted) {
        periodString = `${startDateFormatted} (${startTime} - ${endTime})`;
      } else {
        periodString = `${startDateFormatted} ${startTime} - ${endDateFormatted} ${endTime}`;
      }
    } else {
      if (startDateFormatted === endDateFormatted) {
        periodString = `${startDateFormatted} (día completo)`;
      } else {
        periodString = `${startDateFormatted} - ${endDateFormatted} (días completos)`;
      }
    }
    
    return periodString;
  };

  if (isLoading) {
    return (
      <>
        <div className="md:hidden">
          <TimeOffCardSkeleton />
        </div>
        <div className="hidden md:block">
          <TimeOffTableSkeleton />
        </div>
      </>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <EmptyState
        Icon={Calendar}
        title="No hay solicitudes"
        description="No se han realizado solicitudes de permisos aún."
      />
    );
  }

  return (
    <>
      <div className="md:hidden space-y-4">
        {requests.map((request) => {
          const StatusIcon = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
          const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
          
          return (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg min-w-0">Solicitud de Permiso {request.user_name ? `de ${request.user_name}` : ''}</CardTitle>
                  {request.branch_name && <p className="text-sm text-muted-foreground">Sucursal: {request.branch_name}</p>}
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
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const StatusIcon = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
              const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];

              return (
                <TableRow key={request.id}>
                  <TableCell>{request.user_name || '-'}</TableCell>
                  <TableCell>{request.branch_name || '-'}</TableCell>
                  <TableCell>{formatTimeOffPeriod(request)}</TableCell>
                  <TableCell>{request.reason || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig?.label || request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canApprove && request.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};