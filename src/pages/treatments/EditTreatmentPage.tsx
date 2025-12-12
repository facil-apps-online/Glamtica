import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTreatmentDetails, useUpdateTreatment, Treatment } from '@/hooks/useTreatments';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatterBox } from '@/components/ChatterBox';
import { TreatmentImageGallery } from '@/components/treatments/TreatmentImageGallery';
import { ManageTreatmentImagesDialog } from '@/components/treatments/ManageTreatmentImagesDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TreatmentForm } from '@/components/treatments/TreatmentForm';
import { fetchTenantAction } from '@/lib/fetchTenantAction';
import { useToast } from '@/hooks/use-toast';

const EditTreatmentPage = () => {
  const { treatmentId } = useParams<{ treatmentId: string }>();
  if (!treatmentId) {
      return <div>ID de tratamiento no proporcionado.</div>;
  }
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");

  const { data: treatment, isLoading: isLoadingTreatment, refetch } = useTreatmentDetails(treatmentId);
  const { mutate: updateTreatment, isPending: isUpdating } = useUpdateTreatment();

  const handleCategoryUpdates = async (newCategoryIds: string[]) => {
    const originalCategoryIds = (treatment?.categories || []).map(c => c.id).sort();
    const sortedNewCategoryIds = [...newCategoryIds].sort();

    if (JSON.stringify(originalCategoryIds) !== JSON.stringify(sortedNewCategoryIds)) {
        try {
            await fetchTenantAction('update_treatment_category_assignments', {
              treatment_id: treatmentId,
              category_ids: newCategoryIds,
            });
            // Invalidate details to refetch categories
            refetch();
        } catch (error: any) {
            toast({ title: "Error", description: `Error al actualizar categorías: ${error.message}`, variant: "destructive" });
        }
    }
  }

  const handleSave = (data: any, categoryIds: string[]) => {
    updateTreatment({ id: treatmentId, updates: data }, {
      onSuccess: () => {
        handleCategoryUpdates(categoryIds);
      }
    });
  };

  if (isLoadingTreatment) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
                <div>
                    <Skeleton className="h-screen w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (!treatment) {
    return <div>Tratamiento no encontrado.</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title={treatment.name}
        subtitle="Gestiona todos los aspectos del tratamiento."
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate('/app/treatments')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="images">Imágenes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <Card>
                  <CardHeader><CardTitle>Detalles del Tratamiento</CardTitle></CardHeader>
                  <CardContent>
                    <TreatmentForm
                        treatment={treatment}
                        onSave={handleSave}
                        isSaving={isUpdating}
                        submitButtonText="Guardar Tratamiento"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="images">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Imágenes del Tratamiento</CardTitle>
                    <ManageTreatmentImagesDialog
                      treatmentId={treatment.id}
                      treatmentName={treatment.name}
                      trigger={<Button variant="outline">Gestionar Imágenes</Button>}
                    />
                  </CardHeader>
                  <CardContent>
                    <TreatmentImageGallery treatmentId={treatment.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
        <div>
          <ChatterBox resourceType="treatments" resourceId={treatment.id} tenantId={treatment.tenant_id} containerClassName="h-[calc(100vh-22rem)]" />
        </div>
      </div>
    </div>
  );
};

export default EditTreatmentPage;