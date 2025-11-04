import React from 'react';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettleCommissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  professionalName: string;
  totalAmount: number;
  commissionCount: number;
}

export const SettleCommissionsDialog: React.FC<SettleCommissionsDialogProps> = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  professionalName, 
  totalAmount, 
  commissionCount 
}) => {
  const { formatPrice } = usePriceFormat();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Liquidación</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de crear una liquidación de pago para <strong>{professionalName}</strong>.
            <br /><br />
            Se incluirán <strong>{commissionCount} comisiones</strong> por un monto total de <strong>{formatPrice(totalAmount)}</strong>.
            <br /><br />
            El profesional será notificado para que revise y firme el comprobante. ¿Deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
