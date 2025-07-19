import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

// Función auxiliar para obtener la imagen recortada del canvas
function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  // Usamos las dimensiones del recorte para el canvas
  canvas.width = crop.width;
  canvas.height = crop.height;
  
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('No se pudo obtener el contexto del canvas'));
  }

  // Dibujamos la imagen recortada en el canvas
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  // Devolvemos el contenido del canvas como un Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('La creación del Blob falló'));
          return;
        }
        resolve(blob);
      },
      'image/png', // El formato de salida
      1 // La calidad
    );
  });
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  // Centra el recorte cuando la imagen se carga
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(newCrop);
  }

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }
    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedImageBlob);
      onClose(); // Cierra el diálogo después de completar
    } catch (e) {
      console.error('Error al recortar la imagen:', e);
    }
  };

  if (!imageSrc) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recortar Avatar</DialogTitle>
          <DialogDescription>
            Ajusta el recuadro para seleccionar la parte de la imagen que quieres usar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-4 bg-muted rounded-md">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1} // Forzamos un aspect ratio cuadrado
            circularCrop // Hacemos el recorte circular para que se vea como un avatar
          >
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={onImageLoad}
              alt="Imagen para recortar"
              style={{ maxHeight: '70vh' }} // Evita que la imagen sea demasiado grande
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveCrop}>Guardar y Continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
