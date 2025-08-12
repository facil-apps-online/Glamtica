import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from './ui/skeleton';

// NEW IMPORTS
import { useUserProductCommissionData, UserProductCommissionData } from "@/hooks/useUserProductCommissionData";
import { useUserServiceCommissionData, UserServiceCommissionData } from "@/hooks/useUserServiceCommissionData";
import { useUpdateCommission } from "@/hooks/useUpdateCommission";

// Props for the main dialog component
interface UserCommissionsDialogProps {
  userId: string;
  userName: string;
  trigger?: React.ReactNode;
}

export const UserCommissionsDialog = ({ userId, userName, trigger }: UserCommissionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const { currentAssignment, tenantBranches } = useAuth();
  const isSuperAdmin = currentAssignment?.role_name === 'tenant_super_admin';

  // Local state for superadmin's branch selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // --- DATA FETCHING ---
  const { data: productCommissionData, isLoading: isLoadingProducts, error: productError } = useUserProductCommissionData(userId);
  const { data: serviceCommissionData, isLoading: isLoadingServices, error: serviceError } = useUserServiceCommissionData(userId);
  const updateCommissionMutation = useUpdateCommission();

  // Filter data based on selectedBranchId if superadmin
  const filteredProductCommissionData = useMemo(() => {
    if (!productCommissionData) return [];
    if (!isSuperAdmin || !selectedBranchId) return productCommissionData;

    return productCommissionData.map(product => ({
      ...product,
      branches: product.branches.filter(branch => branch.branch_id === selectedBranchId)
    })).filter(product => product.branches.length > 0);
  }, [productCommissionData, isSuperAdmin, selectedBranchId]);

  const filteredServiceCommissionData = useMemo(() => {
    if (!serviceCommissionData) return [];
    if (!isSuperAdmin || !selectedBranchId) return serviceCommissionData;

    return serviceCommissionData.map(service => ({
      ...service,
      branches: service.branches.filter(branch => branch.branch_id === selectedBranchId)
    })).filter(service => service.branches.length > 0);
  }, [serviceCommissionData, isSuperAdmin, selectedBranchId]);

  // --- CHANGE HANDLERS ---
  const handleCommissionChange = (item_id: string, branch_id: string, item_type: 'product' | 'service', commission_rate: number, can_perform?: boolean) => {
    updateCommissionMutation.mutate({
      item_id,
      user_id: userId,
      branch_id,
      item_type,
      commission_rate,
      can_perform, // Only relevant for services
    });
  };

  // When dialog opens, reset local state if superadmin
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && isSuperAdmin) {
      setSelectedBranchId(""); // Reset on open
    }
    setOpen(isOpen);
  };

  const isLoading = isLoadingProducts || isLoadingServices;
  const hasError = productError || serviceError;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex-1">
            <DollarSign className="w-4 h-4 mr-1" />
            Comisiones
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comisiones de {userName}</DialogTitle>
        </DialogHeader>

        {isSuperAdmin && (
          <div className="p-4 border-b">
            <label htmlFor="branch-selector" className="text-sm font-medium mb-2 block">
              Filtrar por Sucursal
            </label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger id="branch-selector" className="w-full">
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las sucursales</SelectItem>
                {tenantBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="space-y-4 w-full p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : hasError ? (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-red-500">Error al cargar los datos: {productError?.message || serviceError?.message}</p>
          </div>
        ) : (
          <Tabs defaultValue="products" className="flex-grow flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="services">Servicios</TabsTrigger>
            </TabsList>
            
            {/* PRODUCTS TAB */}
            <TabsContent value="products" className="flex-grow overflow-auto p-4">
              {filteredProductCommissionData.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No hay productos disponibles para este usuario en la(s) sucursal(es) seleccionada(s).</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredProductCommissionData.map((productData) => (
                    <AccordionItem value={productData.product_id} key={productData.product_id}>
                      <AccordionTrigger>{productData.product_name}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 font-semibold p-2 border-b">
                            <div>Sucursal</div>
                            <div className="text-right">Comisión (%)</div>
                          </div>
                          {productData.branches.map((branchData) => (
                            <div key={branchData.branch_id} className="grid grid-cols-2 gap-4 items-center p-2 rounded-lg hover:bg-muted">
                              <div>{branchData.branch_name}</div>
                              <div className="flex justify-end">
                                <Input
                                  type="number"
                                  defaultValue={branchData.commission_rate || 0}
                                  onBlur={(e) => handleCommissionChange(productData.product_id, branchData.branch_id, 'product', parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                  disabled={updateCommissionMutation.isPending}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            {/* SERVICES TAB */}
            <TabsContent value="services" className="flex-grow overflow-auto p-4">
              {filteredServiceCommissionData.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No hay servicios disponibles para este usuario en la(s) sucursal(es) seleccionada(s).</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredServiceCommissionData.map((serviceData) => (
                    <AccordionItem value={serviceData.service_id} key={serviceData.service_id}>
                      <AccordionTrigger>{serviceData.service_name}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-4 font-semibold p-2 border-b">
                            <div>Sucursal</div>
                            <div className="text-center">Puede Realizar</div>
                            <div className="text-right">Comisión (%)</div>
                          </div>
                          {serviceData.branches.map((branchData) => (
                            <div key={branchData.branch_id} className="grid grid-cols-3 gap-4 items-center p-2 rounded-lg hover:bg-muted">
                              <div>{branchData.branch_name}</div>
                              <div className="flex justify-center">
                                <Switch
                                  checked={branchData.can_perform || false}
                                  onCheckedChange={(checked) => handleCommissionChange(serviceData.service_id, branchData.branch_id, 'service', branchData.commission_rate || 0, checked)}
                                  disabled={updateCommissionMutation.isPending}
                                />
                              </div>
                              <div className="flex justify-end">
                                <Input
                                  type="number"
                                  defaultValue={branchData.commission_rate || 0}
                                  onBlur={(e) => handleCommissionChange(serviceData.service_id, branchData.branch_id, 'service', parseFloat(e.target.value) || 0, branchData.can_perform || false)}
                                  className="w-24 text-right"
                                  disabled={updateCommissionMutation.isPending}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};