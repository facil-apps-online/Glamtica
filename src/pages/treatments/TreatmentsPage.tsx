import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ListFilter } from "lucide-react";
import { useTreatments, Treatment } from "@/hooks/useTreatments";
import { useTreatmentCategories } from "@/hooks/useTreatmentCategories";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { TreatmentCard } from "@/components/treatments/TreatmentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { TreatmentFormDialog } from "@/components/treatments/TreatmentFormDialog";
import { TreatmentCategoryManagementDialog } from "@/components/treatments/TreatmentCategoryManagementDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const TreatmentsPage: React.FC = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { data: categories } = useTreatmentCategories();
  const { data: treatments, isLoading, refetch } = useTreatments(tenantId || '', 'treatment', filterCategory, showInactive);

  const handleMutationSuccess = () => {
    refetch();
    setIsFormOpen(false);
  };
  
  const handleCreate = () => {
    setSelectedTreatment(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setIsFormOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
          ))}
        </div>
      );
    }

    if (!Array.isArray(treatments) || treatments.length === 0) {
      return (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold">No has creado ningún tratamiento todavía.</h3>
          <p className="text-muted-foreground mt-2">Empieza a crear uno para poder asignarlo a tus clientes.</p>
          <Button onClick={handleCreate} className="mt-6">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Primer Tratamiento
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {treatments.map((treatment) => (
          <TreatmentCard
            key={treatment.id}
            treatment={treatment}
            onEdit={handleEdit}
            onDelete={refetch}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <TreatmentFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleMutationSuccess}
        treatment={selectedTreatment}
      />
      <div className="space-y-8">
        <PageHeader
          title="Tratamientos"
          subtitle="Crea y gestiona los tratamientos complejos de tu negocio."
        >
          <div className="flex gap-2">
            <TreatmentCategoryManagementDialog trigger={
              <Button variant="outline" size="sm">
                <ListFilter className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Categorías</span>
              </Button>
            } />
            <Button onClick={handleCreate} size="sm">
              <span className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tratamiento
              </span>
            </Button>
          </div>
        </PageHeader>
        
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
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
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive" className="text-sm">Mostrar inactivos</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {renderContent()}
      </div>
    </>
  );
};

export default TreatmentsPage;
