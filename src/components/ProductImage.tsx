import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductImageProps {
  imageUrl: string | null | undefined;
  altText?: string;
  className?: string;
}

export const ProductImage = ({ imageUrl, altText = "Imagen de producto", className }: ProductImageProps) => {
  // If no imageUrl is provided from the start, show the placeholder immediately.
  if (!imageUrl) {
    return <div className={className || "w-full h-32 bg-gray-200 flex items-center justify-center"}>?</div>;
  }

  return <ImageLoader imageUrl={imageUrl} altText={altText} className={className} />;
};

// Extracted loader logic into a sub-component so the hook is not called conditionally.
const ImageLoader = ({ imageUrl, altText, className }: ProductImageProps) => {
  const { displayUrl, isLoading } = useGoogleDriveImage(imageUrl as string);

  if (isLoading) {
    return <Skeleton className={className || "w-full h-32"} />;
  }

  if (!displayUrl) {
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
