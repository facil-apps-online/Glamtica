import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, User, Scissors, Phone, DollarSign, Camera, ShoppingCart, Package } from "lucide-react";
import { useAttentions, Attention, AttentionService } from "@/hooks/useAttentions";
import { useSettings } from "@/hooks/useSettings";
import { useStylists } from "@/hooks/useStylists";
import { AttentionDialog } from "@/components/AttentionDialog";
import { CancelAppointmentDialog } from "@/components/CancelAppointmentDialog";
import { StylistSelector } from "@/components/StylistSelector";
import { AppointmentDateFilter } from "@/components/AppointmentDateFilter";
import { AppointmentStatusFilter } from "@/components/AppointmentStatusFilter";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ServiceSessionDialog } from "@/components/ServiceSessionDialog";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { AddServiceDialog } from "@/components/AddServiceDialog";
import { AddServiceProductDialog } from "@/components/AddServiceProductDialog";
import { useServiceProducts } from "@/hooks/useServiceProducts";

export default function Appointments() {
  const [selectedStylist, setSelectedStylist] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<AttentionService | null>(null);

  const { data: settings, isLoading: settingsLoading } = useSettings();

  // Call useAttentions and useStylists unconditionally, but enable their queries based on settingsLoading
  const { data: attentions, isLoading: attentionsLoading, error: attentionsError } = useAttentions(
    selectedStylist,
    statusFilter,
    dateFilter,
    !settingsLoading // Enable useAttentions only if settings are not loading
  );
  const { data: stylists, isLoading: stylistsLoading } = useStylists();
  const { formatPrice } = usePriceFormat();

  if (settingsLoading || attentionsLoading || stylistsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-blue-600">
          Cargando configuración, atenciones y estilistas...
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
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Agenda de Atenciones</h1>
          <AttentionDialog>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Atención
            </Button>
          </AttentionDialog>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <AppointmentDateFilter
            selectedDate={dateFilter}
            onDateChange={setDateFilter}
            selectedStylistId={selectedStylist}
          />
          <StylistSelector
            selectedStylistId={selectedStylist}
            onStylistChange={setSelectedStylist}
          />
          <AppointmentStatusFilter
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
                  {selectedStylist !== 'all' || statusFilter !== 'all' || dateFilter
                    ? 'No se encontraron atenciones con los filtros aplicados'
                    : 'Comienza creando tu primera atención'}
                </p>
                <AttentionDialog>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Atención
                  </Button>
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
    // Si la atención está cancelada, todos los servicios se consideran cancelados
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

  // Solo permitir cobro si la atención está completada
  const canCharge = attention.status === 'Completada';
  // Solo permitir cancelar si no está pagada, completada o ya cancelada Y ningún servicio ha iniciado
  const hasStartedServices = attention.attention_services?.some((service: AttentionService) => service.status === 'En Proceso' || service.status === 'Completado');
  const canCancel = !['Pagada', 'Completada', 'Cancelada'].includes(attention.status) && !hasStartedServices;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{attention.clients.name}</CardTitle>
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
                {attention.clients.phone}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(attention.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Servicios de la Atención */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Servicios
            </h4>
          </div>
          
          {attention.attention_services?.map((service: AttentionService, index: number) => (
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

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-right space-y-1 ml-auto">
            <div className="text-sm text-muted-foreground">
              <span>Total Servicios: {formatPrice(attention.attention_services?.reduce((sum: number, s: AttentionService) => sum + s.service_price, 0) || 0)}</span>
              {attention.products_total && attention.products_total > 0 && (
                <span className="ml-2">+ Productos: {formatPrice(attention.products_total)}</span>
              )}
            </div>
            <div className="text-lg font-bold">
              Total: {formatPrice(attention.grand_total || attention.total_amount)}
            </div>
          </div>
        </div>

        {/* Notas */}
        {attention.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notas:</span>
            <p>{attention.notes}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-2 border-t">
          {/* Agregar servicio adicional - solo si no está cancelada o pagada */}
          {!['Cancelada', 'Pagada'].includes(attention.status) && (
            <AddServiceDialog 
              attentionId={attention.id}
              attentionDate={attention.attention_date}
              attentionTime={attention.attention_time}
            >
              <Button size="sm" variant="outline">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Vender Producto
              </Button>
            </AddServiceDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para la tarjeta de un servicio individual
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

  return (
    <div className={`relative pl-8 ${!isFirst ? 'pt-4' : ''}`}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>
      {/* Timeline dot */}
      <div className="absolute left-4 top-2 w-3 h-3 bg-muted-foreground rounded-full -translate-x-1/2"></div>

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="font-medium">{service.services.name}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {service.stylists.name}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {formatPrice(service.service_price)}
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

      <div className="space-y-3 mt-3">
        {/* Renderizar productos del servicio si el servicio ha iniciado */}
        {(service.status === 'En Proceso' || service.status === 'Completado') && (
          <ServiceProductsList
            attentionServiceId={service.id}
            attentionId={service.attention_id}
            stylistId={service.stylist_id}
            stylistName={service.stylists.name}
            canManageService={canManageService}
            formatPrice={formatPrice}
          />
        )}

        {/* Botón para vender producto, solo si el servicio está en proceso o completado */}
        {canManageService && (
          <div className="mt-2">
            <AddServiceProductDialog
              attentionId={service.attention_id}
              attentionServiceId={service.id}
              stylistId={service.stylist_id}
              stylistName={service.stylists.name}
            >
              <Button size="sm" variant="outline">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Vender Producto
              </Button>
            </AddServiceProductDialog>
          </div>
        )}
      </div>
    </div>
  );
};


// Componente para mostrar productos vendidos en un servicio
interface ServiceProductsListProps {
  attentionServiceId: string;
  attentionId: string;
  stylistId: string;
  stylistName: string;
  canManageService: boolean;
  formatPrice: (price: number) => string;
}

const ServiceProductsList = ({ 
  attentionServiceId, 
  attentionId, 
  stylistId, 
  stylistName, 
  canManageService,
  formatPrice
}: ServiceProductsListProps) => {
  const { data: serviceProducts, isLoading } = useServiceProducts(attentionServiceId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando productos...</p>;

  if (!serviceProducts || serviceProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h6 className="text-sm font-medium flex items-center gap-2">
        <Package className="w-4 h-4" />
        Productos Vendidos
      </h6>
      <div className="space-y-2 border-l-2 pl-4 ml-1">
        {serviceProducts.map((product) => (
          <div key={product.id} className="flex justify-between items-center text-sm">
            <div>
              <p>{product.products.name} (x{product.quantity})</p>
              <p className="text-xs text-muted-foreground">Comisión: {product.commission_rate}%</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatPrice(product.total_price)}</p>
              <p className="text-xs text-green-600">+{formatPrice(product.total_price * (product.commission_rate / 100))}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
