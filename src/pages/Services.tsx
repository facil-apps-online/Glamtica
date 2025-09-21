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
import { Plus, Scissors, Clock, DollarSign, Edit, Settings, Users, Share2, Search } from "lucide-react";
import { useMasterServices, useUpdateMasterService, MasterService } from "@/hooks/useServices";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { MasterServiceDialog } from "@/components/MasterServiceDialog";
import { ServiceCategoryManagementDialog } from "@/components/ServiceCategoryManagementDialog";
import AssignServicesToBranchDialog from "@/components/AssignServicesToBranchDialog";
import ManageServicePricesDialog from "@/components/ManageServicePricesDialog";
import { useState } from "react";
import { ManageServiceCommissionsDialog } from "@/components/ManageServiceCommissionsDialog"; // NEW IMPORT
import { useScreenSize } from "@/hooks/useScreenSize";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const ServiceCard = ({ service, category, formatPrice, handleToggleStatus, handleOpenAssignServiceDialog, handleOpenManagePricesDialog, handleOpenServiceCommissionsDialog }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle>{service.name}</CardTitle>
          {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
        </div>
        <Switch
          checked={service.is_active || false}
          onCheckedChange={() => handleToggleStatus(service)}
        />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Categoría</span>
        <span>{category ? <Badge variant="secondary">{category.name}</Badge> : "N/A"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Duración</span>
        <span>{service.duration_minutes ? `${service.duration_minutes} min` : "N/A"}</span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 h-4" />
              <span className="ml-2">Acciones</span>
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
            <DropdownMenuItem>
              <MasterServiceDialog service={service} trigger={
                <div className="flex items-center w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  <span>Editar</span>
                </div>
              } />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardContent>
  </Card>
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

  // NEW STATE FOR COMMISSIONS DIALOG
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

  // NEW HANDLERS FOR COMMISSIONS DIALOG
  const handleOpenServiceCommissionsDialog = (service: MasterService) => {
    setSelectedServiceForCommissions(service);
    setIsServiceCommissionsDialogOpen(true);
  };

  const handleServiceCommissionsSuccess = () => {
    setSelectedServiceForCommissions(null);
    setIsServiceCommissionsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Servicios
          </h1>
          <p className="text-slate-600 mt-2">
            Gestiona los servicios del salón y las comisiones de estilistas
          </p>
        </div>
        <div className="flex gap-2">
          <ServiceCategoryManagementDialog trigger={
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Gestionar Categorías
            </Button>
          } />
          
          <MasterServiceDialog trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </Button>
          } />
        </div>
      </div>

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
          {isMobile ? (
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
                  <TableHead colSpan={2}>Servicio</TableHead>
                  <TableHead className="w-px">Categoría</TableHead>
                  <TableHead className="w-px">Duración</TableHead>
                  
                  <TableHead className="w-px">Activo</TableHead>
                  <TableHead className="w-px">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices?.map((service) => {
                  const category = categories?.find(cat => cat.id === service.category_id);
                  
                  return (
                    <TableRow key={service.id}>
                      <TableCell colSpan={2}>
                        <div className="font-medium">{service.name}</div>
                        {service.description && <div className="text-sm text-muted-foreground">{service.description}</div>}
                      </TableCell>
                      <TableCell>{category ? <Badge variant="secondary">{category.name}</Badge> : "N/A"}</TableCell>
                      <TableCell>{service.duration_minutes ? `${service.duration_minutes} min` : "N/A"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={service.is_active || false}
                          onCheckedChange={() => handleToggleStatus(service)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MasterServiceDialog service={service} trigger={
                            <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                          } />
                          <Button variant="outline" size="sm" onClick={() => handleOpenAssignServiceDialog(service)}>
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenManagePricesDialog(service)}>
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          {/* OLD ServiceCommissionsDialog REMOVED */}
                          <Button variant="outline" size="sm" onClick={() => handleOpenServiceCommissionsDialog(service)}>
                            <Users className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          
          {filteredServices?.length === 0 && (
            <div className="text-center py-12">
              <Scissors className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-bold text-primary mb-2">No hay servicios</h3>
              <p className="text-slate-600 mb-4">
                {filterCategory === "" 
                  ? "No tienes servicios creados aún o no coinciden con los filtros aplicados."
                  : `No hay servicios en la categoría seleccionada que coincidan con los filtros.`
                }
              </p>
              {allServices?.length === 0 && (
                <MasterServiceDialog trigger={<Button>Crear Nuevo Servicio</Button>} />
              )}
            </div>
          )}
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
      {/* NEW DIALOG INTEGRATION */}
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