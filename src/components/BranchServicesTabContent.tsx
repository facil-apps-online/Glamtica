import React, { useState, useMemo } from "react";
import { Wrench, Edit, Link, PlusCircle, DollarSign, MoreHorizontal, Search, Plus } from "lucide-react";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ManageServiceInBranchDialog } from "@/components/ManageServiceInBranchDialog";
import AddServicesToBranchDialog from "@/components/AddServicesToBranchDialog";
import BulkEditBranchServicePricesDialog from "@/components/BulkEditBranchServicePricesDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useBranchServicesAndCombos, useUpdateBranchService, BranchService } from "@/hooks/useServices";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const ServicesTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Servicio</TableHead>
        <TableHead>Duración</TableHead>
        <TableHead>Precio</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-12" /></TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const ServiceCardSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full mt-2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const BranchServiceCard = ({ service, formatPrice, handleToggleStatus }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-base">{service.name}</CardTitle>
          {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ManageServiceInBranchDialog service={service} trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="w-4 h-4 mr-2" />
                <span>Gestionar</span>
              </DropdownMenuItem>
            } />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Duración</span>
        <span>{service.duration_minutes ? `${service.duration_minutes} min` : "N/A"}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Precio de Venta</span>
        <span>{formatPrice(service.selling_price)}</span>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <label className="text-sm font-medium">Activo en Sucursal</label>
        <Switch
          checked={service.is_branch_active}
          onCheckedChange={() => handleToggleStatus(service)}
        />
      </div>
    </CardContent>
  </Card>
);

interface BranchServicesTabContentProps {
  branchId: string;
}

const BranchServicesTabContent: React.FC<BranchServicesTabContentProps> = ({ branchId }) => {
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isBulkEditPricesDialogOpen, setIsBulkEditPricesDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: branchServicesAndCombos, isLoading: isLoadingServices } = useBranchServicesAndCombos(branchId);
  const branchServices = branchServicesAndCombos?.filter(item => item.type === 'service') || [];
  const { mutate: updateBranchService } = useUpdateBranchService();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const handleToggleStatus = (service: BranchService) => {
    updateBranchService({
      id: service.branch_service_id,
      updates: { is_branch_active: !service.is_branch_active }
    });
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_services', branchId] });
  };

  const filteredServices = useMemo(() => {
    if (!branchServices) return [];
    return branchServices.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branchServices, searchTerm]);

  if (!branchId) {
    return (
      <EmptyState
        Icon={Link}
        title="Error: ID de sucursal no proporcionado"
        description="No se pueden cargar los servicios sin un ID de sucursal válido."
      />
    );
  }

  const renderContent = () => {
    if (isLoadingServices) {
      return isMobile ? <ServiceCardSkeleton /> : <ServicesTableSkeleton />;
    }

    if (filteredServices.length === 0) {
      return (
        <EmptyState
          Icon={Wrench}
          title={searchTerm ? "No se encontraron servicios" : "No hay servicios en esta sucursal"}
          description={searchTerm ? "Intenta con otro término de búsqueda." : "Asigna servicios desde el catálogo para empezar a ofrecerlos."}
          action={!searchTerm && (
            <Button onClick={() => setIsAddServiceDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2"/>Añadir Servicios
            </Button>
          )}
        />
      );
    }

    return isMobile ? (
      <div className="space-y-4">
        {filteredServices.map((service: BranchService) => (
          <BranchServiceCard 
            key={service.branch_service_id} 
            service={service} 
            formatPrice={formatPrice} 
            handleToggleStatus={handleToggleStatus} 
          />
        ))}
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Servicio</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredServices.map((service: BranchService) => (
            <TableRow key={service.branch_service_id}>
              <TableCell>
                <div className="font-medium">{service.name}</div>
                {service.description && <div className="text-sm text-muted-foreground">{service.description}</div>}
              </TableCell>
              <TableCell>{service.duration_minutes ? `${service.duration_minutes} min` : "N/A"}</TableCell>
              <TableCell>{formatPrice(service.selling_price)}</TableCell>
              <TableCell>
                <Switch
                  checked={service.is_branch_active}
                  onCheckedChange={() => handleToggleStatus(service)}
                />
              </TableCell>
              <TableCell className="text-right">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ManageServiceInBranchDialog service={service} trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="w-4 h-4 mr-2" />
                        <span>Gestionar</span>
                      </DropdownMenuItem>
                    } />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
                <Wrench className="h-5 w-5" />
                Servicios
            </CardTitle>
            <CardDescription>Añade, edita y gestiona los servicios disponibles en esta sucursal.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsBulkEditPricesDialogOpen(true)} disabled={!branchServices || branchServices.length === 0}>
              <DollarSign className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar Precios</span>
            </Button>
            <Button size="sm" onClick={() => setIsAddServiceDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Añadir</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o descripción..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      <AddServicesToBranchDialog
        isOpen={isAddServiceDialogOpen}
        onOpenChange={setIsAddServiceDialogOpen}
        branchId={branchId}
        onSuccess={handleSuccess}
      />
      {branchServices && branchServices.length > 0 && (
        <BulkEditBranchServicePricesDialog
          isOpen={isBulkEditPricesDialogOpen}
          onOpenChange={setIsBulkEditPricesDialogOpen}
          branchId={branchId}
          branchServices={branchServices}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default BranchServicesTabContent;