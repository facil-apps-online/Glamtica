import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Skeleton } from '@/components/ui/skeleton';

interface ServiceImageProps {
  imageUrl: string;
  altText?: string;
  className?: string;
}

export const ServiceImage = ({ imageUrl, altText = "Imagen de servicio", className }: ServiceImageProps) => {
  const { displayUrl, isLoading } = useGoogleDriveImage(imageUrl);

  if (isLoading) {
    return <Skeleton className={`h-full w-full ${className}`} />;
  }

  if (!displayUrl) {
    return (
      <div className={`h-full w-full flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <span className="text-xs text-muted-foreground">No se pudo cargar</span>
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={altText}
      className={`rounded-lg ${className}`}
      loading="lazy"
    />
  );
};
