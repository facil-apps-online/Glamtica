import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Attention } from '@/hooks/useClientAttentions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvidenceGallery } from './EvidenceGallery'; // Will create this next
import { ConsentViewerTrigger } from './ConsentViewerTrigger'; // Will create this next

interface AttentionItemProps {
  attention: Attention;
}

export const AttentionItem: React.FC<AttentionItemProps> = ({ attention }) => {
  const formattedDate = format(new Date(attention.attention_datetime), 'PPP p', { locale: es });

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Atención: {formattedDate}</CardTitle>
        <Badge variant="secondary">{attention.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {attention.attention_services && attention.attention_services.length > 0 && (
          <div>
            <h4 className="text-md font-semibold mb-1">Servicios:</h4>
            <ul className="list-disc pl-5 text-sm">
              {attention.attention_services.map((service) => (
                <li key={service.id}>{service.services?.name || 'Servicio Desconocido'}</li>
              ))}
            </ul>
          </div>
        )}

        {attention.attention_services && attention.attention_services.length > 0 && (
          // Collect all evidences from all services
          (() => { // Use an IIFE to execute immediately
            const allEvidences = attention.attention_services.flatMap(
              (service) => service.attention_service_evidences || []
            );
            if (allEvidences.length === 0) return null;
            return (
              <div>
                <h4 className="text-md font-semibold mb-1">Evidencias:</h4>
                <EvidenceGallery evidences={allEvidences} />
              </div>
            );
          })() // Call the IIFE
        )}

        {attention.client_document_instances && attention.client_document_instances.length > 0 && (
          <div>
            <h4 className="text-md font-semibold mb-1">Consentimientos Informados:</h4>
            <div className="space-y-2">
              {attention.client_document_instances.map((consent) => (
                <ConsentViewerTrigger key={consent.id} documentInstance={consent} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
