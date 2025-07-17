import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoTab } from './PersonalInfoTab';
import { RegionalSettingsTab } from './RegionalSettingsTab';
import { SecurityTab } from './SecurityTab';

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("personal"); // Estado para la pestaña activa

  return (
    <div className="w-full py-4 md:p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold px-4 md:px-0">Mi Perfil</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 md:px-0">
          <TabsList className="w-full flex-nowrap overflow-x-auto justify-start">
            <TabsTrigger value="personal">Información Personal</TabsTrigger>
            <TabsTrigger value="regional">Configuración Regional</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="personal">
          <PersonalInfoTab />
        </TabsContent>

        <TabsContent value="regional">
          <RegionalSettingsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}