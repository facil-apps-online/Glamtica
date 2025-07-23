import React from 'react';
import { useInvoicesByTenant } from '@/hooks/useInvoicesByTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText } from 'lucide-react';
import { usePriceFormat } from '@/hooks/usePriceFormat'; // Importar el hook

interface TenantInvoicesListProps {
  tenantId: string;
}

export function TenantInvoicesList({ tenantId }: TenantInvoicesListProps) {
  const { data: invoices, isLoading, isError, error } = useInvoicesByTenant(tenantId);
  const { formatPrice } = usePriceFormat(); // Usar el hook

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'draft': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'default';
    }
  };

  const content = () => {
    if (isLoading) {
      return <Skeleton className="h-40 w-full" />;
    }

    if (isError) {
      return (
        <div className="text-red-500 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Error al cargar facturas: {error.message}</span>
        </div>
      );
    }

    if (!invoices || invoices.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="mx-auto h-12 w-12" />
          <p className="mt-4">No se han encontrado facturas para este tenant.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Fecha Vencimiento</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {formatPrice(invoice.total_amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturación</CardTitle>
        <CardDescription>Historial de facturas generadas para este tenant.</CardDescription>
      </CardHeader>
      <CardContent>
        {content()}
      </CardContent>
    </Card>
  );
}
