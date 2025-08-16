import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, User, Scissors, Phone, DollarSign, Camera, ShoppingCart, Package, MoreVertical, Trash2 } from "lucide-react";
import { useAttentions, Attention, AttentionService } from "@/hooks/useAttentions";
import { useSettings } from "@/hooks/useSettings";
import { AttentionDialog } from "@/components/AttentionDialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { CancelAttentionDialog } from "@/components/CancelAttentionDialog";
import { UserSelector } from "@/components/UserSelector";
import { AttentionDateFilter } from "@/components/AttentionDateFilter";
import { AttentionStatusFilter } from "@/components/AttentionStatusFilter";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ServiceSessionDialog } from "@/components/ServiceSessionDialog";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { AddServiceDialog } from "@/components/AddServiceDialog";
import { AddServiceProductDialog } from "@/components/AddServiceProductDialog";
import { useServiceProducts } from "@/hooks/useServiceProducts";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Attentions() {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<AttentionService | null>(null);
  const { selectedBranchId } = useBranchFilterStore();
  const { currentAssignment } = useAuth();

  const branchIdForDialog = selectedBranchId !== 'all' ? selectedBranchId : currentAssignment?.branch_id;

  const { data: settings, isLoading: settingsLoading } = useSettings();

  const { data: attentions, isLoading: attentionsLoading, error: attentionsError } = useAttentions(
    selectedUser,
    statusFilter,
    dateFilter
  );
  const { formatPrice } = usePriceFormat();

  if (settingsLoading || attentionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-blue-600">
          Cargando...
        </div>
      </div>
    );
  }

  if (attentionsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Error cargando las atenciones: {attentionsError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Agenda de Atenciones</h1>
        <AttentionDialog branchId={branchIdForDialog}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button disabled={!branchIdForDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Atención
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              {!branchIdForDialog && (
                <TooltipContent>
                  <p>Selecciona una sucursal para crear una atención.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </AttentionDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AttentionDateFilter
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          selectedUserId={selectedUser}
        />
        <UserSelector
          selectedUserId={selectedUser}
          onUserChange={setSelectedUser}
        />
        <AttentionStatusFilter
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      <div className="space-y-4">
        {attentions && attentions.length > 0 ? (
          attentions.map((attention) => (
            <AttentionCard 
              key={attention.id} 
              attention={attention} 
              formatPrice={formatPrice}
              onServiceSelect={setSelectedService}
            />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No hay atenciones programadas
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedUser !== 'all' || statusFilter !== 'all' || dateFilter
                  ? 'No se encontraron atenciones con los filtros aplicados'
                  : 'Comienza creando tu primera atención'}
              </p>
              <AttentionDialog branchId={branchIdForDialog}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button disabled={!branchIdForDialog}>
                          <Plus className="w-4 h-4 mr-2" />
                          Nueva Atención
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    {!branchIdForDialog && (
                      <TooltipContent>
                        <p>Selecciona una sucursal para crear una atención.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </AttentionDialog>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedService && (
        <ServiceSessionDialog
          attentionService={selectedService}
          open={!!selectedService}
          onOpenChange={(open) => !open && setSelectedService(null)}
        />
      )}
    </div>
  );
}

interface AttentionCardProps {
  attention: Attention;
  formatPrice: (price: number) => string;
  onServiceSelect: (service: AttentionService) => void;
}

const AttentionCard = ({ attention, formatPrice, onServiceSelect }: AttentionCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmada':
        return <Badge variant="default" className="bg-blue-500">Confirmada</Badge>;
      case 'En Proceso':
        return <Badge variant="default" className="bg-yellow-500">En Proceso</Badge>;
      case 'Completada':
        return <Badge variant="default" className="bg-green-500">Completada</Badge>;
      case 'Cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'Pagada':
        return <Badge variant="default" className="bg-purple-500">Pagada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getServiceStatusBadge = (status: string, attentionStatus: string) => {
    if (attentionStatus === 'Cancelada') {
      return <Badge variant="destructive">Cancelado</Badge>;
    }

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

  const totalServices = attention.attention_services?.reduce((sum, s) => sum + (s.service_price || 0), 0) || 0;
  const totalProducts = attention.attention_products?.reduce((sum, p) => sum + (p.total_price || 0), 0) || 0;
  const grandTotal = totalServices + totalProducts;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg text-primary">{attention.clients?.name || 'Cliente no asignado'}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(attention.attention_date), "dd 'de' MMMM, yyyy", { locale: es })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {attention.attention_time}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {attention.clients?.phone || 'N/A'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(attention.status)}
            <CancelAttentionDialog attentionId={attention.id} clientName={attention.clients?.name || ''}>
                <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
            </CancelAttentionDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {attention.attention_services && attention.attention_services.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2"><Scissors className="w-4 h-4" />Servicios</h4>
              {attention.attention_services.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isFirst={index === 0}
                  formatPrice={formatPrice}
                  onServiceSelect={onServiceSelect}
                  getServiceStatusBadge={getServiceStatusBadge}
                  attentionStatus={attention.status}
                />
              ))}
            </div>
        )}

        {attention.attention_products && attention.attention_products.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
                 <h4 className="font-medium flex items-center gap-2"><ShoppingCart className="w-4 h-4" />Productos Vendidos</h4>
                {attention.attention_products.map(product => (
                    <div key={product.id} className="flex justify-between items-center text-sm pl-8">
                        <div>
                            <p>{product.products?.name || 'Producto no encontrado'} (x{product.quantity})</p>
                        </div>
                        <div className="text-right">
                            <p className="font-medium">{formatPrice(product.total_price || 0)}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-right space-y-1 ml-auto">
            <div className="text-sm text-muted-foreground">
              <span>Total Servicios: {formatPrice(totalServices)}</span>
              <span className="ml-2">+ Productos: {formatPrice(totalProducts)}</span>
            </div>
            <div className="text-lg font-bold">
              Total: {formatPrice(grandTotal)}
            </div>
          </div>
        </div>

        {attention.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notas:</span>
            <p>{attention.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          {!['Cancelada', 'Pagada'].includes(attention.status) && (
            <AddServiceDialog 
              attentionId={attention.id}
            >
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Añadir Servicio
              </Button>
            </AddServiceDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ServiceCardProps {
  service: AttentionService;
  isFirst: boolean;
  formatPrice: (price: number) => string;
  onServiceSelect: (service: AttentionService) => void;
  getServiceStatusBadge: (status: string, attentionStatus: string) => JSX.Element;
  attentionStatus: string;
}

const ServiceCard = ({ service, isFirst, formatPrice, onServiceSelect, getServiceStatusBadge, attentionStatus }: ServiceCardProps) => {
  const canStartService = attentionStatus === 'En Proceso' && service.status === 'Pendiente';
  const canManageService = attentionStatus === 'En Proceso' && (service.status === 'En Proceso' || service.status === 'Completado');
  const userName = `${service.users?.first_name || ''} ${service.users?.last_name || ''}`.trim();

  return (
    <div className={`relative pl-8 ${!isFirst ? 'pt-4' : ''}`}>
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>
      <div className="absolute left-4 top-2 w-3 h-3 bg-muted-foreground rounded-full -translate-x-1/2"></div>

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="font-medium">{service.services?.name || 'Servicio no encontrado'}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {userName || 'Usuario no asignado'}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {formatPrice(service.service_price || 0)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getServiceStatusBadge(service.status, attentionStatus)}
          {(canStartService || canManageService) && (
            <Button size="sm" variant="outline" onClick={() => onServiceSelect(service)}>
              {service.status === 'Pendiente' ? 'Iniciar' : 'Gestionar'}
            </Button>
          )}
        </div>
      </div>
      {service.notes && (
        <p className="text-sm text-muted-foreground mt-1">Notas: {service.notes}</p>
      )}
    </div>
  );
};