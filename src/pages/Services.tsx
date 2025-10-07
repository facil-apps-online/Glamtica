import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Scissors, Clock, DollarSign, Edit, Settings, Users, Share2, Search, MoreHorizontal, ListFilter } from "lucide-react";
import { useMasterServices, useUpdateMasterService, MasterService } from "@/hooks/useServices";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { MasterServiceDialog } from "@/components/MasterServiceDialog";
import { ServiceCategoryManagementDialog } from "@/components/ServiceCategoryManagementDialog";
import AssignServicesToBranchDialog from "@/components/AssignServicesToBranchDialog";
import ManageServicePricesDialog from "@/components/ManageServicePricesDialog";
import { useState } from "react";
import { ManageServiceCommissionsDialog } from "@/components/ManageServiceCommissionsDialog";
import { useScreenSize } from "@/hooks/useScreenSize";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const ServiceCard = ({ service, category, formatPrice, handleToggleStatus, handleOpenAssignServiceDialog, handleOpenManagePricesDialog, handleOpenServiceCommissionsDialog }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle>{service.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenAssignServiceDialog(service)}>
              <Share2 className="w-4 h-4 mr-2" />
              Asignar a Sucursales
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenManagePricesDialog(service)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Gestionar Precios
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenServiceCommissionsDialog(service)}>
              <Users className="w-4 h-4 mr-2" />
              Gestionar Comisiones
            </DropdownMenuItem>
            <MasterServiceDialog service={service} trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="w-4 h-4 mr-2" />
                <span>Editar</span>
              </DropdownMenuItem>
            } />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 pt-4">
      <div className="flex justify-between items-start gap-4">
        <span className="text-muted-foreground text-sm">Descripción</span>
        <span className="text-sm text-right">{service.description || "-"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Categoría</span>
        <span>{category ? <Badge variant="secondary">{category.name}</Badge> : "N/A"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Duración</span>
        <span className="text-sm">{service.duration_minutes ? `${service.duration_minutes} min` : "N/A"}</span>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3 mt-4">
        <label className="text-sm font-medium">Activo</label>
        <Switch
          checked={service.is_active || false}
          onCheckedChange={() => handleToggleStatus(service)}
        />
      </div>
    </CardContent>
  </Card>
);

const ServiceCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <Skeleton className="h-6 w-3/4" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="h-10 w-full mt-4 rounded-md border flex items-center justify-between p-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
    </CardContent>
  </Card>
);

const ServiceTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead colSpan={2}>Servicio</TableHead>
        <TableHead>Categoría</TableHead>
        <TableHead>Duración</TableHead>
        <TableHead>Activo</TableHead>
        <TableHead>Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={2}>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-12" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { data: categories } = useServiceCategories();
  const { data: services, isLoading, refetch } = useMasterServices(confirmedSearchTerm, showInactive, filterCategory);
  const { mutate: updateService } = useUpdateMasterService();
  const { data: allServices, isLoading: isLoadingAllServices } = useMasterServices();
  const [isAssignServiceDialogOpen, setIsAssignServiceDialogOpen] = useState(false);
  const [selectedServiceForAssignment, setSelectedServiceForAssignment] = useState<MasterService | null>(null);
  const [isManagePricesDialogOpen, setIsManagePricesDialogOpen] = useState(false);
  const [selectedServiceForPrices, setSelectedServiceForPrices] = useState<MasterService | null>(null);
  const [isServiceCommissionsDialogOpen, setIsServiceCommissionsDialogOpen] = useState(false);
  const [selectedServiceForCommissions, setSelectedServiceForCommissions] = useState<MasterService | null>(null);

  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';

  const filteredServices = services;

  const handleToggleStatus = (service: MasterService) => {
    updateService({ id: service.id, updates: { is_active: !service.is_active } }, {
      onSuccess: () => refetch(),
    });
  };

  const handleOpenAssignServiceDialog = (service: MasterService) => {
    setSelectedServiceForAssignment(service);
    setIsAssignServiceDialogOpen(true);
  };

  const handleAssignServiceSuccess = () => {
    setSelectedServiceForAssignment(null);
    setIsAssignServiceDialogOpen(false);
  };

  const handleOpenManagePricesDialog = (service: MasterService) => {
    setSelectedServiceForPrices(service);
    setIsManagePricesDialogOpen(true);
  };

  const handleManagePricesSuccess = () => {
    setSelectedServiceForPrices(null);
    setIsManagePricesDialogOpen(false);
  };

  const handleOpenServiceCommissionsDialog = (service: MasterService) => {
    setSelectedServiceForCommissions(service);
    setIsServiceCommissionsDialogOpen(true);
  };

  const handleServiceCommissionsSuccess = () => {
    setSelectedServiceForCommissions(null);
    setIsServiceCommissionsDialogOpen(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return isMobile 
        ? <div className="space-y-4 p-4">{[...Array(5)].map((_, i) => <ServiceCardSkeleton key={i} />)}</div>
        : <ServiceTableSkeleton />;
    }

    if (filteredServices?.length === 0) {
      return (
        <EmptyState
          Icon={Scissors}
          title="No hay servicios"
          description={
            filterCategory === "" 
              ? "No tienes servicios creados aún o no coinciden con los filtros aplicados."
              : `No hay servicios en la categoría seleccionada que coincidan con los filtros.`
          }
          action={
            allServices?.length === 0 ? (
              <MasterServiceDialog trigger={<Button>Crear Nuevo Servicio</Button>} />
            ) : null
          }
        />
      );
    }

    return isMobile ? (
      <div className="space-y-4 p-4">
        {filteredServices?.map((service) => {
          const category = categories?.find(cat => cat.id === service.category_id);
          return (
            <ServiceCard
              key={service.id}
              service={service}
              category={category}
              handleToggleStatus={handleToggleStatus}
              handleOpenAssignServiceDialog={handleOpenAssignServiceDialog}
              handleOpenManagePricesDialog={handleOpenManagePricesDialog}
              handleOpenServiceCommissionsDialog={handleOpenServiceCommissionsDialog}
            />
          );
        })}
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Servicio</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredServices?.map((service) => {
            const category = categories?.find(cat => cat.id === service.category_id);
            return (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="font-medium">{service.name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">{service.description || "-"}</div>
                </TableCell>
                <TableCell>{category ? <Badge variant="secondary">{category.name}</Badge> : "N/A"}</TableCell>
                <TableCell>{service.duration_minutes ? `${service.duration_minutes} min` : "N/A"}</TableCell>
                <TableCell>
                  <Switch
                    checked={service.is_active || false}
                    onCheckedChange={() => handleToggleStatus(service)}
                  />
                </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenAssignServiceDialog(service)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Asignar a Sucursales
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenManagePricesDialog(service)}>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Gestionar Precios
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenServiceCommissionsDialog(service)}>
                              <Users className="w-4 h-4 mr-2" />
                              Gestionar Comisiones
                            </DropdownMenuItem>
                            <MasterServiceDialog service={service} trigger={
                                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                  <Edit className="w-4 h-4 mr-2" />
                                  <span>Editar</span>
                                </div>
                              } />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Servicios" subtitle="Gestiona los servicios del salón y las comisiones de estilistas">
        <div className="flex gap-2">
          <ServiceCategoryManagementDialog trigger={
            <Button variant="outline" size="sm">
              <ListFilter className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Gestionar Categorías</span>
            </Button>
          } />
          
          <MasterServiceDialog trigger={
            <Button size="sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Nuevo Servicio</span>
            </Button>
          } />
        </div>
      </PageHeader>

      <Card className="mt-4">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
             <Input
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:col-span-3"
              />
              <Button onClick={() => setConfirmedSearchTerm(searchTerm)} className="md:col-span-1">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-4">
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories?.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <span className="text-sm text-muted-foreground">Mostrar inactivos</span>
              </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      {selectedServiceForAssignment && (
        <AssignServicesToBranchDialog
          isOpen={isAssignServiceDialogOpen}
          onOpenChange={setIsAssignServiceDialogOpen}
          service={selectedServiceForAssignment}
          onSuccess={handleAssignServiceSuccess}
        />
      )}
      {selectedServiceForPrices && (
        <ManageServicePricesDialog
          isOpen={isManagePricesDialogOpen}
          onOpenChange={setIsManagePricesDialogOpen}
          service={selectedServiceForPrices}
          onSuccess={handleManagePricesSuccess}
        />
      )}
      {selectedServiceForCommissions && (
        <ManageServiceCommissionsDialog
          isOpen={isServiceCommissionsDialogOpen}
          onOpenChange={setIsServiceCommissionsDialogOpen}
          serviceId={selectedServiceForCommissions.id}
          serviceName={selectedServiceForCommissions.name}
          onSuccess={handleServiceCommissionsSuccess}
        />
      )}
    </div>
  );
}