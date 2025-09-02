// src/components/TransferCard.tsx
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TransferCardProps {
  transfer: any;
  onViewClick: (transfer: any) => void;
  onApproveClick: (transfer: any) => void;
  onShipClick: (transfer: any) => void;
  onReceiveClick: (transfer: any) => void;
  onCancelClick: (transfer: any) => void;
}

const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completado': return 'success';
      case 'recibido_con_incidencias': return 'yellow';
      case 'cancelado':
      case 'rechazado':
        return 'destructive';
      case 'en_transito': return 'blue';
      case 'aprobado': return 'green';
      case 'solicitado':
      default: return 'secondary';
    }
  };

export const TransferCard: React.FC<TransferCardProps> = ({ 
  transfer, 
  onViewClick,
  onApproveClick,
  onShipClick,
  onReceiveClick,
  onCancelClick 
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <span>{transfer.origin_branch?.name || "N/A"}</span>
              <ArrowRight className="w-4 h-4" />
              <span>{transfer.destination_branch?.name || "N/A"}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(transfer.transfer_date).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getStatusVariant(transfer.status)}>
            {transfer.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Items:</span>
          <span className="text-sm font-bold">{transfer.items?.length || 0}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewClick(transfer)}>Ver Detalles</DropdownMenuItem>
            {transfer.status === 'solicitado' && (
              <DropdownMenuItem onClick={() => onApproveClick(transfer)}>Aprobar/Rechazar</DropdownMenuItem>
            )}
            {transfer.status === 'aprobado' && (
              <DropdownMenuItem onClick={() => onShipClick(transfer)}>Marcar como Enviado</DropdownMenuItem>
            )}
            {transfer.status === 'en_transito' && (
              <DropdownMenuItem onClick={() => onReceiveClick(transfer)}>Recibir</DropdownMenuItem>
            )}
            {(transfer.status === 'solicitado' || transfer.status === 'aprobado') && (
              <DropdownMenuItem onClick={() => onCancelClick(transfer)}>Cancelar</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};
