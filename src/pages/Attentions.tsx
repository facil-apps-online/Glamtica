import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, User, Scissors, Phone, DollarSign, LayoutList, CalendarDays, Trash2, Package, Edit, CheckCircle, CreditCard, Calendar as CalendarIcon, Receipt, Eye, Loader2 } from "lucide-react";
import { callTenantAction } from '@/lib/tenantActions';
import { TransactionReceiptDialog } from '@/components/TransactionReceiptDialog';
import { useSaleDetails } from '@/hooks/useSaleDetails';
import { useUpdateAttentionStatus } from "@/hooks/useUpdateAttentionStatus";
import { useAttentions, Attention, AttentionService } from "@/hooks/useAttentions";
import { useUserTimeOff } from "@/hooks/useUserTimeOff";
import { useSchedulableUsers } from "@/hooks/useSchedulableUsers";
import { AttentionForm } from "@/components/AttentionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CancelAttentionDialog } from "@/components/CancelAttentionDialog";
import { RescheduleAttentionDialog } from "@/components/RescheduleAttentionDialog";
import { UserSelector } from "@/components/UserSelector";
import { AttentionDateFilter } from "@/components/AttentionDateFilter";
import { AttentionStatusFilter } from "@/components/AttentionStatusFilter";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { format, parseISO, addMinutes, startOfWeek, endOfWeek, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttentionCalendarView from "@/components/attentions/AttentionCalendarView";
import { useToast } from "@/hooks/use-toast";
import { AttentionItemCard } from "@/components/attentions/AttentionItemCard";
import { useScreenSize } from "@/hooks/useScreenSize";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { AttentionPaymentDialog } from "@/components/AttentionPaymentDialog";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { usePaymentEvidence } from "@/hooks/usePaymentEvidence";
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog";



const generateColorPalette = (count: number) => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', 
    '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef',
    '#f43f5e', '#fb923c', '#f59e0b', '#a3e635', '#4ade80',
    '#2dd4bf', '#22d3ee', '#60a5fa', '#a78bfa', '#e879f9'
  ];
  const palette = [];
  for (let i = 0; i < count; i++) {
    palette.push(colors[i % colors.length]);
  }
  return palette;
};

const AttentionCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-24" />
      </div>
    </CardContent>
  </Card>
);

