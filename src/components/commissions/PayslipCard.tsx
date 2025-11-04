import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Payslip } from '@/hooks/usePayslips';

const STATUS_CONFIG = {
  pending_signature: { label: 'Pendiente de Firma', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

interface PayslipCardProps {
  payslip: Payslip;
  onSignClick: (payslip: Payslip) => void;
  onViewClick: (payslip: Payslip) => void;
  currentUserId?: string;
  formatPrice: (price: number) => string;
}

export const PayslipCard: React.FC<PayslipCardProps> = ({ payslip, onSignClick, onViewClick, currentUserId, formatPrice }) => {
  const statusConfig = STATUS_CONFIG[payslip.status as keyof typeof STATUS_CONFIG] || { label: payslip.status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{payslip.user.full_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Monto Total</span>
          <span>{formatPrice(payslip.total_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fecha</span>
          <span>{new Date(payslip.payslip_date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground">Estado</span>
          <Badge className={statusConfig.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="pt-2">
          {currentUserId === payslip.user_id && payslip.status === 'pending_signature' ? (
            <Button onClick={() => onSignClick(payslip)} className="w-full">Revisar y Firmar</Button>
          ) : (
            <Button variant="outline" onClick={() => onViewClick(payslip)} className="w-full">Ver Comprobante</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};