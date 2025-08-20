import React, { useState } from 'react';
import { TimeOffRequestsList } from '@/components/TimeOffRequestsList';
import { useAuth } from '@/contexts/AuthContext';
import { TimeOffRequest } from '@/hooks/useUserTimeOff';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'; // Add this import

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

const TimeOffHistoryPage: React.FC = () => {
  const { currentAssignment } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<TimeOffRequest['status'] | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>(''); // Para filtrar por nombre, apellido, email, etc.

  const isSuperAdmin = currentAssignment?.role_name === 'tenant_super_admin';
  const canApprove = false; // No se puede aprobar desde el historial

  // userIdToFetch will be handled by useUserTimeOff based on filterSearchTerm
  const userIdToFetch = (isSuperAdmin || currentAssignment?.role_name === 'tenant_admin') ? undefined : currentAssignment?.user_id;

  console.log("TimeOffHistoryPage - currentAssignment:", currentAssignment);
  console.log("TimeOffHistoryPage - tenantId:", currentAssignment?.tenant_id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Historial de Ausencias
          </h1>
          <p className="text-muted-foreground mt-2">
            Revisa el historial de solicitudes de ausencias.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          {isSuperAdmin && (
            <div className="space-y-2 col-span-full">
              <Label htmlFor="filterSearchTerm">Buscar Usuario</Label>
              <Input
                id="filterSearchTerm"
                placeholder="Nombre, apellido o email"
                value={filterSearchTerm}
                onChange={(e) => setFilterSearchTerm(e.target.value)}
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusFilter">Estado</Label>
              <Select value={selectedStatus} onValueChange={(value: TimeOffRequest['status'] | 'all') => setSelectedStatus(value)}>
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="typeFilter">Tipo de Permiso</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="typeFilter">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TIME_OFF_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date) => setEndDate(date)}
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
            </div>
          </div>
        <div className="flex justify-end gap-2">
            <Button onClick={() => { setStartDate(subMonths(new Date(), 1)); setEndDate(new Date()); setSelectedStatus('all'); setSelectedType('all'); setFilterSearchTerm(''); }}>Limpiar</Button>
          </div>
        </CardContent>
      </Card>

      {(userIdToFetch || isSuperAdmin || currentAssignment?.role_name === 'tenant_admin') ? (
        <TimeOffRequestsList 
          userId={userIdToFetch} 
          canApprove={canApprove} 
          statusFilter={selectedStatus}
          typeFilter={selectedType !== 'all' ? selectedType : undefined}
          dateRange={{ from: startDate, to: endDate }}
          branchId={currentAssignment?.branch_id}
          searchTerm={filterSearchTerm}
        />
      ) : (
        <p className="text-center text-muted-foreground">Selecciona un usuario o inicia sesión para ver las solicitudes.</p>
      )}
    </div>
  );
};

export default TimeOffHistoryPage;