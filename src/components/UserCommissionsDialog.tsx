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
import { useUserAssignments } from "@/hooks/useUserAssignments";
import { useQueryClient } from "@tanstack/react-query";

// NEW IMPORTS
import { useUserProductCommissionData, UserProductCommissionData } from "@/hooks/useUserProductCommissionData";
import { useUserServiceCommissionData, UserServiceCommissionData } from "@/hooks/useUserServiceCommissionData";
import { useUpdateCommission } from "@/hooks/useUpdateCommission";

interface PendingCommissionChanges {
  products: { [productId: string]: { commission_rate?: number } };
  services: { [serviceId: string]: { commission_rate?: number; can_perform?: boolean } };
}

interface AllPendingChanges {
  [branchId: string]: PendingCommissionChanges;
}

// Props for the main dialog component
interface UserCommissionsDialogProps {
  userId: string;
  userName: string;
  trigger?: React.ReactNode;
}

export const UserCommissionsDialog = ({ userId, userName, trigger }: UserCommissionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<AllPendingChanges>({});

  const queryClient = useQueryClient();

  const handleSaveBranchCommissions = async (branch_id: string) => {
    const changesForBranch = pendingChanges[branch_id];
    if (!changesForBranch) return;

    const mutations: Promise<any>[] = [];

    // Products
    for (const product_id in changesForBranch.products) {
      const change = changesForBranch.products[product_id];
      mutations.push(
        updateCommissionMutation.mutateAsync({
          item_id: product_id,
          user_id: userId,
          branch_id: branch_id,
          item_type: 'product',
          commission_rate: change.commission_rate!,
        })
      );
    }

    // Services
    for (const service_id in changesForBranch.services) {
      const change = changesForBranch.services[service_id];
      mutations.push(
        updateCommissionMutation.mutateAsync({
          item_id: service_id,
          user_id: userId,
          branch_id: branch_id,
          item_type: 'service',
          commission_rate: change.commission_rate!,
          can_perform: change.can_perform,
        })
      );
    }

    try {
      await Promise.all(mutations);
      // Clear pending changes for this branch after successful save
      setPendingChanges(prev => {
        const newPrev = { ...prev };
        delete newPrev[branch_id];
        return newPrev;
      });
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['user_product_commission_data', userId] });
      queryClient.invalidateQueries({ queryKey: ['user_service_commission_data', userId] });
    } catch (error) {
      console.error("Error saving commissions for branch", branch_id, error);
      // Handle error (e.g., show a toast notification)
    }
  };
  const { currentAssignment, tenantBranches } = useAuth();
  const isSuperAdmin = currentAssignment?.role_name === 'tenant_super_admin';

  const tenantId = currentAssignment?.tenant_id;

  // Local state for superadmin's branch selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  // --- DATA FETCHING ---
  const { data: productCommissionData, isLoading: isLoadingProducts, error: productError } = useUserProductCommissionData(userId);
  const { data: serviceCommissionData, isLoading: isLoadingServices, error: serviceError } = useUserServiceCommissionData(userId);
  const updateCommissionMutation = useUpdateCommission();

  // Filter data based on selectedBranchId if superadmin
  const filteredProductCommissionData = useMemo(() => {
    if (!productCommissionData) return [];
    if (!isSuperAdmin || selectedBranchId === "all") return productCommissionData;

    return productCommissionData.map(product => ({
      ...product,
      branches: product.branches.filter(branch => branch.branch_id === selectedBranchId)
    })).filter(product => product.branches.length > 0);
  }, [productCommissionData, isSuperAdmin, selectedBranchId]);

  const filteredServiceCommissionData = useMemo(() => {
    if (!serviceCommissionData) return [];
    if (!isSuperAdmin || selectedBranchId === "all") return serviceCommissionData;

    return serviceCommissionData.map(service => ({
      ...service,
      branches: service.branches.filter(branch => branch.branch_id === selectedBranchId)
    })).filter(service => service.branches.length > 0);
  }, [serviceCommissionData, isSuperAdmin, selectedBranchId]);

  interface GroupedCommissionData {
    branch_id: string;
    branch_name: string;
    products: {
      product_id: string;
      product_name: string;
      commission_rate: number | null;
      commission_id: string | null;
    }[];
    services: {
      service_id: string;
      service_name: string;
      commission_rate: number | null;
      can_perform: boolean | null;
      commission_id: string | null;
    }[];
  }

  const groupedCommissionsByBranch = useMemo(() => {
    const grouped: { [branchId: string]: GroupedCommissionData } = {};

    // Process products
    filteredProductCommissionData.forEach(product => {
      product.branches.forEach(branch => {
        if (!grouped[branch.branch_id]) {
          grouped[branch.branch_id] = {
            branch_id: branch.branch_id,
            branch_name: branch.branch_name,
            products: [],
            services: []
          };
        }
        grouped[branch.branch_id].products.push({
          product_id: product.product_id,
          product_name: product.product_name,
          commission_rate: branch.commission_rate,
          commission_id: branch.commission_id
        });
      });
    });

    // Process services
    filteredServiceCommissionData.forEach(service => {
      service.branches.forEach(branch => {
        if (!grouped[branch.branch_id]) {
          grouped[branch.branch_id] = {
            branch_id: branch.branch_id,
            branch_name: branch.branch_name,
            products: [],
            services: []
          };
        }
        grouped[branch.branch_id].services.push({
          service_id: service.service_id,
          service_name: service.service_name,
          commission_rate: branch.commission_rate,
          can_perform: branch.can_perform,
          commission_id: branch.commission_id
        });
      });
    });

    // Convert map to array and sort by branch name
    return Object.values(grouped).sort((a, b) => a.branch_name.localeCompare(b.branch_name));
  }, [filteredProductCommissionData, filteredServiceCommissionData]);

  // --- CHANGE HANDLERS ---
  const handleCommissionChange = (
    item_id: string,
    branch_id: string,
    item_type: 'product' | 'service',
    commission_rate: number,
    can_perform?: boolean
  ) => {
    setPendingChanges(prev => {
      const branchChanges = prev[branch_id] || { products: {}, services: {} };
      if (item_type === 'product') {
        return {
          ...prev,
          [branch_id]: {
            ...branchChanges,
            products: {
              ...branchChanges.products,
              [item_id]: { commission_rate }
            }
          }
        };
      } else { // service
        return {
          ...prev,
          [branch_id]: {
            ...branchChanges,
            services: {
              ...branchChanges.services,
              [item_id]: { commission_rate, can_perform }
            }
          }
        };
      }
    });
  };

  // When dialog opens, reset local state if superadmin
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && isSuperAdmin) {
      setSelectedBranchId("all"); // Reset on open
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
                <SelectItem value="all">Todas las sucursales</SelectItem>
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
              {groupedCommissionsByBranch.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No hay productos disponibles para este usuario en la(s) sucursal(es) seleccionada(s).</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {groupedCommissionsByBranch.map((branchData) => (
                    <AccordionItem value={branchData.branch_id} key={branchData.branch_id}>
                      <AccordionTrigger>{branchData.branch_name}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 font-semibold p-2 border-b">
                            <div>Producto</div>
                            <div className="text-right">Comisión (%)</div>
                          </div>
                          {branchData.products.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay productos asignados a esta sucursal.</p>
                          ) : (
                            branchData.products.map((product) => (
                              <div key={product.product_id} className="grid grid-cols-2 gap-4 items-center p-2 rounded-lg hover:bg-muted">
                                <div>{product.product_name}</div>
                                <div className="flex justify-end">
                                  <Input
                                  type="number"
                                  value={
                                    pendingChanges[branchData.branch_id]?.products[product.product_id]?.commission_rate ??
                                    product.commission_rate ??
                                    0
                                  }
                                  onChange={(e) => handleCommissionChange(product.product_id, branchData.branch_id, 'product', parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                  disabled={updateCommissionMutation.isPending}
                                />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button
                            onClick={() => handleSaveBranchCommissions(branchData.branch_id)}
                            disabled={!pendingChanges[branchData.branch_id] || updateCommissionMutation.isPending}
                          >
                            {updateCommissionMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            {/* SERVICES TAB */}
            <TabsContent value="services" className="flex-grow overflow-auto p-4">
              {groupedCommissionsByBranch.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No hay servicios disponibles para este usuario en la(s) sucursal(es) seleccionada(s).</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {groupedCommissionsByBranch.map((branchData) => (
                    <AccordionItem value={branchData.branch_id} key={branchData.branch_id}>
                      <AccordionTrigger>{branchData.branch_name}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-4 font-semibold p-2 border-b">
                            <div>Servicio</div>
                            <div className="text-center">Puede Realizar</div>
                            <div className="text-right">Comisión (%)</div>
                          </div>
                          {branchData.services.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay servicios asignados a esta sucursal.</p>
                          ) : (
                            branchData.services.map((service) => (
                              <div key={service.service_id} className="grid grid-cols-3 gap-4 items-center p-2 rounded-lg hover:bg-muted">
                                <div>{service.service_name}</div>
                                <div className="flex justify-center">
                                  <Switch
                                  checked={
                                    pendingChanges[branchData.branch_id]?.services[service.service_id]?.can_perform ??
                                    service.can_perform ??
                                    false
                                  }
                                  onCheckedChange={(checked) => {
                                    const commissionRate = pendingChanges[branchData.branch_id]?.services[service.service_id]?.commission_rate ?? service.commission_rate ?? 0;
                                    handleCommissionChange(service.service_id, branchData.branch_id, 'service', commissionRate, checked);
                                  }}
                                  disabled={updateCommissionMutation.isPending}
                                />
                                </div>
                                <div className="flex justify-end">
                                  <Input
                                  type="number"
                                  value={
                                    pendingChanges[branchData.branch_id]?.services[service.service_id]?.commission_rate ??
                                    service.commission_rate ??
                                    0
                                  }
                                  onChange={(e) => {
                                    const canPerform = pendingChanges[branchData.branch_id]?.services[service.service_id]?.can_perform ?? service.can_perform ?? false;
                                    handleCommissionChange(service.service_id, branchData.branch_id, 'service', parseFloat(e.target.value) || 0, canPerform);
                                  }}
                                  className="w-24 text-right"
                                  disabled={updateCommissionMutation.isPending}
                                />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button
                            onClick={() => handleSaveBranchCommissions(branchData.branch_id)}
                            disabled={!pendingChanges[branchData.branch_id] || updateCommissionMutation.isPending}
                          >
                            {updateCommissionMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                          </Button>
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