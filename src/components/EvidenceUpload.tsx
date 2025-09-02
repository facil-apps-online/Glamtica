import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, Eye } from "lucide-react";
import { useUploadEvidence, useAppointmentEvidence, getEvidenceUrl } from "@/hooks/useAppointmentEvidence";
import { useAuth } from "@/hooks/useAuth";
import { useBranchFilterStore } from "@/stores/branchFilterStore";

interface EvidenceUploadProps {
  attentionServiceId: string;
  onUploadComplete?: () => void;
  trigger?: React.ReactNode;
}

export const EvidenceUpload = ({ 
  attentionServiceId,
  onUploadComplete,
  trigger 
}: EvidenceUploadProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { tenantId } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  
  const uploadMutation = useUploadEvidence();
  const { data: existingEvidence = [] } = useAppointmentEvidence(attentionServiceId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !tenantId || selectedBranchId === 'all') return;

    try {
      for (const file of selectedFiles) {
        await uploadMutation.mutateAsync({
          file,
          attentionServiceId,
          tenantId,
          branchId: selectedBranchId,
        });
      }
      setSelectedFiles([]);
      setOpen(false);
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Camera className="w-4 h-4" />
            Agregar Evidencia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evidencia Fotográfica del Servicio</DialogTitle>
          <p className="text-sm text-slate-600">
            Carga fotos del antes, durante o después del servicio realizado.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {existingEvidence.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Evidencias existentes:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {existingEvidence.map((evidence) => (
                  <Card key={evidence.id} className="overflow-hidden">
                    <CardContent className="p-2">
                      <div className="relative">
                        <img
                          src={getEvidenceUrl(evidence.google_drive_file_id)}
                          alt={evidence.file_name}
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7"
                          onClick={() => window.open(getEvidenceUrl(evidence.google_drive_file_id), '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
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
                  disabled={uploadMutation.isPending || selectedBranchId === 'all'}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploadMutation.isPending ? "Subiendo..." : `Subir ${selectedFiles.length} archivo(s)`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
