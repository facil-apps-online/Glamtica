// src/components/TransfersList.tsx
import React from 'react';
import { useTransfersLogic } from '@/hooks/useTransfersLogic';
import { TransferCard } from './TransferCard';

export const TransfersList = ({ branchFilter, statusFilter }: { branchFilter: string | null, statusFilter: string | null }) => {
  const {
    transfers,
    isLoading,
    error,
    handleApproveClick,
    handleReceiveClick,
    handleViewClick,
    handleShipClick,
    handleCancelClick,
    Dialogs,
  } = useTransfersLogic(branchFilter, statusFilter);

  if (isLoading) return <div className="text-center p-8">Cargando traslados...</div>;
  if (error) return <div className="text-red-500 text-center p-8">Error al cargar traslados: {error.message}</div>;

  return (
    <>
      <div className="space-y-4 p-4">
        {transfers && transfers.length > 0 ? (
          transfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              onViewClick={handleViewClick}
              onApproveClick={handleApproveClick}
              onShipClick={handleShipClick}
              onReceiveClick={handleReceiveClick}
              onCancelClick={handleCancelClick}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay traslados registrados.
          </div>
        )}
      </div>
      <Dialogs />
    </>
  );
};
