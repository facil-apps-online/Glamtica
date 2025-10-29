
import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SignaturePadProps {
  onSave: (signature: string) => void;
  initialSignature?: string; // Para cargar una firma existente en modo lectura
  readOnly?: boolean;
  isMobile?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, initialSignature, readOnly = false, isMobile = false }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const canvasWidth = isMobile ? 300 : 400;
  const canvasHeight = isMobile ? 150 : 200;

  useEffect(() => {
    if (initialSignature && sigCanvas.current) {
      sigCanvas.current.fromDataURL(initialSignature);
      setIsEmpty(false);
    }
  }, [initialSignature]);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      onSave(''); // Notificar que la firma ha sido borrada
    }
  };

  const saveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      onSave(sigCanvas.current.toDataURL());
      setIsEmpty(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Firma Digital</Label>
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{ width: canvasWidth, height: canvasHeight, className: 'signature-canvas bg-white' }}
          onEnd={saveSignature}
          minWidth={0.5}
          maxWidth={2.5}
          penColor='black'
          readOnly={readOnly}
        />
      </div>
      {!readOnly && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={clearSignature} disabled={isEmpty}>
            Limpiar
          </Button>
          <Button onClick={saveSignature} disabled={isEmpty}>
            Guardar Firma
          </Button>
        </div>
      )}
      {readOnly && initialSignature && (
        <p className="text-sm text-slate-500">Firma registrada.</p>
      )}
      {readOnly && !initialSignature && (
        <p className="text-sm text-slate-500">No hay firma registrada.</p>
      )}
    </div>
  );
};
