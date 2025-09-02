// src/hooks/useTransfersLogic.tsx
import { useState } from "react";
import { useProductTransfers } from "@/hooks/useProductTransfers";
import { useShipProductTransfer } from "@/hooks/useShipProductTransfer";
import { useCancelProductTransfer } from "@/hooks/useCancelProductTransfer";
import { ApproveTransferDialog } from "@/components/ApproveTransferDialog";
import { ReceiveTransferDialog } from "@/components/ReceiveTransferDialog";
import { ViewTransferDetailsDialog } from "@/components/ViewTransferDetailsDialog";

export const useTransfersLogic = (branchFilter: string | null, statusFilter: string | null) => {
  const { data: transfers, isLoading, error } = useProductTransfers(branchFilter, statusFilter);
  const shipMutation = useShipProductTransfer();
  const cancelMutation = useCancelProductTransfer();

  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleApproveClick = (transfer: any) => {
    setSelectedTransfer(transfer);
    setIsApproveOpen(true);
  };

  const handleReceiveClick = (transfer: any) => {
    setSelectedTransfer(transfer);
    setIsReceiveOpen(true);
  };

  const handleViewClick = (transfer: any) => {
    setSelectedTransfer(transfer);
    setIsViewOpen(true);
  };

  const handleShipClick = (transfer: any) => {
    shipMutation.mutate({ transfer_id: transfer.id });
  };

  const handleCancelClick = (transfer: any) => {
    cancelMutation.mutate({ transfer_id: transfer.id });
  };

  const Dialogs = () => (
    <>
      {selectedTransfer && (
        <>
          <ApproveTransferDialog isOpen={isApproveOpen} onOpenChange={setIsApproveOpen} transfer={selectedTransfer} />
          <ReceiveTransferDialog isOpen={isReceiveOpen} onOpenChange={setIsReceiveOpen} transfer={selectedTransfer} />
          <ViewTransferDetailsDialog isOpen={isViewOpen} onOpenChange={setIsViewOpen} transfer={selectedTransfer} />
        </>
      )}
    </>
  );

  return {
    transfers,
    isLoading,
    error,
    handleApproveClick,
    handleReceiveClick,
    handleViewClick,
    handleShipClick,
    handleCancelClick,
    Dialogs,
  };
};
