import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductImageProps {
  imageUrl: string;
  altText?: string;
  className?: string;
}

export const ProductImage = ({ imageUrl, altText = "Imagen de producto", className }: ProductImageProps) => {
  const { displayUrl, isLoading } = useGoogleDriveImage(imageUrl);

  if (isLoading) {
    return <Skeleton className={className || "w-full h-32"} />;
  }

  if (!displayUrl) {
    // Puedes mostrar una imagen de placeholder si la URL no se puede cargar
    return <div className={className || "w-full h-32 bg-gray-200 flex items-center justify-center"}>?</div>;
  }

  return (
    <img
      src={displayUrl}
      alt={altText}
      className={className}
    />
  );
};
