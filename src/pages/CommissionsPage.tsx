import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommissionsList } from "@/components/commissions/CommissionsList";
import { PayslipsList } from "@/components/commissions/PayslipsList";

const CommissionsPage = () => {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const [activeTab, setActiveTab] = useState('commissions');

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Gestión de Comisiones"
        subtitle="Visualiza, gestiona y liquida las comisiones de tus profesionales."
      />
      
      {isMobile ? (
        <div className="space-y-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commissions">Comisiones</SelectItem>
              <SelectItem value="payslips">Liquidaciones</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-4">
            {activeTab === 'commissions' ? <CommissionsList /> : <PayslipsList />}
          </div>
        </div>
      ) : (
        <Tabs defaultValue="commissions" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="commissions">Comisiones</TabsTrigger>
            <TabsTrigger value="payslips">Liquidaciones</TabsTrigger>
          </TabsList>
          <TabsContent value="commissions" className="space-y-4">
            <CommissionsList />
          </TabsContent>
          <TabsContent value="payslips" className="space-y-4">
            <PayslipsList />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CommissionsPage;