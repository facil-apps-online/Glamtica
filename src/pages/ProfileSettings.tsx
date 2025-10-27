import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoTab } from './PersonalInfoTab';
import { RegionalSettingsTab } from './RegionalSettingsTab';
import { SecurityTab } from './SecurityTab';
import { useScreenSize } from '@/hooks/useScreenSize';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("personal");
  const screenSize = useScreenSize();
  const isMobileOrTablet = screenSize === 'sm' || screenSize === 'md';

  // Mobile or Tablet View using a ShadCN Select component
  if (isMobileOrTablet) {
    return (
      <div className="w-full py-4 space-y-4">
        <h1 className="text-2xl font-bold px-4 text-primary">Mi Perfil</h1>
        <div className="px-4">
          <Select onValueChange={setActiveTab} value={activeTab}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar una sección..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Información Personal</SelectItem>
              <SelectItem value="regional">Configuración Regional</SelectItem>
              <SelectItem value="security">Seguridad</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="px-4">
          {activeTab === 'personal' && <PersonalInfoTab />}
          {activeTab === 'regional' && <RegionalSettingsTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    );
  }

  // Desktop View with Tabs
  return (
    <div className="w-full py-4 md:p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold px-4 md:px-0 text-primary">Mi Perfil</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 md:px-0 border-b">
          <TabsList>
            <TabsTrigger value="personal">Información Personal</TabsTrigger>
            <TabsTrigger value="regional">Configuración Regional</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="personal" className="mt-6">
          <PersonalInfoTab />
        </TabsContent>

        <TabsContent value="regional" className="mt-6">
          <RegionalSettingsTab />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}