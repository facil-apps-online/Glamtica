import React, { useState } from 'react';
import { TimeOffRequestsList } from '@/components/TimeOffRequestsList';
import { useAuth } from '@/contexts/AuthContext';
import { TimeOffRequest } from '@/hooks/useUserTimeOff';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/DateRangePicker";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  

  const isSuperAdmin = currentAssignment?.role_name === 'tenant_super_admin';
  const canApprove = isSuperAdmin || currentAssignment?.role_name === 'tenant_admin'; // Solo super_admin y admin pueden aprobar

  const userIdToFetch = undefined; // No user filter

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Gestión de Ausencias
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las solicitudes de ausencias de tu equipo.
          </p>
        </div>
      </div>

      

      <TimeOffRequestsList 
          userId={userIdToFetch} 
          canApprove={canApprove} 
          statusFilter="pending"
          branchId={currentAssignment?.branch_id}
        />
    </div>
  );
};

export default TimeOffManagementPage;