export default function Attentions() {
  const screenSize = useScreenSize();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, _setDateFilter] = useState<Date | undefined>(new Date());

  const setDateFilter = useCallback((date: Date | undefined) => {
    _setDateFilter(date);
  }, []);
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  
  // State for Forms and Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAttention, setEditingAttention] = useState<Attention | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [viewingAttention, setViewingAttention] = useState<Attention | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [payingAttention, setPayingAttention] = useState<Attention | null>(null);
  const [viewingEvidenceForPaymentIds, setViewingEvidenceForPaymentIds] = useState<string[] | null>(null);


  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  const { selectedBranchId } = useBranchFilterStore();
  const { currentAssignment, tenantId } = useAuth();
  const { formatPrice } = usePriceFormat();
  const { toast } = useToast();

  const branchIdForDialog = selectedBranchId !== 'all' ? selectedBranchId : currentAssignment?.branch_id;

  const dateRange = useMemo(() => {
    if (!dateFilter) return undefined;
    const from = new Date(dateFilter);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateFilter);
    to.setHours(23, 59, 59, 999);
    if (view === 'calendar' && calendarView === 'timeGridWeek') {
      return {
        from: startOfWeek(from, { weekStartsOn: 1 }),
        to: endOfWeek(to, { weekStartsOn: 1 }),
      };
    }
    return { from, to };
  }, [view, calendarView, dateFilter]);

  const { data: attentions = [], isLoading, error } = useAttentions(
    selectedUser,
    statusFilter,
    dateRange
  );

  const { data: users = [] } = useSchedulableUsers(selectedBranchId);
  const { data: timeOffs = [] } = useUserTimeOff(
    selectedUser !== 'all' ? selectedUser : undefined,
    'approved',
    undefined,
    dateRange,
    selectedBranchId !== 'all' ? selectedBranchId : undefined,
    undefined,
    view === 'calendar'
  );
  const { data: paymentMethods } = usePaymentMethods(tenantId);

  const userColorMap = useMemo(() => {
    const palette = generateColorPalette(users.length);
    const map = new Map<string, string>();
    users.forEach((user, index) => {
      map.set(user.id, palette[index]);
    });
    return map;
  }, [users]);

  const calendarEvents = useMemo(() => {
    const groupedAttentions = attentions.reduce((acc, attention) => {
        if (!acc[attention.id]) {
            acc[attention.id] = {
                ...attention,
                attention_services: attentions
                    .filter(a => a.id === attention.id)
                    .flatMap(a => a.attention_services || [])
                    .filter((service, index, self) => index === self.findIndex((s) => s.id === service.id)),
                attention_combos: attentions
                    .filter(a => a.id === attention.id)
                    .flatMap(a => a.attention_combos || [])
                    .filter((combo, index, self) => index === self.findIndex((c) => c.id === combo.id))
            };
        }
        return acc;
    }, {} as Record<string, Attention>);

    const allEvents = Object.values(groupedAttentions).flatMap(att => {
      const attentionStartTime = new Date(att.attention_datetime);
      if (!att.attention_datetime) return [];

      const itemsToSchedule = (att.attention_services || []).map(s => {
        let duration = s.duration_minutes || 0;
        if (s.attention_combo_id) {
            const combo = att.attention_combos?.find(ac => ac.id === s.attention_combo_id);
            const comboItem = combo?.combos?.combo_items?.find(ci => ci.service_id === s.service_id);
            if (comboItem?.services?.duration_minutes) {
                duration = comboItem.services.duration_minutes;
            }
        }
        return {
            user_id: s.user_id,
            is_parallel: s.is_parallel,
            offset_minutes: s.offset_minutes,
            duration: duration,
            start_time: '',
            end_time: ''
        };
      });

      if (itemsToSchedule.length === 0) {
        // If there are no services, create a single event for the attention
        if (att.attention_products && att.attention_products.length > 0) {
          const user = users.find(u => u.id === att.attention_products[0].user_id);
          const title = `${att.clients?.name} (Productos)`;
          return [{
            id: `${att.id}-products`,
            groupId: att.id,
            title: title,
            start: attentionStartTime,
            end: addMinutes(attentionStartTime, 30), // Default duration of 30 minutes
            allDay: false,
            backgroundColor: '#71717a',
            borderColor: '#71717a',
            extendedProps: { ...att, type: 'attention' },
          }];
        }
        return [];
      }

      let timelineEndTime = new Date(attentionStartTime);
      let lastSequentialItemStartTime = new Date(attentionStartTime);

      for (let i = 0; i < itemsToSchedule.length; i++) {
          const item = itemsToSchedule[i];
          let currentStartTime;
          if (item.is_parallel) {
              currentStartTime = addMinutes(lastSequentialItemStartTime, item.offset_minutes || 0);
          } else {
              currentStartTime = new Date(timelineEndTime);
              lastSequentialItemStartTime = currentStartTime;
          }
          const endTime = addMinutes(currentStartTime, item.duration || 0);
          item.start_time = format(currentStartTime, 'HH:mm');
          item.end_time = format(endTime, 'HH:mm');
          if (!item.is_parallel) {
              const groupEndTimes = [endTime];
              let j = i - 1;
              while (j >= 0 && itemsToSchedule[j].is_parallel) {
                  const prevItem = itemsToSchedule[j];
                  const [prevEndHours, prevEndMinutes] = prevItem.end_time.split(':').map(Number);
                  if (!isNaN(prevEndHours) && !isNaN(prevEndMinutes)) {
                      let prevEndTimeDate = setHours(setMinutes(new Date(attentionStartTime), prevEndMinutes), prevEndHours);
                      if (prevEndTimeDate < attentionStartTime) {
                        prevEndTimeDate.setDate(prevEndTimeDate.getDate() + 1);
                      }
                      groupEndTimes.push(prevEndTimeDate);
                  }
                  j--;
              }
              timelineEndTime = new Date(Math.max(...groupEndTimes.map(d => d.getTime())));
          }
      }

      const servicesByUser = itemsToSchedule.reduce((acc, item) => {
        if (!item.user_id) return acc;
        if (!acc[item.user_id]) {
          acc[item.user_id] = [];
        }
        acc[item.user_id].push(item);
        return acc;
      }, {} as Record<string, typeof itemsToSchedule>);

      return Object.entries(servicesByUser).map(([userId, userServices]) => {
        const userStartTimes = userServices.map(s => {
          const [h, m] = s.start_time.split(':').map(Number);
          let date = setHours(setMinutes(new Date(attentionStartTime), m), h);
          if (date < attentionStartTime) date.setDate(date.getDate() + 1);
          return date;
        });
        const userEndTimes = userServices.map(s => {
          const [h, m] = s.end_time.split(':').map(Number);
          let date = setHours(setMinutes(new Date(attentionStartTime), m), h);
          if (date < attentionStartTime) date.setDate(date.getDate() + 1);
          return date;
        });

        const start = new Date(Math.min(...userStartTimes.map(d => d.getTime())));
        const end = new Date(Math.max(...userEndTimes.map(d => d.getTime())));
        const user = users.find(u => u.id === userId);
        const title = `${att.clients?.name} (${userServices.length} serv.)`;

        return {
          id: `${att.id}-${userId}`,
          groupId: att.id,
          title: title,
          start,
          end,
          allDay: false,
          backgroundColor: userColorMap.get(userId) || '#71717a',
          borderColor: userColorMap.get(userId) || '#71717a',
          extendedProps: { ...att, type: 'attention' },
        };
      });
    });

    const timeOffEvents = timeOffs.map(to => ({
      id: to.id!,
      title: `${to.user_name} - Ausente (${to.type})`,
      start: to.start_date,
      end: to.end_date,
      allDay: true,
      display: 'background',
      backgroundColor: '#d4d4d8',
      extendedProps: { ...to, type: 'time_off' },
    }));

    return [...allEvents.flat(), ...timeOffEvents];
  }, [attentions, timeOffs, userColorMap, users]);

  const handleDateSelect = (selectionInfo: any) => {
    if (!branchIdForDialog) {
      toast({ title: "Selecciona una sucursal", description: "Debes seleccionar una sucursal para crear una atención.", variant: "destructive" });
      return;
    }
    setInitialDate(selectionInfo.start);
    setEditingAttention(null);
    setIsFormOpen(true);
  };

  const handleEventClick = (eventInfo: any) => {
    if (eventInfo.event.extendedProps.type === 'attention') {
      const attentionId = eventInfo.event.groupId;
      const fullAttentionData = attentions.find(att => att.id === attentionId);
      if (fullAttentionData) {
        setViewingAttention(fullAttentionData);
        setIsDetailDialogOpen(true);
      }
    }
  };

  const handleNewAttentionClick = () => {
    setInitialDate(new Date());
    setEditingAttention(null);
    setIsFormOpen(true);
  };

  const handleEditAttention = (attention: Attention) => {
    setEditingAttention(attention);
    setIsFormOpen(true);
  };

  const handleEditFromDetailView = () => {
    if (viewingAttention) {
      setEditingAttention(viewingAttention);
      setIsDetailDialogOpen(false);
      setIsFormOpen(true);
    }
  };

  const handleOpenPaymentDialog = (attention: Attention) => {
    setPayingAttention(attention);
    setIsPaymentDialogOpen(true);
  };
  
  const handleOpenPaymentDetails = (attention: Attention) => {
    setViewingPaymentsFor(attention);
  };

  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const NewAttentionButton = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button
              onClick={handleNewAttentionClick}
              disabled={!branchIdForDialog}
              className="inline-flex items-center"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Nueva Atención</span>
            </Button>
          </span>
        </TooltipTrigger>
        {!branchIdForDialog && (
          <TooltipContent>
            <p>Selecciona una sucursal para poder crear una atención.</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Atenciones"
        subtitle="Gestiona y programa las citas de tus clientes."
      >
        {NewAttentionButton}
      </PageHeader>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95%] max-h-[90vh] md:max-w-4xl flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingAttention ? 'Editar Atención' : 'Nueva Atención'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto -mx-6 px-6">
            <AttentionForm
              key={editingAttention?.id || 'new'}
              branchId={branchIdForDialog}
              onFinished={() => setIsFormOpen(false)}
              initialDate={initialDate}
              attention={editingAttention}
              screenSize={screenSize}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <TooltipProvider>
          <DialogContent className="max-w-2xl w-[95%] max-h-[90vh] md:w-full md:max-h-fit">
            <DialogHeader>
              <DialogTitle>Detalle de la Atención</DialogTitle>
            </DialogHeader>
            {viewingAttention && (
              <>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                  <AttentionCard
                    attention={viewingAttention}
                    formatPrice={formatPrice}
                    onEdit={handleEditFromDetailView}
                    onOpenPaymentDialog={handleOpenPaymentDialog}
                    screenSize={screenSize}
                    branchId={viewingAttention.branch_id}
                  />
                </div>
                <DialogFooter className="pt-4 gap-2">
                  <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Cerrar</Button>
                  <Button onClick={handleEditFromDetailView}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </TooltipProvider>
      </Dialog>

      <AttentionPaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        attention={payingAttention}
      />



      {viewingEvidenceForPaymentIds && (
          <EvidencePreview paymentIds={viewingEvidenceForPaymentIds} onClose={() => setViewingEvidenceForPaymentIds(null)} />
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <AttentionDateFilter 
              selectedDate={dateFilter} 
              onDateChange={setDateFilter} 
              selectedUserId={selectedUser}
            />
            <UserSelector selectedUserId={selectedUser} onUserChange={setSelectedUser} users={users} label="Profesionales" />
            <AttentionStatusFilter selectedStatus={statusFilter} onStatusChange={setStatusFilter} />
          </div>
        </CardContent>
      </Card>

      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')} className="w-full">
        <TabsList className={`grid grid-cols-2 ${screenSize === 'mobile' ? 'w-full' : 'w-[300px]'}`}>
          <TabsTrigger value="list"><LayoutList className="w-4 h-4 mr-2"/>Lista</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="w-4 h-4 mr-2"/>Calendario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <AttentionCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center text-red-600">Error: {error.message}</div>
          ) : (
            <div className="space-y-4">
              {attentions.length > 0 ? (
                attentions.map((attention) => (
                  <AttentionCard 
                    key={attention.id} 
                    attention={attention} 
                    formatPrice={formatPrice} 
                    onEdit={handleEditAttention} 
                    onOpenPaymentDialog={handleOpenPaymentDialog}
                    screenSize={screenSize} 
                    branchId={attention.branch_id} 
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No hay atenciones programadas.</p>
                    <div className="mt-4">
                      {NewAttentionButton}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <AttentionCalendarView 
            events={calendarEvents}
            initialView={screenSize === 'mobile' ? 'timeGridDay' : calendarView}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            onDateChange={setDateFilter}
            onViewChange={setCalendarView}
            currentDate={dateFilter}
            isLoading={isLoading}
            userColorMap={userColorMap}
            allUsers={users}
            screenSize={screenSize}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// MODIFICACIÓN: Componente para previsualizar la evidencia de un pago
const EvidencePreview: React.FC<{ paymentIds: string[]; onClose: () => void; }> = ({ paymentIds, onClose }) => {
    const { data: evidences, isLoading } = usePaymentEvidence(paymentIds);
    const [isPreviewOpen, setIsPreviewOpen] = useState(true);

    const handleClose = () => {
        setIsPreviewOpen(false);
        onClose();
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded">Cargando evidencia...</div>
            </div>
        );
    }

    if (!evidences || evidences.length === 0) {
        return (
          <Dialog open={true} onOpenChange={handleClose}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sin Evidencia</DialogTitle>
              </DialogHeader>
              <p>No se encontró evidencia de pago para esta transacción.</p>
              <DialogFooter>
                <Button onClick={handleClose}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
    }

    return (
        <ImagePreviewDialog
            isOpen={isPreviewOpen}
            onClose={handleClose}
            imageUrls={evidences.map(e => e.google_drive_file_id)}
        />
    );
};

const ViewTransactionButton = ({ attentionId }: { attentionId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const { data: sale, isLoading: isLoadingSaleId } = useQuery({
    queryKey: ['sale_by_attention', attentionId],
    queryFn: async () => {
      const data = await callTenantAction('get_sale_by_attention_id', { attentionId });
      return data as { id: string };
    },
    enabled: enabled,
  });

  const saleId = sale?.id;

  const { data: saleData, isLoading: isLoadingSaleDetails } = useSaleDetails(saleId || null);

  const handleClick = () => {
    setEnabled(true);
    setIsOpen(true);
  };

  const isLoading = isLoadingSaleId || isLoadingSaleDetails;

  return (
    <>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleClick} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4 text-green-500" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ver Recibo y Pagos</p>
        </TooltipContent>
      </Tooltip>
      <TransactionReceiptDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        saleData={saleData}
      />
    </>
  );
};

interface AttentionCardProps {
  attention: Attention;
  formatPrice: (price: number) => string;
  onEdit: (attention: Attention) => void;
  onOpenPaymentDialog: (attention: Attention) => void;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  branchId: string;
}

const AttentionCard = ({ attention, formatPrice, onEdit, onOpenPaymentDialog, screenSize, branchId }: Omit<AttentionCardProps, 'onOpenPaymentDetails'>) => {
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const updateStatusMutation = useUpdateAttentionStatus();

  const attentionDate = useMemo(() => {
    if (!attention.attention_datetime) return null;
    const date = parseISO(attention.attention_datetime);
    return !isNaN(date.getTime()) ? date : null;
  }, [attention.attention_datetime]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmada':
        return <Badge variant="default" className="bg-blue-500">Confirmada</Badge>;
      case 'En Proceso':
        return <Badge variant="default" className="bg-yellow-500">En Proceso</Badge>;
      case 'Finalizada':
        return <Badge variant="default" className="bg-green-500">Finalizada</Badge>;
      case 'Cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'Pagada':
        return <Badge variant="default" className="bg-purple-500">Pagada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };



  const standaloneServices = attention.attention_services?.filter(s => !s.attention_combo_id) || [];
  const standaloneProducts = attention.attention_products?.filter(p => !p.attention_combo_id) || [];

  const totalServices = standaloneServices.reduce((sum, s) => sum + (s.service_price || 0), 0);
  const totalProducts = standaloneProducts.reduce((sum, p) => sum + (p.total_price || 0), 0);
  const totalCombos = attention.attention_combos?.reduce((sum, c) => sum + (c.price || 0) * (c.quantity || 1), 0) || 0;
  const grandTotal = totalServices + totalProducts + totalCombos;

  const hasCombos = attention.attention_combos && attention.attention_combos.length > 0;
  const hasServices = standaloneServices.length > 0;
  const hasProducts = standaloneProducts.length > 0;

  const hasAnyServices = standaloneServices.length > 0 || attention.attention_combos?.some(combo => combo.attention_services && combo.attention_services.length > 0);

  // Logic for action buttons
  const canCompleteAttention = useMemo(() => {
    if (attention.status !== 'En Proceso') return false;
    const allServices = attention.attention_services || [];
    if (allServices.length === 0) return true; // Can complete an attention with no services (e.g., only products)
    return allServices.every(s => s.status === 'Finalizado');
  }, [attention.status, attention.attention_services]);

  const canPayAttention = useMemo(() => {
    // Always allow payment if attention is Finalizada
    if (attention.status === 'Finalizada') {
      return true;
    }

    // Allow payment if no services and status is Pendiente or Confirmada
    if (!hasAnyServices && (attention.status === 'Pendiente' || attention.status === 'Confirmada')) {
      return true;
    }

    return false;
  }, [attention.status, hasAnyServices]);
  const canBeModified = (attention.status === 'Pendiente' || attention.status === 'Confirmada') && hasAnyServices;
  const canBeDeleted = attention.status === 'Pendiente' || attention.status === 'Confirmada';

  const handleUpdateStatus = (newStatus: 'Finalizada' | 'Pagada') => {
    updateStatusMutation.mutate({ attentionId: attention.id, newStatus });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg text-primary">{attention.clients?.name || 'Cliente no asignado'}</CardTitle>
            <div className={`flex flex-wrap items-start gap-x-4 gap-y-1 text-sm text-muted-foreground`}>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {attentionDate ? format(attentionDate, "dd 'de' MMMM, yyyy", { locale: es }) : 'Fecha inválida'}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {attentionDate ? format(attentionDate, "HH:mm") : ''}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {attention.clients?.phone || 'N/A'}
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2`}>
            {getStatusBadge(attention.status)}

            {attention.status === 'Pagada' && (
              <ViewTransactionButton attentionId={attention.id} />
            )}

                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(attention)}>
                            <Edit className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ver / Editar Detalles</p>
                    </TooltipContent>
                </Tooltip>

            {canBeModified && (
              <RescheduleAttentionDialog attention={attention}>
                <Button variant="ghost" size="icon">
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </RescheduleAttentionDialog>
            )}
            {canBeDeleted && (
              <CancelAttentionDialog attentionId={attention.id} clientName={attention.clients?.name || ''}>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </CancelAttentionDialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
            {hasCombos && (
                <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><Package className="w-4 h-4" />Combos</h4>
                    {attention.attention_combos.map((combo, index) => {
                        const comboServices = attention.attention_services?.filter(s => s.attention_combo_id === combo.id) || [];
                        const comboProducts = attention.attention_products?.filter(p => p.attention_combo_id === combo.id) || [];

                        return (
                            <div key={combo.id}>
                                <AttentionItemCard
                                    id={combo.id}
                                    type="combo"
                                    name={`${combo.combos?.name || 'Combo no encontrado'}`}
                                    price={combo.price || 0}
                                    quantity={combo.quantity}
                                    assignedTo={`${combo.users?.first_name || ''} ${combo.users?.last_name || ''}`.trim() || 'No asignado'}
                                    isFirst={index === 0}
                                    attentionStatus={attention.status}
                                    details={[]}
                                    status={combo.status as any}
                                    screenSize={screenSize}
                                    branchId={branchId}
                                />
                                <div className="pl-8">
                                    {comboServices.map((service, serviceIndex) => (
                                        <AttentionItemCard
                                            key={service.id}
                                            id={service.id}
                                            type="service"
                                            name={service.services?.name || 'Servicio no encontrado'}
                                            price={0}
                                            assignedTo={`${service.users?.first_name || ''} ${service.users?.last_name || ''}`.trim() || 'No asignado'}
                                            status={service.status as any}
                                            statusHistory={service.status_history}
                                            isFirst={serviceIndex === 0}
                                            notes={service.notes}
                                            attentionStatus={attention.status}
                                            is_parallel={service.is_parallel}
                                            screenSize={screenSize}
                                            branchId={branchId}
                                        />
                                    ))}
                                    {comboProducts.map((product, productIndex) => (
                                        <AttentionItemCard
                                            key={product.id}
                                            id={product.id}
                                            type="product"
                                            name={product.products?.name || 'Producto no encontrado'}
                                            price={0}
                                            quantity={product.quantity}
                                            assignedTo={`${product.users?.first_name || ''} ${product.users?.last_name || ''}`.trim() || 'No asignado'}
                                            isFirst={productIndex === 0 && comboServices.length === 0}
                                            attentionStatus={attention.status}
                                            screenSize={screenSize}
                                            branchId={branchId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {hasServices && (
                <div className={`space-y-3 ${hasCombos ? 'pt-4 border-t' : ''}`}>
                    <h4 className="font-medium flex items-center gap-2"><Scissors className="w-4 h-4" />Servicios</h4>
                    {standaloneServices.map((service, index) => {
                        return (
                            <AttentionItemCard
                                key={service.id}
                                id={service.id}
                                type="service"
                                name={service.services?.name || 'Servicio no encontrado'}
                                price={service.service_price || 0}
                                assignedTo={`${service.users?.first_name || ''} ${service.users?.last_name || ''}`.trim() || 'No asignado'}
                                status={service.status as any}
                                statusHistory={service.status_history}
                                isFirst={index === 0}
                                notes={service.notes}
                                attentionStatus={attention.status}
                                is_parallel={service.is_parallel}
                                screenSize={screenSize}
                                branchId={branchId}
                            />
                        );
                    })}
                </div>
            )}

            {hasProducts && (
                <div className={`space-y-3 ${hasCombos || hasServices ? 'pt-4 border-t' : ''}`}>
                    <h4 className="font-medium flex items-center gap-2"><Package className="w-4 h-4" />Productos</h4>
                    {standaloneProducts.map((product, index) => (
                        <AttentionItemCard
                            key={product.id}
                            id={product.id}
                            type="product"
                            name={product.products?.name || 'Producto no encontrado'}
                            price={product.unit_price || 0}
                            quantity={product.quantity}
                            isFirst={index === 0}
                            attentionStatus={attention.status}
                            assignedTo={`${product.users?.first_name || ''} ${product.users?.last_name || ''}`.trim() || 'No asignado'}
                            screenSize={screenSize}
                            branchId={branchId}
                        />
                    ))}
                </div>
            )}
        </div>

        <div className={`flex ${isMobile ? 'flex-col items-end' : 'items-center justify-between'} pt-2 border-t`}>
          <div className="flex-grow">
            {canCompleteAttention && (
              <Button 
                onClick={() => handleUpdateStatus('Finalizada')}
                disabled={updateStatusMutation.isPending}
                size="sm" 
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalizar Atención
              </Button>
            )}
            {canPayAttention && (
              <Button 
                onClick={() => onOpenPaymentDialog({ ...attention, total_amount: grandTotal })}
                disabled={updateStatusMutation.isPending}
                size="sm"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Registrar Pago
              </Button>
            )}
          </div>
          <div className={`${isMobile ? 'w-full text-right mt-4' : 'ml-auto'} space-y-1`}>
            <div className={`text-sm text-muted-foreground ${isMobile ? 'flex flex-col items-end' : ''}`}>
              <span>Total Servicios: {formatPrice(totalServices)}</span>
              <span className={!isMobile ? 'ml-2' : ''}>+ Productos: {formatPrice(totalProducts)}</span>
              <span className={!isMobile ? 'ml-2' : ''}>+ Combos: {formatPrice(totalCombos)}</span>
            </div>
            <div className="text-lg font-bold text-right">
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
      </CardContent>
    </Card>
  );
};