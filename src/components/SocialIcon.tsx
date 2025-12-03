import React from 'react';
import {
  Instagram,
  Facebook,
  Twitter, // Lucide uses Twitter for X
  Youtube,
  Linkedin,
  Globe, // Generic icon for Website or unknown
  MessageSquare, // For WhatsApp
  Crop, // Placeholder for TikTok if no specific icon
} from 'lucide-react';
import { SocialNetworkType } from '@/hooks/useSocialNetworks';
import { cn } from '@/lib/utils'; // Assuming cn utility for tailwindcss class merging

interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
  networkName: SocialNetworkType;
  className?: string;
}

export const SocialIcon: React.FC<SocialIconProps> = ({ networkName, className, ...props }) => {
  const IconComponent = () => {
    switch (networkName) {
      case 'Instagram':
        return <Instagram className={cn("h-4 w-4", className)} {...props} />;
      case 'Facebook':
        return <Facebook className={cn("h-4 w-4", className)} {...props} />;
      case 'X':
        return <Twitter className={cn("h-4 w-4", className)} {...props} />;
      case 'YouTube':
        return <Youtube className={cn("h-4 w-4", className)} {...props} />;
      case 'LinkedIn':
        return <Linkedin className={cn("h-4 w-4", className)} {...props} />;
      case 'WhatsApp':
        return <MessageSquare className={cn("h-4 w-4", className)} {...props} />; // Using MessageSquare for WhatsApp
      case 'TikTok':
        return <Crop className={cn("h-4 w-4", className)} {...props} />; // Using Crop as a placeholder for TikTok
      case 'Website':
        return <Globe className={cn("h-4 w-4", className)} {...props} />;
      default:
        return <Globe className={cn("h-4 w-4", className)} {...props} />; // Fallback
    }
  };

  return <IconComponent />;
};
