import React from 'react';
import { useSubscriptionsByTenant } from '@/hooks/useSubscriptionsByTenant';
import { useGenerateInvoice } from '@/hooks/useGenerateInvoice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FilePlus2 } from 'lucide-react';

interface TenantSubscriptionsManagerProps {
  tenantId: string;
}

export function TenantSubscriptionsManager({ tenantId }: TenantSubscriptionsManagerProps) {
  const { data: subscriptions, isLoading, isError, error } = useSubscriptionsByTenant(tenantId);
  const { mutate: generateInvoice, isPending: isGenerating } = useGenerateInvoice();

  const handleGenerateInvoice = (subscriptionId: string) => {
    generateInvoice(subscriptionId);
  };

  const content = () => {
    if (isLoading) {
      return <Skeleton className="h-40 w-full" />;
    }

    if (isError) {
      return (
        <div className="text-red-500 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Error al cargar suscripciones: {error.message}</span>
        </div>
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>Este tenant no tiene suscripciones activas.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Ámbito</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.plan_name}</TableCell>
                <TableCell>{sub.branch_name}</TableCell>
                <TableCell>{new Date(sub.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Indefinido'}</TableCell>
                <TableCell>
                  <Badge variant={sub.is_active ? 'success' : 'secondary'}>
                    {sub.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {sub.is_active && (
                    <Button
                      size="sm"
                      onClick={() => handleGenerateInvoice(sub.id)}
                      disabled={isGenerating}
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      {isGenerating ? 'Generando...' : 'Generar Factura'}
                    </Button>
                  )}
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
        <CardTitle>Suscripciones</CardTitle>
        <CardDescription>Suscripciones activas e historial del tenant.</CardDescription>
      </CardHeader>
      <CardContent>
        {content()}
      </CardContent>
    </Card>
  );
}
