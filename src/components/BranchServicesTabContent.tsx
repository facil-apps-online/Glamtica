import React, { useState } from "react";
import { Package, Edit, Link, PlusCircle, DollarSign } from "lucide-react";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ManageServiceInBranchDialog } from "@/components/ManageServiceInBranchDialog";
import AddServicesToBranchDialog from "@/components/AddServicesToBranchDialog";
import BulkEditBranchServicePricesDialog from "@/components/BulkEditBranchServicePricesDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useBranchServicesAndCombos, useUpdateBranchService, BranchService } from "@/hooks/useServices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScreenSize } from "@/hooks/useScreenSize";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const BranchServiceCard = ({ service, formatPrice, handleToggleStatus }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle>{service.name}</CardTitle>
          {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
        </div>
        <Switch
          checked={service.is_branch_active}
          onCheckedChange={() => handleToggleStatus(service)}
        />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Duración</span>
        <span>{service.duration_minutes ? `${service.duration_minutes} min` : "N/A"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Precio de Venta</span>
        <span>{formatPrice(service.selling_price)}</span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="ml-2">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ManageServiceInBranchDialog service={service} trigger={
                <div className="flex items-center w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  <span>Gestionar</span>
                </div>
              } />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
  const { data: branchServicesAndCombos, isLoading: isLoadingServices } = useBranchServicesAndCombos(branchId);
  const branchServices = branchServicesAndCombos?.filter(item => item.type === 'service') || [];
  const { mutate: updateBranchService } = useUpdateBranchService();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';

  const handleToggleStatus = (service: BranchService) => {
    updateBranchService({
      id: service.branch_service_id,
      updates: { is_branch_active: !service.is_branch_active }
    });
  };

  const handleAddServiceSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_services', branchId] });
  };

  const handleBulkEditPricesSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_services', branchId] });
  };

  if (!branchId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Link className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error: ID de sucursal no proporcionado</h3>
        <p>No se pueden cargar los servicios sin un ID de sucursal válido.</p>
      </div>
    );
  }

  if (isLoadingServices) {
    return <div className="text-center p-8">Cargando servicios de la sucursal...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Servicios de la Sucursal</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsBulkEditPricesDialogOpen(true)} disabled={!branchServices || branchServices.length === 0}>
            <DollarSign className="mr-2 h-4 w-4" />
            Editar Precios Masivamente
          </Button>
          <Button size="sm" onClick={() => setIsAddServiceDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Servicios
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isMobile ? (
          <div className="space-y-4 p-4">
            {branchServices?.map((service: BranchService) => (
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
                <TableHead>Duración (min)</TableHead>
                <TableHead>Precio de Venta</TableHead>
                <TableHead>Estado en Sucursal</TableHead>
                
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchServices?.map((service: BranchService) => (
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
                  
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {branchServices?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay servicios en esta sucursal</h3>
            <p>Asigna servicios desde el catálogo para empezar a ofrecerlos.</p>
          </div>
        )}
      </CardContent>
      <AddServicesToBranchDialog
        isOpen={isAddServiceDialogOpen}
        onOpenChange={setIsAddServiceDialogOpen}
        branchId={branchId}
        onSuccess={handleAddServiceSuccess}
      />
      {branchServices && branchServices.length > 0 && (
        <BulkEditBranchServicePricesDialog
          isOpen={isBulkEditPricesDialogOpen}
          onOpenChange={setIsBulkEditPricesDialogOpen}
          branchId={branchId}
          branchServices={branchServices}
          onSuccess={handleBulkEditPricesSuccess}
        />
      )}
    </Card>
  );
};

export default BranchServicesTabContent;
