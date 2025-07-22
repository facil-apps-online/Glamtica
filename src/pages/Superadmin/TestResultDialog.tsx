import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const getStatusVariant = (status: number) => {
  if (status >= 200 && status < 300) return 'default';
  if (status >= 400 && status < 500) return 'destructive';
  if (status >= 500) return 'destructive';
  return 'secondary';
};

export const TestResultDialog = ({ isOpen, onClose, result }) => {
  if (!result) return null;

  const isJson = (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  const formattedBody = isJson(result.body) 
    ? JSON.stringify(JSON.parse(result.body), null, 2)
    : result.body;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            Resultado de la Prueba de Conexión
            <Badge variant={getStatusVariant(result.status)}>{result.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Esta es la respuesta recibida desde el endpoint de prueba.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="body">
              <AccordionTrigger>Cuerpo de la Respuesta</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-gray-900 text-white p-4 rounded-md text-sm">
                  <code>{formattedBody}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="headers">
              <AccordionTrigger>Cabeceras de la Respuesta</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-gray-900 text-white p-4 rounded-md text-sm">
                  <code>{JSON.stringify(result.headers, null, 2)}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
