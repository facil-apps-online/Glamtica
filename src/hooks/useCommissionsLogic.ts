import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEarnedCommissions, CommissionFilters, EarnedCommission } from '@/hooks/useEarnedCommissions';
import { SettleCommissionsDialog } from '@/components/commissions/SettleCommissionsDialog';
import { VoidCommissionDialog } from '@/components/commissions/VoidCommissionDialog';
import { invokeTenantAction } from './useTenantUsers';

// Mutation to create a payslip (settle commissions)
export const useCreatePayslip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { 
      payslip_user_id: string;
      branch_id: string;
      total_amount: number;
      payment_method: string;
      notes?: string;
      commission_ids: string[];
    }) => invokeTenantAction('create_payslip', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earned_commissions'] });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });
};

// Mutation to void a commission
export const useVoidCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { commission_id: string; reason: string }) => invokeTenantAction('void_commission', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earned_commissions'] });
    },
  });
};

// This hook will encapsulate the logic for the commissions list
export const useCommissionsLogic = () => {
  const [filters, setFilters] = useState<CommissionFilters>({});
  const { data: commissions, isLoading, error } = useEarnedCommissions(filters);
  const createPayslipMutation = useCreatePayslip();
  const voidCommissionMutation = useVoidCommission();

  // State for dialogs
  const [settleDialogState, setSettleDialogState] = useState({ open: false, commissionsToSettle: [] as EarnedCommission[] });
  const [voidDialogState, setVoidDialogState] = useState({ open: false, commissionToVoid: null as EarnedCommission | null });

  const handleSettleSelected = (selectedCommissions: EarnedCommission[]) => {
    setSettleDialogState({ open: true, commissionsToSettle: selectedCommissions });
  };

  const handleVoidClick = (commission: EarnedCommission) => {
    setVoidDialogState({ open: true, commissionToVoid: commission });
  };

  const onSettleConfirm = async () => {
    if (settleDialogState.commissionsToSettle.length === 0) return;

    const firstCommission = settleDialogState.commissionsToSettle[0];
    const totalAmount = settleDialogState.commissionsToSettle.reduce((acc, comm) => acc + comm.commission_amount, 0);

    await createPayslipMutation.mutateAsync({
      payslip_user_id: firstCommission.user_id,
      branch_id: firstCommission.branch_id,
      total_amount: totalAmount,
      commission_ids: settleDialogState.commissionsToSettle.map(c => c.id),
      payment_method: 'default', // Or allow selection in dialog
    });
    setSettleDialogState({ open: false, commissionsToSettle: [] });
  };

  const onVoidConfirm = async (reason: string) => {
    if (!voidDialogState.commissionToVoid) return;

    await voidCommissionMutation.mutateAsync({
      commission_id: voidDialogState.commissionToVoid.id,
      reason: reason,
    });
    setVoidDialogState({ open: false, commissionToVoid: null });
  };

  return {
    commissions,
    isLoading,
    error,
    filters,
    setFilters,
    handleSettleSelected,
    handleVoidClick,
    settleDialogState,
    voidDialogState,
    onSettleConfirm,
    onVoidConfirm,
    setSettleDialogState,
    setVoidDialogState,
  };
};

