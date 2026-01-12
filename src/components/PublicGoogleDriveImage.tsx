import React from 'react';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Skeleton } from '@/components/ui/skeleton';

interface PublicGoogleDriveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  fileId: string | null | undefined;
  tenantId: string;
  fallbackSrc?: string;
}

export const PublicGoogleDriveImage: React.FC<PublicGoogleDriveImageProps> = ({ fileId, tenantId, fallbackSrc, className, ...props }) => {
  const { displayUrl, isLoading } = useGoogleDriveImage(fileId, tenantId);

  if (isLoading) {
    return <Skeleton className={className} />;
  }

  const finalSrc = displayUrl || fallbackSrc;

  if (!finalSrc) {
    return <Skeleton className={className} />;
  }

  return (
    <img
      src={finalSrc}
      {...props}
      className={className}
    />
  );
};
