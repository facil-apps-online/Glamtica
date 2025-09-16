import { useState, useRef } from "react";
import imageCompression from 'browser-image-compression';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useUploadPaymentEvidence, usePaymentEvidence } from "@/hooks/usePaymentEvidence";
import { useAuth } from "@/contexts/AuthContext";
import { ProductImage } from './ProductImage';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { useToast } from "@/hooks/use-toast";

interface PaymentEvidenceUploadDialogProps {
  attentionPaymentId: string;
  branchId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploadComplete?: () => void;
}

export const PaymentEvidenceUploadDialog = ({ 
  attentionPaymentId,
  branchId,
  isOpen,
  onOpenChange,
  onUploadComplete,
}: PaymentEvidenceUploadDialogProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { tenantId } = useAuth();
  
  const { mutate: uploadEvidence, isPending: isUploading } = useUploadPaymentEvidence();
  const { data: existingEvidence = [], isLoading, isError, refetch: refetchEvidence } = usePaymentEvidence(attentionPaymentId);

  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const handleOpenPreview = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setPreviewOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !tenantId || !branchId) return;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      await Promise.all(selectedFiles.map(async (file) => {
        const compressedFile = await imageCompression(file, options);
        await new Promise<void>((resolve, reject) => {
          uploadEvidence({
            file: compressedFile,
            attentionPaymentId,
            tenantId,
            branchId,
          }, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      }));
      
      toast({ title: "Éxito", description: "Todas las evidencias han sido subidas.", variant: "success" });
      setSelectedFiles([]);
      refetchEvidence();
      if (onUploadComplete) onUploadComplete();

    } catch (error) {
      console.error('Error uploading files:', error);
      toast({ title: "Error", description: "Ocurrió un error al subir una o más imágenes.", variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evidencia de Pago</DialogTitle>
            <p className="text-sm text-slate-600">
              Carga una foto del comprobante de pago.
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {isLoading && <div>Cargando evidencias...</div>}
            {isError && <div>Error al cargar las evidencias.</div>}

            {existingEvidence.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Evidencias existentes:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingEvidence.map((evidence) => (
                    <Card key={evidence.id} className="overflow-hidden cursor-pointer" onClick={() => handleOpenPreview(evidence.google_drive_file_id)}>
                      <CardContent className="p-0">
                        <ProductImage 
                          imageUrl={evidence.google_drive_file_id} 
                          altText={evidence.file_name}
                          className="w-full h-32 object-cover"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                Seleccionar Fotos
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Nuevas para subir:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedFiles.map((file, index) => (
                      <Card key={index} className="relative overflow-hidden">
                        <CardContent className="p-2">
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-32 object-cover rounded"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-7 w-7"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedFiles([])}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !branchId}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? "Subiendo..." : `Confirmar y Subir ${selectedFiles.length} archivo(s)`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ImagePreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={selectedImageUrl}
      />
    </>
  );
};