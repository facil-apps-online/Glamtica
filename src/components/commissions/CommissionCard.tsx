import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CommissionCardProps {
  commission: EarnedCommission;
  onVoidClick: (commission: EarnedCommission) => void;
  isAdmin: boolean;
  formatPrice: (price: number) => string;
  statusConfig: { label: string; color: string; icon: React.ElementType };
  onRowSelect: (commissionId: string) => void;
  isSelected: boolean;
  canSelect: boolean;
}

export const CommissionCard: React.FC<CommissionCardProps> = ({ commission, onVoidClick, isAdmin, formatPrice, statusConfig, onRowSelect, isSelected, canSelect }) => {
  const StatusIcon = statusConfig.icon;
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => onRowSelect(commission.id)}
              disabled={!canSelect}
            />
            <CardTitle>{commission.user.full_name}</CardTitle>
          </div>
          {isAdmin && commission.status === 'earned' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600" onClick={() => onVoidClick(commission)}>Anular</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Monto</span>
          <span>{formatPrice(commission.commission_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fecha</span>
          <span>{new Date(commission.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sucursal</span>
          <span>{commission.branch.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estado</span>
          <Badge className={statusConfig.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};