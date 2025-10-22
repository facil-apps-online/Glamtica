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
import { useMaintenanceHistory } from '@/hooks/useMaintenanceHistory';
import { MaintenanceRecordFormDialog } from '@/components/MaintenanceRecordFormDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
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

const MaintenanceHistoryTab = ({ equipmentId }) => {
  const { history, loading, deleteMaintenanceRecord, refreshHistory } = useMaintenanceHistory(equipmentId);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteMaintenanceRecord(id);
    } catch (error: any) {
      toast({ title: "Error", description: `Error al eliminar: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end">
        <MaintenanceRecordFormDialog
          equipmentId={equipmentId}
          onSuccess={refreshHistory}
          trigger={
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Registro
            </Button>
          }
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>
            ) : (
              history.map(record => (
                <TableRow key={record.id}>
                  <TableCell>
                    {new Date(record.maintenance_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{record.notes}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <MaintenanceRecordFormDialog
                        equipmentId={equipmentId}
                        record={record}
                        onSuccess={refreshHistory}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <ConfirmationDialog
                        onConfirm={() => handleDelete(record.id)}
                        title="Confirmar Eliminación"
                        description="¿Estás seguro de que quieres eliminar este registro de mantenimiento? Esta acción no se puede deshacer."
                        trigger={
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && history.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center">No hay registros de mantenimiento.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const AssignmentsTab = ({ equipmentId }) => {
  const { assignments, loading, fetchEquipmentAssignments, returnEquipment } = useEquipmentAssignments();

  useEffect(() => {
    if (equipmentId) {
      fetchEquipmentAssignments(equipmentId);
    }
  }, [equipmentId, fetchEquipmentAssignments]);

  const handleReturn = async (assignmentId: string) => {
    await returnEquipment(assignmentId);
    fetchEquipmentAssignments(equipmentId);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end">
        <AssignEquipmentDialog
          equipmentId={equipmentId}
          onAssignmentSuccess={() => fetchEquipmentAssignments(equipmentId)}
          trigger={
            <Button variant="outline">
              <Briefcase className="w-4 h-4 mr-2" />
              Asignar Equipo
            </Button>
          }
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Fecha de Asignación</TableHead>
              <TableHead>Fecha de Devolución</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Cargando...</TableCell></TableRow>
            ) : (
              assignments.map(assignment => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.user_name}</TableCell>
                  <TableCell>{assignment.branch_name}</TableCell>
                  <TableCell>{new Date(assignment.assignment_date).toLocaleDateString()}</TableCell>
                  <TableCell>{assignment.return_date ? new Date(assignment.return_date).toLocaleDateString() : 'Asignado'}</TableCell>
                  <TableCell className="text-right">
                    {!assignment.return_date && (
                      <Button variant="outline" size="sm" onClick={() => handleReturn(assignment.id)}>Devolver</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && assignments.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center">No hay historial de asignaciones.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const EditEquipmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          <Tabs defaultValue="details" className="w-full">
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
                  <AssignmentsTab equipmentId={equipment.id} />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
        <div>
          <ChatterBox resourceType="equipments" resourceId={equipment.id} tenantId={equipment.tenant_id} containerClassName="h-[calc(100vh-22rem)]" />
        </div>
      </div>
    </div>
  );
};

export default EditEquipmentPage;
