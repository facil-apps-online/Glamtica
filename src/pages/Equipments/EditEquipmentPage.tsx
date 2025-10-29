import { useParams, useNavigate } from 'react-router-dom';
import { useEquipment, useUpdateEquipment, Equipment } from '@/hooks/useEquipment';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatterBox } from '@/components/ChatterBox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';
import { useEquipmentBrands } from '@/hooks/useEquipmentBrands';
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MaintenanceHistoryTab } from '@/components/MaintenanceHistoryTab';
import { EquipmentAssignmentHistoryTab } from '@/components/EquipmentAssignmentHistoryTab';
import { AssignEquipmentDialog } from '@/components/AssignEquipmentDialog';

const EquipmentDetailsForm = ({ equipment, onFormChange, onSave, isSaving, equipmentTypes, equipmentBrands }) => {
  const [formData, setFormData] = useState(equipment);

  useEffect(() => {
    onFormChange(formData);
  }, [formData, onFormChange]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select value={formData.type_id} onValueChange={(value) => handleChange('type_id', value)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
            <SelectContent>
              {equipmentTypes?.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Marca</Label>
          <Select value={formData.brand_id} onValueChange={(value) => handleChange('brand_id', value)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar marca..." /></SelectTrigger>
            <SelectContent>
              {equipmentBrands?.map(brand => <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serial_number">Número de Serie</Label>
          <Input id="serial_number" value={formData.serial_number} onChange={(e) => handleChange('serial_number', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Fecha de Compra</Label>
          <Input id="purchase_date" type="date" value={formData.purchase_date?.split('T')[0] || ''} onChange={(e) => handleChange('purchase_date', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_maintenance_date">Último Mantenimiento</Label>
          <Input id="last_maintenance_date" type="date" value={formData.last_maintenance_date?.split('T')[0] || ''} onChange={(e) => handleChange('last_maintenance_date', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maintenance_frequency">Frec. Mantenimiento</Label>
            <Input id="maintenance_frequency" type="number" value={formData.maintenance_frequency} onChange={(e) => handleChange('maintenance_frequency', Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance_frequency_unit">Unidad</Label>
            <Select value={formData.maintenance_frequency_unit} onValueChange={(value) => handleChange('maintenance_frequency_unit', value)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Días</SelectItem>
                <SelectItem value="weeks">Semanas</SelectItem>
                <SelectItem value="months">Meses</SelectItem>
                <SelectItem value="years">Años</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="is_active" checked={formData.is_active} onCheckedChange={(value) => handleChange('is_active', value)} />
        <Label htmlFor="is_active">Activo</Label>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Detalles'}
        </Button>
      </div>
    </form>
  );
}





const EditEquipmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("details");

  const { equipment: allEquipment, loading: isLoadingEquipment } = useEquipment();
  const { mutate: updateEquipment, isPending: isUpdating } = useUpdateEquipment();
  const { types: equipmentTypes, loading: isLoadingTypes } = useEquipmentTypes();
  const { brands: equipmentBrands, loading: isLoadingBrands } = useEquipmentBrands();

  const [equipmentData, setEquipmentData] = useState<Partial<Equipment> | null>(null);

  const equipment = allEquipment?.find(e => e.id === id);

  useEffect(() => {
    if (equipment) {
      setEquipmentData(equipment);
    }
  }, [equipment]);

  const handleFormChange = (updatedData) => {
    setEquipmentData(updatedData);
  };

  const handleSave = () => {
    if (!id || !equipmentData || !equipment) return;
    
    const changedData = Object.keys(equipmentData).reduce((acc, key) => {
      if (equipmentData[key] !== equipment[key]) {
        acc[key] = equipmentData[key];
      }
      return acc;
    }, {});

    if (Object.keys(changedData).length > 0) {
        updateEquipment({ equipmentId: id, equipmentData: changedData }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chatter', 'equipments', id] });
          }
        });
    } else {
      toast({ title: "Información", description: "No se han detectado cambios.", variant: "info" });
    }
  };

  const isLoading = isLoadingEquipment || isLoadingTypes || isLoadingBrands;

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!equipment) {
    return <div>Equipo no encontrado</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title={equipment.name} 
        subtitle="Gestiona todos los aspectos del equipo." 
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate('/app/equipment')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="md:hidden">
            <Select onValueChange={setActiveTab} value={activeTab}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar una sección..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="details">Detalles</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="assignments">Asignaciones</SelectItem>
              </SelectContent>
            </Select>
            <div className="pt-4">
              {activeTab === 'details' && (
                <Card>
                  <CardHeader><CardTitle>Detalles del Equipo</CardTitle></CardHeader>
                  <CardContent>
                    {equipmentData && (
                      <EquipmentDetailsForm 
                        equipment={equipmentData} 
                        onFormChange={handleFormChange} 
                        onSave={handleSave} 
                        isSaving={isUpdating} 
                        equipmentTypes={equipmentTypes}
                        equipmentBrands={equipmentBrands}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
              {activeTab === 'maintenance' && (
                <Card>
                  <CardHeader><CardTitle>Historial de Mantenimiento</CardTitle></CardHeader>
                  <CardContent>
                    <MaintenanceHistoryTab equipmentId={equipment.id} />
                  </CardContent>
                </Card>
              )}
              {activeTab === 'assignments' && (
                <Card>
                  <CardHeader><CardTitle>Historial de Asignaciones</CardTitle></CardHeader>
                  <CardContent>
                    {!equipment.assigned_user_name && (
                      <div className="flex justify-end mb-4">
                        <AssignEquipmentDialog
                          equipmentId={equipment.id}
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['equipment', equipment.id] });
                            queryClient.invalidateQueries({ queryKey: ['equipment'] });
                          }}
                          trigger={
                            <Button variant="outline">
                              <Briefcase className="w-4 h-4 mr-2" />
                              Asignar Equipo
                            </Button>
                          }
                        />
                      </div>
                    )}
                    <EquipmentAssignmentHistoryTab equipmentId={equipment.id} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
                <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <Card>
                  <CardHeader><CardTitle>Detalles del Equipo</CardTitle></CardHeader>
                  <CardContent>
                    {equipmentData && (
                      <EquipmentDetailsForm 
                        equipment={equipmentData} 
                        onFormChange={handleFormChange} 
                        onSave={handleSave} 
                        isSaving={isUpdating} 
                        equipmentTypes={equipmentTypes}
                        equipmentBrands={equipmentBrands}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance">
                <Card>
                  <CardHeader><CardTitle>Historial de Mantenimiento</CardTitle></CardHeader>
                  <CardContent>
                    <MaintenanceHistoryTab equipmentId={equipment.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assignments">
                <Card>
                  <CardHeader><CardTitle>Historial de Asignaciones</CardTitle></CardHeader>
                  <CardContent>
                    {!equipment.assigned_user_name && (
                      <div className="flex justify-end mb-4">
                        <AssignEquipmentDialog
                          equipmentId={equipment.id}
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['equipment', equipment.id] });
                            queryClient.invalidateQueries({ queryKey: ['equipment'] });
                          }}
                          trigger={
                            <Button variant="outline">
                              <Briefcase className="w-4 h-4 mr-2" />
                              Asignar Equipo
                            </Button>
                          }
                        />
                      </div>
                    )}
                    <EquipmentAssignmentHistoryTab equipmentId={equipment.id} />
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
        <div>
          <ChatterBox resourceType="equipments" resourceId={equipment.id} tenantId={equipment.tenant_id} containerClassName="h-[calc(100vh-22rem)]" />
        </div>
      </div>
    </div>
  );
};

export default EditEquipmentPage;
