import React, { useState } from 'react';
// import { AttentionEvidence } from '@/hooks/useClientAttentions'; // No longer needed
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Image } from 'lucide-react'; // Using lucide-react for a placeholder icon

// New interface for evidences
export interface AttentionEvidence {
  id: string;
  google_drive_file_id: string;
  file_name: string;
  mime_type: string;
}

interface EvidenceGalleryProps {
  evidences: AttentionEvidence[];
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ evidences }) => {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setOpen(true);
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {evidences.map((evidence) => (
          <EvidenceThumbnail
            key={evidence.id}
            evidence={evidence}
            onClick={handleImageClick}
          />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh] flex items-center justify-center">
          {selectedImage && (
            <img src={selectedImage} alt="Evidencia" className="max-w-full max-h-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface EvidenceThumbnailProps {
  evidence: AttentionEvidence;
  onClick: (imageUrl: string) => void;
}

const EvidenceThumbnail: React.FC<EvidenceThumbnailProps> = ({ evidence, onClick }) => {
  const { displayUrl, isLoading } = useGoogleDriveImage(evidence.google_drive_file_id); // Use google_drive_file_id

  if (isLoading) {
    return <Skeleton className="w-24 h-24 rounded-md" />;
  }

  if (!displayUrl) {
    return (
      <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
        <Image className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '96px',
        height: '96px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '0.375rem',
      }}
      className="bg-muted cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => onClick(displayUrl)}
    >
      <img
        src={displayUrl}
        alt="Evidencia"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};