import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useClientAttentions } from '@/hooks/useClientAttentions';
import { AttentionItem } from './AttentionItem'; // Will create this next

interface AttentionsCardProps {
  clientId: string;
}

export const AttentionsCard: React.FC<AttentionsCardProps> = ({ clientId }) => {
  const [page, setPage] = useState(1);
  const pageSize = 5; // Display 5 attentions per page

  const { data, isLoading, error } = useClientAttentions(clientId, page, pageSize);

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Atenciones</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(pageSize)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500">Error al cargar atenciones: {error.message}</div>
        ) : data?.attentions && data.attentions.length > 0 ? (
          <div className="space-y-4">
            {data.attentions.map((attention) => (
              <AttentionItem key={attention.id} attention={attention} />
            ))}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
              </Button>
              <span>Página {page} de {totalPages}</span>
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">No hay atenciones registradas para este cliente.</div>
        )}
      </CardContent>
    </Card>
  );
};
