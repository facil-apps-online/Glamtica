
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Scissors, Clock, DollarSign, Edit, Settings, Users } from "lucide-react";
import { useServices, useToggleServiceStatus } from "@/hooks/useServices";
import { useServiceCategories, useToggleServiceCategoryStatus } from "@/hooks/useServiceCategories";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ServiceDialog } from "@/components/ServiceDialog";
import { ServiceCategoryDialog } from "@/components/ServiceCategoryDialog";
import { ServiceCommissionsDialog } from "@/components/ServiceCommissionsDialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Services() {
  const { data: services, isLoading } = useServices();
  const { data: categories } = useServiceCategories();
  const toggleStatusMutation = useToggleServiceStatus();
  const toggleCategoryStatusMutation = useToggleServiceCategoryStatus();
  const { formatPrice } = usePriceFormat();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const filteredServices = services?.filter(service => {
    if (selectedCategory === "Todos") return true;
    if (selectedCategory === "Sin categoría") return !service.category_id;
    return service.category_id === selectedCategory;
  });

  const handleToggleStatus = (serviceId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id: serviceId, is_active: !currentStatus });
  };

  const handleToggleCategoryStatus = (categoryId: string, currentStatus: boolean) => {
    toggleCategoryStatusMutation.mutate({ id: categoryId, is_active: !currentStatus });
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

  const categoryOptions = [
    "Todos",
    ...(categories?.map(cat => cat.id) || []),
    "Sin categoría"
  ];

  const getCategoryName = (categoryId: string) => {
    if (categoryId === "Todos") return "Todos";
    if (categoryId === "Sin categoría") return "Sin categoría";
    return categories?.find(cat => cat.id === categoryId)?.name || "Desconocida";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Servicios
          </h1>
          <p className="text-slate-600 mt-2">
            Gestiona los servicios del salón y las comisiones de estilistas
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Gestionar Categorías
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Gestionar Categorías de Servicios</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <ServiceCategoryDialog />
                </div>
                <div className="grid gap-3">
                  {categories?.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-slate-600">{category.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <Switch
                          checked={category.is_active}
                          onCheckedChange={() => handleToggleCategoryStatus(category.id, category.is_active)}
                          disabled={toggleCategoryStatusMutation.isPending}
                        />
                        <ServiceCategoryDialog 
                          category={category}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <ServiceDialog />
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        {categoryOptions.map((categoryId) => (
          <Button 
            key={categoryId} 
            variant={selectedCategory === categoryId ? "default" : "outline"} 
            className="hover:bg-blue-50"
            onClick={() => setSelectedCategory(categoryId)}
          >
            {getCategoryName(categoryId)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices?.map((service) => (
          <Card key={service.id} className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={service.is_active ? "default" : "secondary"}>
                    {service.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={() => handleToggleStatus(service.id, service.is_active)}
                    disabled={toggleStatusMutation.isPending}
                  />
                </div>
              </div>
              <CardTitle className="text-xl">{service.name}</CardTitle>
              {service.service_categories && (
                <Badge variant="outline" className="w-fit">
                  {service.service_categories.name}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {service.description && (
                <p className="text-slate-600 text-sm">{service.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{service.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">{formatPrice(service.price)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <ServiceDialog 
                  service={service}
                  trigger={
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  }
                />
                <ServiceCommissionsDialog
                  serviceId={service.id}
                  serviceName={service.name}
                  trigger={
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-1" />
                      Comisiones
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices?.length === 0 && (
        <div className="text-center py-12">
          <Scissors className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay servicios</h3>
          <p className="text-slate-600 mb-4">
            {selectedCategory === "Todos" 
              ? "No tienes servicios creados aún." 
              : `No hay servicios en la categoría "${getCategoryName(selectedCategory)}".`
            }
          </p>
          <ServiceDialog />
        </div>
      )}
    </div>
  );
}
