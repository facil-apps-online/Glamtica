
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Scissors, DollarSign, Edit, Users, Share2, Search, MoreHorizontal, ListFilter, FileEdit, Trash2 } from "lucide-react";
import { useMasterServices, useUpdateMasterService, useDeleteMasterService, MasterService } from "@/hooks/useServices";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { MasterServiceDialog } from "@/components/MasterServiceDialog";
import { ServiceCategoryManagementDialog } from "@/components/ServiceCategoryManagementDialog";
import AssignServicesToBranchDialog from "@/components/AssignServicesToBranchDialog";
import ManageServicePricesDialog from "@/components/ManageServicePricesDialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManageServiceCommissionsDialog } from "@/components/ManageServiceCommissionsDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ServiceCard = ({ service, category, handleToggleStatus, handleOpenAssignServiceDialog, handleOpenManagePricesDialog, handleOpenServiceCommissionsDialog, navigate, handleDelete }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDialogOpen) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="switch"]') ||
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }
    navigate(`/app/services/${service.id}`);
  };

  return (
  <Card onClick={handleCardClick} className="cursor-pointer transition-colors hover:bg-muted/50">
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle>{service.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <MasterServiceDialog 
              service={service} 
              onOpenChange={setIsDialogOpen}
              trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="w-4 h-4 mr-2" />
                <span>Edición rápida</span>
              </DropdownMenuItem>
            } />
            <DropdownMenuItem onClick={() => navigate(`/app/services/${service.id}`)}>
              <FileEdit className="w-4 h-4 mr-2" />
              Edición Completa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres eliminar <strong>{service.name}</strong>? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(service.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
        <Switch checked={service.is_active || false} onCheckedChange={() => handleToggleStatus(service)} />
      </div>
    </CardContent>
  </Card>
  );
}

const ServiceCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full"><Skeleton className="h-6 w-3/4" /></div>
        <Skeleton className="h-8 w-8" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
      <div className="flex justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-16" /></div>
      <div className="h-10 w-full mt-4 rounded-md border flex items-center justify-between p-3"><Skeleton className="h-5 w-16" /><Skeleton className="h-6 w-12" /></div>
    </CardContent>
  </Card>
);



export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const navigate = useNavigate();
  const { data: categories } = useServiceCategories();
  const { data: services, isLoading, refetch } = useMasterServices(confirmedSearchTerm, showInactive, filterCategory);
  const { mutate: updateService } = useUpdateMasterService();
  const { mutate: deleteService } = useDeleteMasterService();
  const { data: allServices } = useMasterServices();
  
  const [isAssignServiceDialogOpen, setIsAssignServiceDialogOpen] = useState(false);
  const [selectedServiceForAssignment, setSelectedServiceForAssignment] = useState<MasterService | null>(null);
  const [isManagePricesDialogOpen, setIsManagePricesDialogOpen] = useState(false);
  const [selectedServiceForPrices, setSelectedServiceForPrices] = useState<MasterService | null>(null);
  const [isServiceCommissionsDialogOpen, setIsServiceCommissionsDialogOpen] = useState(false);
  const [selectedServiceForCommissions, setSelectedServiceForCommissions] = useState<MasterService | null>(null);

  const handleToggleStatus = (service: MasterService) => {
    updateService({ id: service.id, updates: { is_active: !service.is_active } }, { onSuccess: () => refetch() });
  };

  const handleDelete = (serviceId: string) => {
    deleteService(serviceId, { onSuccess: () => refetch() });
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
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {[...Array(6)].map((_, i) => <ServiceCardSkeleton key={i} />)}
        </div>
      );
    }

    if (services?.length === 0) {
      return (
        <EmptyState
          Icon={Scissors}
          title="No hay servicios"
          description={ allServices?.length === 0 ? "Crea tu primer servicio para empezar a gestionar tu negocio." : "No se encontraron servicios que coincidan con tu búsqueda." }
          action={ allServices?.length === 0 ? <MasterServiceDialog trigger={<Button>Crear Nuevo Servicio</Button>} /> : null }
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {services?.map((service) => {
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
              navigate={navigate}
              handleDelete={handleDelete}
            />
          );
        })}
      </div>
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
