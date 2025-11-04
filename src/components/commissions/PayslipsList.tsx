import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePayslipsLogic } from '@/hooks/usePayslipsLogic';
import { useSchedulableUsers } from '@/hooks/useSchedulableUsers';
import { subMonths } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DatePickerButtonInput from "../DatePickerButtonInput";
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { SignPayslipDialog } from './SignPayslipDialog';
import { ViewPayslipDialog } from './ViewPayslipDialog';
import { PayslipCard } from './PayslipCard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG = {
  pending_signature: { label: 'Pendiente de Firma', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

const PayslipCardSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between text-sm items-center">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-32" />
        </div>
        <div className="pt-2">
            <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );

const PayslipTableSkeleton = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-20" /></TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

export const PayslipsList = () => {
  const { currentAssignment, user } = useAuth();
  const { formatPrice } = usePriceFormat();
  const { 
    payslips, 
    isLoading, 
    error, 
    setFilters,
    handleSignClick,
    signDialogState,
    onSignConfirm,
    setSignDialogState,
    handleViewClick,
    viewDialogState,
    setViewDialogState,
    isSigning
  } = usePayslipsLogic();
  const { data: users } = useSchedulableUsers();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({ from: subMonths(new Date(), 1), to: new Date() });
  const [selectedUserId, setSelectedUserId] = useState('all');

  const isAdmin = currentAssignment?.role_name === 'tenant_super_admin' || currentAssignment?.role_name === 'tenant_admin';

  // Effects
  useEffect(() => {
    setFilters({
      dateRange: {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      },
      userId: selectedUserId === 'all' ? undefined : selectedUserId,
    });
  }, [dateRange, selectedUserId, setFilters]);

  // Memoized data for pagination
  const paginatedPayslips = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return payslips?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [];
  }, [payslips, currentPage]);

  const totalPages = Math.ceil((payslips?.length || 0) / ITEMS_PER_PAGE);

  // Render Logic
  if (isLoading) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="space-y-2 md:col-span-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                {isAdmin && (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                )}
            </div>
            <div className="md:hidden space-y-4">{[...Array(5)].map((_, i) => <PayslipCardSkeleton key={i} />)}</div>
            <div className="hidden md:block rounded-md border"><PayslipTableSkeleton /></div>
        </div>
    );
  }
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 p-4 border rounded-lg`}>
        <div className="space-y-2 md:col-span-1">
          <label className="text-sm font-medium">Rango de Fechas</label>
          <div className="flex items-center gap-2">
            <DatePicker selectsStart startDate={dateRange.from} endDate={dateRange.to} selected={dateRange.from} onChange={(date) => setDateRange(prev => ({ ...prev, from: date ?? undefined }))} locale="es" dateFormat="dd/MM/yyyy" customInput={<DatePickerButtonInput />} wrapperClassName="w-full" />
            <DatePicker selectsEnd startDate={dateRange.from} endDate={dateRange.to} selected={dateRange.to} minDate={dateRange.from} onChange={(date) => setDateRange(prev => ({ ...prev, to: date ?? undefined }))} locale="es" dateFormat="dd/MM/yyyy" customInput={<DatePickerButtonInput />} wrapperClassName="w-full" />
          </div>
        </div>
        {isAdmin && (
          <div className="space-y-2">
              <label className="text-sm font-medium">Profesional</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {users?.sort((a, b) => {
                        const nameA = `${a.first_name} ${a.last_name}`.trim();
                        const nameB = `${b.first_name} ${b.last_name}`.trim();
                        return nameA.localeCompare(nameB);
                      }).map(u => <SelectItem key={u.id} value={u.id}>{`${u.first_name} ${u.last_name}`.trim()}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="md:hidden space-y-4">
        {paginatedPayslips.length > 0 ? (
          paginatedPayslips.map((payslip) => (
            <PayslipCard 
              key={payslip.id}
              payslip={payslip}
              onSignClick={handleSignClick}
              onViewClick={handleViewClick}
              currentUserId={user?.id}
              formatPrice={formatPrice}
            />
          ))
        ) : (
          <div className="text-center py-8">No hay resultados.</div>
        )}
      </div>
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Monto Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayslips.length > 0 ? (
              paginatedPayslips.map((payslip) => {
                const StatusIcon = STATUS_CONFIG[payslip.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
                return (
                  <TableRow key={payslip.id}>
                    <TableCell>{new Date(payslip.payslip_date).toLocaleDateString()}</TableCell>
                    <TableCell>{payslip.user.full_name}</TableCell>
                    <TableCell>{formatPrice(payslip.total_amount)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_CONFIG[payslip.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-800'}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {STATUS_CONFIG[payslip.status as keyof typeof STATUS_CONFIG]?.label || payslip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {user?.id === payslip.user_id && payslip.status === 'pending_signature' ? (
                            <Button onClick={() => handleSignClick(payslip)}>Revisar y Firmar</Button>
                        ) : (
                            <Button variant="outline" onClick={() => handleViewClick(payslip)}>Ver Comprobante</Button>
                        )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No hay resultados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
            <span className="text-sm">Página {currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
        </div>
      )}
      <SignPayslipDialog
        open={signDialogState.open}
        onOpenChange={(open) => setSignDialogState(prev => ({ ...prev, open }))}
        onConfirm={onSignConfirm}
        payslip={signDialogState.payslipToSign}
        isSigning={isSigning}
      />
      <ViewPayslipDialog
        open={viewDialogState.open}
        onOpenChange={(open) => setViewDialogState(prev => ({ ...prev, open }))}
        payslip={viewDialogState.payslipToView}
      />
    </div>
  );
};