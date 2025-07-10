import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, Eye } from "lucide-react";
import { useUploadEvidence, useAppointmentEvidence, getEvidenceUrl } from "@/hooks/useAppointmentEvidence";

interface EvidenceUploadProps {
  appointmentId?: string;
  attentionId?: string;
  sessionId?: string;
  serviceSessionId?: string;
  stylistId?: string;
  extraServiceSessionId?: string;
  trigger?: React.ReactNode;
}

export const EvidenceUpload = ({ 
  appointmentId, 
  attentionId, 
  sessionId, 
  serviceSessionId, 
  stylistId, 
  extraServiceSessionId, 
  trigger 
}: EvidenceUploadProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = useUploadEvidence();
  const { data: existingEvidence = [] } = useAppointmentEvidence(appointmentId, attentionId, extraServiceSessionId, serviceSessionId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      for (const file of selectedFiles) {
        await uploadMutation.mutateAsync({
          file,
          appointmentId,
          attentionId,
          sessionId,
          serviceSessionId,
          stylistId,
          extraServiceSessionId,
        });
      }
      setSelectedFiles([]);
      setOpen(false);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  // Determinar el título del modal basado en el contexto
  const getModalTitle = () => {
    if (!serviceSessionId && attentionId) {
      return "Evidencia de Cancelación";
    }
    return "Evidencia Fotográfica del Servicio";
  };

  const getModalDescription = () => {
    if (!serviceSessionId && attentionId) {
      return "Carga evidencias relacionadas con la cancelación de la atención (capturas de WhatsApp, emails, etc.)";
    }
    return "Carga fotos del antes, durante o después del servicio realizado";
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
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <p className="text-sm text-slate-600">
            {getModalDescription()}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Evidencias existentes */}
          {existingEvidence.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Evidencias ya cargadas:</h3>
              <div className="grid grid-cols-2 gap-4">
                {existingEvidence.map((evidence) => (
                  <Card key={evidence.id} className="overflow-hidden">
                    <CardContent className="p-2">
                      <div className="relative">
                        <img
                          src={getEvidenceUrl(evidence.file_path)}
                          alt={evidence.file_name}
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => window.open(getEvidenceUrl(evidence.file_path), '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {evidence.file_name}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Subir nuevas evidencias */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Seleccionar Fotos
              </Button>
              <span className="text-sm text-gray-600">
                {selectedFiles.length} archivo(s) seleccionado(s)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
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
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {file.name}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFiles([])}
                >
                  Limpiar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploadMutation.isPending ? "Subiendo..." : "Subir Evidencias"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};