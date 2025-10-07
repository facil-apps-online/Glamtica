// src/components/PurchaseCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PurchaseCardProps {
  purchase: any;
  formatPrice: (price: number) => string;
  onReceiveClick: (purchase: any) => void;
  onCancelClick: (purchase: any) => void;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'completada_con_incidencias': return 'yellow';
    case 'cancelled': return 'destructive';
    case 'draft': return 'secondary';
    default: return 'secondary';
  }
}

const getPaymentStatusVariant = (status: string) => {
  switch (status) {
    case 'pagado': return 'success';
    case 'no_pagado': return 'destructive';
    default: return 'secondary';
  }
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({ purchase, formatPrice, onReceiveClick, onCancelClick }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{purchase.supplier?.name || "N/A"}</CardTitle>
            <p className="text-sm text-muted-foreground">{purchase.branch?.name || "N/A"}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => onReceiveClick(purchase)}
                disabled={purchase.status !== 'draft' && !['completed', 'completada_con_incidencias'].includes(purchase.status)}
              >
                {purchase.status === 'draft' ? 'Ver/Recibir' : 'Ver Detalles Recepción'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onCancelClick(purchase)}
                disabled={purchase.status !== 'draft'}
              >
                Cancelar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monto Total:</span>
            <span className="text-sm font-bold">{formatPrice(purchase.total_amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Fecha:</span>
          <span className="text-sm">{new Date(purchase.purchase_date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Estado Compra:</span>
          <Badge variant={getStatusVariant(purchase.status)}>
            {purchase.status === 'draft' ? 'Borrador' :
             purchase.status === 'completed' ? 'Finalizada' :
             purchase.status === 'completada_con_incidencias' ? 'Finalizada con Incidencias' :
             purchase.status === 'cancelled' ? 'Cancelada' :
             purchase.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Estado Pago:</span>
          <Badge variant={getPaymentStatusVariant(purchase.payment_status)}>
            {purchase.payment_status === 'pagado' ? 'Pagado' : 'No Pagado'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};