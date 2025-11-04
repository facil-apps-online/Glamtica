import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Payslip } from '@/hooks/usePayslips';
import { usePayslipEvidence } from '@/hooks/usePayslipEvidence';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from 'lucide-react';
import { usePayslipCommissionDetails } from '@/hooks/usePayslipCommissionDetails';
import { useAuth } from '@/contexts/AuthContext';
import { generatePayslipPDF } from '@/lib/pdfGenerator';

interface ViewPayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: Payslip | null;
}

const STATUS_CONFIG = {
  pending_signature: { label: 'Pendiente de Firma', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export const ViewPayslipDialog: React.FC<ViewPayslipDialogProps> = ({ 
  open, 
  onOpenChange, 
  payslip
}) => {
  const { formatPrice } = usePriceFormat();
  const { session } = useAuth();
  const { data: evidence, isLoading: isLoadingEvidence } = usePayslipEvidence(payslip?.id);
  const { displayUrl: signatureDisplayUrl, isLoading: isLoadingSignature } = useGoogleDriveImage(evidence?.google_drive_file_id);
  const [shouldFetchDetails, setShouldFetchDetails] = useState(false);
  const { data: payslipDetails, isFetching: isFetchingDetails } = usePayslipCommissionDetails(shouldFetchDetails ? payslip?.id : undefined);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const StatusIcon = payslip ? STATUS_CONFIG[payslip.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle : null;

  const handleGeneratePDF = useCallback(() => {
    setShouldFetchDetails(true);
  }, []);

  React.useEffect(() => {
    const generate = async () => {
      if (payslipDetails && session?.access_token) {
        setIsGeneratingPDF(true);
        await generatePayslipPDF(payslipDetails, session.access_token, formatPrice);
        setIsGeneratingPDF(false);
        setShouldFetchDetails(false);
      }
    };
    generate();
  }, [payslipDetails, session, formatPrice]);

  if (!payslip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comprobante de Liquidación</DialogTitle>
          <DialogDescription>
            Detalles de la liquidación de pago para <strong>{payslip.user.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Fecha:</span>
            <span>{new Date(payslip.payslip_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Monto Total:</span>
            <span className="font-bold">{formatPrice(payslip.total_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Estado:</span>
            <Badge className={STATUS_CONFIG[payslip.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-800'}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {STATUS_CONFIG[payslip.status as keyof typeof STATUS_CONFIG]?.label || payslip.status}
            </Badge>
          </div>
          {isLoadingEvidence || isLoadingSignature ? (
            <div>Cargando firma...</div>
          ) : signatureDisplayUrl ? (
            <div>
              <h4 className="font-medium mb-2">Firma</h4>
              <div className="border rounded-md p-2">
                <img src={signatureDisplayUrl} alt="Firma" className="mx-auto" />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleGeneratePDF} disabled={isFetchingDetails || isGeneratingPDF}>
            {(isFetchingDetails || isGeneratingPDF) ? 'Generando PDF...' : 'Generar PDF'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
