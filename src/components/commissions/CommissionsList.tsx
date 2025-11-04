import React, { useState, useMemo, useEffect } from 'react';
import { subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal } from 'lucide-react';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { useCommissionsLogic } from '@/hooks/useCommissionsLogic';
import { useSchedulableUsers } from '@/hooks/useSchedulableUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantUsers } from '@/hooks/useTenantUsers';
import { SettleCommissionsDialog } from './SettleCommissionsDialog';
import { VoidCommissionDialog } from './VoidCommissionDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DatePickerButtonInput from "../DatePickerButtonInput";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CommissionCard } from './CommissionCard';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'earned', label: 'Devengado' },
  { value: 'processing', label: 'En Proceso' },
  { value: 'paid', label: 'Pagado' },
  { value: 'voided', label: 'Anulado' },
];

const STATUS_CONFIG = {
  earned: { label: 'Devengado', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  processing: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  voided: { label: 'Anulado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const ITEMS_PER_PAGE = 10;

const CommissionCardSkeleton = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );

const CommissionTableSkeleton = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead className="w-[40px]"><Skeleton className="h-4 w-4" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-20" /></TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
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

export const CommissionsList = () => {
  const { formatPrice } = usePriceFormat();

  const { currentAssignment } = useAuth();
  const { 
    commissions, 
    isLoading, 
    error, 
    setFilters, 
    handleSettleSelected, 
    handleVoidClick, 
    settleDialogState,
    voidDialogState,
    onSettleConfirm,
    onVoidConfirm,
    setSettleDialogState,
    setVoidDialogState,
  } = useCommissionsLogic();
  const { data: users } = useSchedulableUsers();
  
  
  // State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({ from: subMonths(new Date(), 1), to: new Date() });
  const [status, setStatus] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState('all');

  const isAdmin = currentAssignment?.role_name === 'tenant_super_admin' || currentAssignment?.role_name === 'tenant_admin';

  // Effects
  useEffect(() => {
    setFilters({
      dateRange: {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      },
      status: status === 'all' ? undefined : status,
      userId: selectedUserId === 'all' ? undefined : selectedUserId,
    });
  }, [dateRange, status, selectedUserId, setFilters]);

  // Memoized data for pagination
  const paginatedCommissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return commissions?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [];
  }, [commissions, currentPage]);

  const totalPages = Math.ceil((commissions?.length || 0) / ITEMS_PER_PAGE);

  // Handlers
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allEarnedIds = commissions?.filter(c => c.status === 'earned').map(c => c.id) || [];
      setSelectedIds(allEarnedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleRowSelect = (commissionId: string) => {
    setSelectedIds(prev => 
      prev.includes(commissionId) 
        ? prev.filter(id => id !== commissionId) 
        : [...prev, commissionId]
    );
  };

  const onSettleClick = () => {
    const selectedCommissions = commissions?.filter(c => selectedIds.includes(c.id)) || [];
    handleSettleSelected(selectedCommissions);
    setSelectedIds([]);
  };

  if (isLoading) {
    return (
      <>
        <div className="md:hidden space-y-4">{[...Array(5)].map((_, i) => <CommissionCardSkeleton key={i} />)}</div>
        <div className="hidden md:block rounded-md border"><CommissionTableSkeleton /></div>
      </>
    );
  }

  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {/* Filters Section */}
          <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 p-4 border rounded-lg`}>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Rango de Fechas</label>
              <div className="flex items-center gap-2">
                <DatePicker selectsStart startDate={dateRange.from} endDate={dateRange.to} selected={dateRange.from} onChange={(date) => setDateRange(prev => ({ ...prev, from: date ?? undefined }))} locale="es" dateFormat="dd/MM/yyyy" customInput={<DatePickerButtonInput />} wrapperClassName="w-full" />
                <DatePicker selectsEnd startDate={dateRange.from} endDate={dateRange.to} selected={dateRange.to} minDate={dateRange.from} onChange={(date) => setDateRange(prev => ({ ...prev, to: date ?? undefined }))} locale="es" dateFormat="dd/MM/yyyy" customInput={<DatePickerButtonInput />} wrapperClassName="w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                      {STATUS_FILTERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
              </Select>
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

          {/* Action Buttons */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button onClick={onSettleClick} disabled={selectedIds.length === 0}>
                Liquidar Seleccionadas ({selectedIds.length})
              </Button>
            </div>
          )}

          {/* Content Section */}
          <div className="md:hidden space-y-4">
            {paginatedCommissions.length > 0 ? (
              paginatedCommissions.map((commission) => (
                                                                      <CommissionCard 
                                                                        key={commission.id} 
                                                                        commission={commission} 
                                                                        onVoidClick={handleVoidClick} 
                                                                        isAdmin={isAdmin} 
                                                                        formatPrice={formatPrice} 
                                                                        statusConfig={STATUS_CONFIG[commission.status as keyof typeof STATUS_CONFIG] || { label: commission.status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle }}
                                                                        onRowSelect={handleRowSelect}
                                                                        isSelected={selectedIds.includes(commission.id)}
                                                                        canSelect={commission.status === 'earned'}
                                                                      />              ))
            ) : (
              <div className="text-center py-8">No hay resultados.</div>
            )}
          </div>
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectedIds.length > 0 && selectedIds.length === commissions?.filter(c => c.status === 'earned').length}
                      onCheckedChange={handleSelectAll} 
                    />
                  </TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCommissions.length > 0 ? (
                                    paginatedCommissions.map((commission) => {
                                      const StatusIcon = STATUS_CONFIG[commission.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
                                      return (
                                        <TableRow key={commission.id}>
                                          <TableCell>
                                            <Checkbox 
                                              checked={selectedIds.includes(commission.id)}
                                              onCheckedChange={() => handleRowSelect(commission.id)}
                                              disabled={commission.status !== 'earned'}
                                            />
                                          </TableCell>
                                          <TableCell>{new Date(commission.created_at).toLocaleDateString()}</TableCell>
                                          <TableCell>{commission.user.full_name}</TableCell>
                                          <TableCell>{commission.branch.name}</TableCell>
                                          <TableCell>{formatPrice(commission.commission_amount)}</TableCell>
                                          <TableCell>
                                            <Badge className={STATUS_CONFIG[commission.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-800'}>
                                              <StatusIcon className="w-3 h-3 mr-1" />
                                              {STATUS_CONFIG[commission.status as keyof typeof STATUS_CONFIG]?.label || commission.status}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {isAdmin && commission.status === 'earned' && (
                                               <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem className="text-red-600" onClick={() => handleVoidClick(commission)}>Anular</DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">No hay resultados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Section */}
          <div className="flex items-center justify-center space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || totalPages === 0}>Anterior</Button>
            <span className="text-sm">Página {totalPages === 0 ? 0 : currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
          </div>
      <SettleCommissionsDialog 
        open={settleDialogState.open}
        onOpenChange={(open) => setSettleDialogState(prev => ({ ...prev, open }))}
        onConfirm={onSettleConfirm}
        commissionCount={settleDialogState.commissionsToSettle.length}
        totalAmount={settleDialogState.commissionsToSettle.reduce((acc, comm) => acc + comm.commission_amount, 0)}
        professionalName={settleDialogState.commissionsToSettle[0]?.user.full_name || ''}
      />
      <VoidCommissionDialog
        open={voidDialogState.open}
        onOpenChange={(open) => setVoidDialogState(prev => ({ ...prev, open }))}
        onConfirm={onVoidConfirm}
        commissionAmount={voidDialogState.commissionToVoid?.commission_amount || 0}
      />
    </div>
  );
};