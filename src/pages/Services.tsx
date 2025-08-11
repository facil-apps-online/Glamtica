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
import { Plus, Scissors, Clock, DollarSign, Edit, Settings, Users, Share2 } from "lucide-react";
import { useMasterServices, useUpdateMasterService, MasterService } from "@/hooks/useServices";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { MasterServiceDialog } from "@/components/MasterServiceDialog";
import { ServiceCommissionsDialog } from "@/components/ServiceCommissionsDialog";
import { ServiceCategoryManagementDialog } from "@/components/ServiceCategoryManagementDialog";
import AssignServicesToBranchDialog from "@/components/AssignServicesToBranchDialog";
import ManageServicePricesDialog from "@/components/ManageServicePricesDialog";
import { useState } from "react";

export default function Services() {
  const { data: services, isLoading } = useMasterServices();
  
  const { data: categories } = useServiceCategories();
  const toggleStatusMutation = useUpdateMasterService();
  const { formatPrice } = usePriceFormat();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isAssignServiceDialogOpen, setIsAssignServiceDialogOpen] = useState(false);
  const [selectedServiceForAssignment, setSelectedServiceForAssignment] = useState<MasterService | null>(null);
  const [isManagePricesDialogOpen, setIsManagePricesDialogOpen] = useState(false);
  const [selectedServiceForPrices, setSelectedServiceForPrices] = useState<MasterService | null>(null);

  const filteredServices = services?.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || service.category_id === filterCategory;
    const matchesStatus = showInactive || service.is_active;

    return matchesSearch && matchesCategory && matchesStatus;
  });

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
              />
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
                        onCheckedChange={() => handleToggleStatus(service.id, service.is_active)}
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
                        <ServiceCommissionsDialog
                          serviceId={service.id}
                          serviceName={service.name}
                          trigger={
                            <Button variant="outline" size="sm"><Users className="w-4 h-4" /></Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          </CardContent>
      </Card>

      {filteredServices?.length === 0 && (
        <div className="text-center py-12">
          <Scissors className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No hay servicios</h3>
          <p className="text-slate-600 mb-4">
            {filterCategory === "" 
              ? "No tienes servicios creados aún o no coinciden con los filtros aplicados." 
              : `No hay servicios en la categoría seleccionada que coincidan con los filtros.`
            }
          </p>
          <MasterServiceDialog />
        </div>
      )}
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
    </div>
  );
}