import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="p-2 hover:bg-slate-100 rounded-lg transition-colors" />
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-700">Admin</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}