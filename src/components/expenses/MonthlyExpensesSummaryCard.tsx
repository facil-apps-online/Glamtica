import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyExpenseSummary } from '@/hooks/useMonthlyExpenseSummary';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardListItem } from "@/components/DashboardListItem"; // Reusing DashboardListItem for consistency

export function MonthlyExpensesSummaryCard() {
  const { currentAssignment, loading: authLoading } = useAuth();
  const { data: expenseSummary, isLoading, error } = useMonthlyExpenseSummary();
  const { formatPrice } = usePriceFormat();

  const isSuperAdmin = currentAssignment?.role_name === 'tenant_super_admin';
  const isAdmin = currentAssignment?.role_name === 'tenant_admin';

  if (authLoading || (!isSuperAdmin && !isAdmin)) {
    return null; // Don't render for staff/vendors or while auth is loading
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Gastos del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("Error fetching monthly expense summary:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <DollarSign className="w-5 h-5 text-red-600" />
            Gastos del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error al cargar el resumen de gastos.</div>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Gastos del Mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DashboardListItem
            icon={<CheckCircle className="w-4 h-4 text-green-600" />}
            title="Pagados"
            trailingContent={
              <p className="font-bold text-green-600">{formatPrice(expenseSummary?.paid || 0)}</p>
            }
          />
          <DashboardListItem
            icon={<Clock className="w-4 h-4 text-yellow-600" />}
            title="Pendientes"
            trailingContent={
              <p className="font-bold text-yellow-600">{formatPrice(expenseSummary?.pending || 0)}</p>
            }
          />
          <DashboardListItem
            icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
            title="Vencidos"
            trailingContent={
              <p className="font-bold text-red-600">{formatPrice(expenseSummary?.overdue || 0)}</p>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
