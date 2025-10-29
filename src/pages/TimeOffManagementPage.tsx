import React, { useState } from 'react';
import { TimeOffRequestsList } from '@/components/TimeOffRequestsList';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { subMonths } from 'date-fns';
import { TimeOffRequest } from '@/hooks/useUserTimeOff';
import DatePickerButtonInput from "@/components/DatePickerButtonInput";

registerLocale("es", es);

const TIME_OFF_TYPES = [
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'sick', label: 'Enfermedad' },
  { value: 'personal', label: 'Personal' },
  { value: 'training', label: 'Capacitación' },
  { value: 'other', label: 'Otro' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
];

const TimeOffManagementPage: React.FC = () => {
  const { currentAssignment } = useAuth();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const [activeView, setActiveView] = useState('pending');

  // History filters state
  const [selectedStatus, setSelectedStatus] = useState<TimeOffRequest['status'] | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

  const isSuperAdmin = currentAssignment?.role_name === 'tenant_super_admin';
  const canApprovePending = isSuperAdmin || currentAssignment?.role_name === 'tenant_admin';
  const canApproveHistory = false; // No se puede aprobar desde el historial

  const userIdToFetch = (isSuperAdmin || currentAssignment?.role_name === 'tenant_admin') ? undefined : currentAssignment?.user_id;

  const renderContent = (view: 'pending' | 'all') => {
    if (view === 'pending') {
      return (
        <TimeOffRequestsList 
          userId={userIdToFetch} 
          canApprove={canApprovePending} 
          statusFilter="pending"
          branchId={currentAssignment?.branch_id}
          isMobile={isMobile}
        />
      );
    } else { // view === 'all' (History)
      return (
        <TimeOffRequestsList 
          userId={userIdToFetch} 
          canApprove={canApproveHistory} 
          statusFilter={selectedStatus}
          typeFilter={selectedType !== 'all' ? selectedType : undefined}
          dateRange={{ from: startDate, to: endDate }}
          branchId={currentAssignment?.branch_id}
          searchTerm={filterSearchTerm}
          isMobile={isMobile}
        />
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <PageHeader 
          title="Ausencias"
          subtitle="Gestiona las solicitudes de ausencias de tu equipo." 
        />
        {isMobile && (
          <div className="mt-4 sm:mt-0 w-full sm:w-auto">
            <Select value={activeView} onValueChange={setActiveView}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="all">Historial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isMobile ? (
        <div className="space-y-4 mt-4">
          {activeView === 'all' ? (
            <>
              <Card className="mb-4">
                <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {isSuperAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="filterSearchTerm">Buscar Usuario</Label>
                      <Input id="filterSearchTerm" placeholder="Nombre, apellido o email" value={filterSearchTerm} onChange={(e) => setFilterSearchTerm(e.target.value)} />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="statusFilter">Estado</Label>
                      <Select value={selectedStatus} onValueChange={(value: TimeOffRequest['status'] | 'all') => setSelectedStatus(value)}>
                        <SelectTrigger id="filterSearchTerm"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                        <SelectContent>{STATUS_FILTERS.map((status) => (<SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="typeFilter">Tipo de Permiso</Label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger id="typeFilter"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {TIME_OFF_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Rango de Fechas</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-full"><DatePicker selectsStart startDate={startDate} endDate={endDate} selected={startDate} onChange={(date) => setStartDate(date ?? undefined)} locale="es" dateFormat="dd/MM/yyyy" customInput={<DatePickerButtonInput />} wrapperClassName="w-full" /></div>
                        <div className="w-full"><DatePicker selectsEnd startDate={startDate} endDate={endDate} selected={endDate} minDate={startDate} onChange={(date) => setEndDate(date ?? undefined)} locale="es" dateFormat="dd/MM/yyyy" customInput={<DatePickerButtonInput />} wrapperClassName="w-full" /></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end"><Button onClick={() => { setStartDate(subMonths(new Date(), 1)); setEndDate(new Date()); setSelectedStatus('all'); setSelectedType('all'); setFilterSearchTerm(''); }}>Limpiar</Button></div>
                </CardContent>
              </Card>
              {renderContent('all')}
            </>
          ) : (
            renderContent('pending')
          )}
        </div>
      ) : (
        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="all">Historial</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="pending">
            {renderContent('pending')}
          </TabsContent>
          <TabsContent value="all" className="mt-4 space-y-4">
            <>
              <Card>
                <CardHeader><CardTitle>Filtros del Historial</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {isSuperAdmin && (<div className="space-y-2"><Label htmlFor="filterSearchTermDesktop">Buscar Usuario</Label><Input id="filterSearchTermDesktop" placeholder="Nombre, apellido o email" value={filterSearchTerm} onChange={(e) => setFilterSearchTerm(e.target.value)} /></div>)}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="statusFilterDesktop">Estado</Label>
                      <Select value={selectedStatus} onValueChange={(value: TimeOffRequest['status'] | 'all') => setSelectedStatus(value)}>
                        <SelectTrigger id="filterSearchTermDesktop"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                        <SelectContent>{STATUS_FILTERS.map((status) => (<SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="typeFilterDesktop">Tipo de Permiso</Label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger id="typeFilterDesktop"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {TIME_OFF_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Rango de Fechas</Label>
                      <div className="flex items-center gap-2 border rounded-md p-1">
                        <DatePicker selectsStart startDate={startDate} endDate={endDate} selected={startDate} onChange={(date) => setStartDate(date ?? undefined)} locale="es" dateFormat="dd/MM/yyyy" customInput={<DatePickerButtonInput />} wrapperClassName="w-full" />
                        <DatePicker selectsEnd startDate={startDate} endDate={endDate} selected={endDate} minDate={startDate} onChange={(date) => setEndDate(date ?? undefined)} locale="es" dateFormat="dd/MM/yyyy" customInput={<DatePickerButtonInput />} wrapperClassName="w-full" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end"><Button onClick={() => { setStartDate(subMonths(new Date(), 1)); setEndDate(new Date()); setSelectedStatus('all'); setSelectedType('all'); setFilterSearchTerm(''); }}>Limpiar</Button></div>
                </CardContent>
              </Card>
              {renderContent('all')}
            </>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TimeOffManagementPage;
