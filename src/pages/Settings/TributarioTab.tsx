import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TributarioTab() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-primary">Configuración Tributaria</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Aquí se mostrará la configuración de facturación y datos fiscales.</p>
      </CardContent>
    </Card>
  );
}