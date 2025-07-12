import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="p-2 hover:bg-slate-100 rounded-lg transition-colors" />
      </div>
      
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-700">{user?.email}</p>
                  <p className="text-xs text-slate-500">{user?.role?.name}</p>
                </div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <div className="flex items-center p-2 text-sm font-medium text-slate-700">
              <User className="h-4 w-4 mr-2" />
              <span>Perfil</span>
            </div>
            <div className="flex items-center p-2 text-sm font-medium text-slate-700">
              <Settings className="h-4 w-4 mr-2" />
              <span>Configuración</span>
            </div>
            <div className="h-px bg-slate-100 my-1"></div> {/* Separator */}
            <Button 
              onClick={logout} 
              variant="ghost" 
              className="w-full justify-start text-sm font-medium text-slate-700 hover:bg-slate-100"
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