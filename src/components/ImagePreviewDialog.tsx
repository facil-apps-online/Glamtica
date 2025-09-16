import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProductImage } from './ProductImage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrls: string[];
}

export const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
  isOpen,
  onClose,
  imageUrls,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!imageUrls || imageUrls.length === 0) {
    return null;
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa de la Imagen</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center p-4 bg-muted rounded-md overflow-hidden relative">
          {imageUrls.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <ProductImage
            imageUrl={imageUrls[currentIndex]}
            altText={`Vista previa de la imagen ${currentIndex + 1}`}
            className="max-w-full max-h-[70vh] object-contain"
          />
          {imageUrls.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
        <DialogFooter className="flex justify-between items-center">
            <div>
                {imageUrls.length > 1 && (
                    <span className="text-sm text-muted-foreground">
                        {currentIndex + 1} / {imageUrls.length}
                    </span>
                )}
            </div>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};