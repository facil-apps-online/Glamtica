import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SignaturePadProps {
  initialSignature?: string; // Para cargar una firma existente en modo lectura
  readOnly?: boolean;
}

export const SignaturePad = React.forwardRef<SignatureCanvas, SignaturePadProps>(({ initialSignature, readOnly = false }, ref) => {
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (initialSignature && ref && (ref as React.MutableRefObject<SignatureCanvas>).current) {
      const canvas = (ref as React.MutableRefObject<SignatureCanvas>).current.getCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.src = initialSignature;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setIsEmpty(false);
        };
      }
    }
  }, [initialSignature, ref]);

  const clearSignature = () => {
    if (ref && (ref as React.MutableRefObject<SignatureCanvas>).current) {
      (ref as React.MutableRefObject<SignatureCanvas>).current.clear();
      setIsEmpty(true);
    }
  };

  const handleSignatureEnd = () => {
    if (ref && (ref as React.MutableRefObject<SignatureCanvas>).current) {
      setIsEmpty((ref as React.MutableRefObject<SignatureCanvas>).current.isEmpty());
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Label>Firma Digital</Label>
      <div className="relative flex-grow w-full h-full mt-2 border border-gray-300 rounded-md overflow-hidden">
        <SignatureCanvas
          ref={ref}
          canvasProps={{ className: 'w-full h-full bg-white' }}
          onEnd={handleSignatureEnd}
          minWidth={0.5}
          maxWidth={2.5}
          penColor='black'
          readOnly={readOnly}
        />
      </div>
      {!readOnly && (
        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={clearSignature} disabled={isEmpty} size="sm">
            Limpiar
          </Button>
        </div>
      )}
      {readOnly && initialSignature && (
        <p className="text-sm text-slate-500 mt-2">Firma registrada.</p>
      )}
      {readOnly && !initialSignature && (
        <p className="text-sm text-slate-500 mt-2">No hay firma registrada.</p>
      )}
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';