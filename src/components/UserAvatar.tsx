import { useGoogleDriveImage } from "@/hooks/useGoogleDriveImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  borderColor?: string;
  className?: string;
}

export const UserAvatar = ({ src, alt, fallback, borderColor, className }: UserAvatarProps) => {
  const { displayUrl } = useGoogleDriveImage(src);

  return (
    <Avatar className={className} style={{ borderColor }}>
      <AvatarImage src={displayUrl} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};