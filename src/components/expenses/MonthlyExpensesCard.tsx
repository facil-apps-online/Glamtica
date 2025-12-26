import React from 'react';
import { DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyPaidExpenses } from '@/hooks/useMonthlyPaidExpenses';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { StatsCard } from '@/components/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';

export function MonthlyExpensesCard() {
  const { currentAssignment, loading: authLoading } = useAuth();
  const { data: totalExpenses, isLoading, error } = useMonthlyPaidExpenses();
  const { formatPrice } = usePriceFormat();

  const isSuperAdmin = currentAssignment?.role_name === 'tenant_super_admin';
  const isAdmin = currentAssignment?.role_name === 'tenant_admin';

  if (authLoading || (!isSuperAdmin && !isAdmin)) {
    return null; // Don't render for staff/vendors or while auth is loading
  }

  if (isLoading) {
    return <Skeleton className="h-[120px] w-full" />; // Use a skeleton that matches the card size
  }

  if (error) {
    console.error("Error fetching monthly paid expenses:", error);
    return (
      <StatsCard
        title="Gastos del Mes"
        value="Error"
        icon={DollarSign}
        change={error.message}
        trend="down" // Use 'down' trend to indicate an error state visually
      />
    );
  }

  return (
    <StatsCard
      title="Gastos del Mes"
      value={formatPrice(totalExpenses || 0)}
      icon={DollarSign}
      change="Pagados"
      trend="up"
    />
  );
}