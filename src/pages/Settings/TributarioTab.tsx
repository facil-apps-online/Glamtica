import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from 'lucide-react';

export function TributarioTab() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <FileText className="h-5 w-5" />
          Configuración Tributaria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Aquí se mostrará la configuración de facturación y datos fiscales.</p>
      </CardContent>
    </Card>
  );
}