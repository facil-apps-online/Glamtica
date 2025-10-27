import React, { useState } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGoogleDriveImage } from "@/hooks/useGoogleDriveImage";
import { ContextSwitcher } from './ContextSwitcher';
import { BranchSelector } from './BranchSelector';
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  panelTitle?: string;
}

export function Header({ panelTitle = "" }: HeaderProps) {
  const { profile, logout, currentAssignment } = useAuth();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const navigate = useNavigate();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { displayUrl } = useGoogleDriveImage(profile?.avatarUrl);

  const displayName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : profile?.realEmail || profile?.email;

  const getInitials = () => {
    if (profile?.firstName) {
      return `${profile.firstName[0]}${profile.lastName ? profile.lastName[0] : ''}`.toUpperCase();
    }
    return profile?.email?.[0].toUpperCase() || '?';
  };

  const handleLogout = () => {
    setIsPopoverOpen(false);
    logout();
  };

  const handleProfileClick = () => {
    setIsPopoverOpen(false);
    navigate("/app/profile-settings");
  };

  return (
    <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
        { currentAssignment?.role_name === 'super_admin' 
            ? <h1 className="text-lg sm:text-2xl font-bold truncate">{panelTitle}</h1>
            : (
              <div className="flex items-center gap-2">
                <ContextSwitcher />
                { currentAssignment?.role_name === 'tenant_super_admin' && <BranchSelector /> }
              </div>
            )
        }
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell />
        {!isMobile && (
          <div className="text-sm text-right">
            <p className="font-semibold text-foreground truncate max-w-xs">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentAssignment?.role_display_name}</p>
          </div>
        )}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayUrl} alt="Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <div className="p-2 flex items-center gap-3">
               <Avatar className="h-10 w-10">
                <AvatarImage src={displayUrl} alt="Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="truncate">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentAssignment?.role_display_name}</p>
              </div>
            </div>
            <Separator className="my-2" />
            <div 
              onClick={handleProfileClick} 
              className="flex items-center p-2 text-sm font-medium text-foreground hover:bg-accent rounded-md cursor-pointer"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span>Mi Perfil</span>
            </div>
            <Separator className="my-1" />
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="w-full justify-start text-sm font-medium text-destructive hover:bg-red-50 hover:text-destructive/90 dark:hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Cerrar Sesión</span>
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
