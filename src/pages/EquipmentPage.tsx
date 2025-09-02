import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreVertical, History, Briefcase, Search, Edit } from "lucide-react";
import { useEquipment } from '@/hooks/useEquipment';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';
import { useEquipmentBrands } from '@/hooks/useEquipmentBrands';
import { EquipmentDialog } from '@/components/EquipmentDialog';
import { MaintenanceHistoryDialog } from '@/components/MaintenanceHistoryDialog';
import { AssignEquipmentDialog } from '@/components/AssignEquipmentDialog';
import { EquipmentTypeManagementDialog } from '@/components/EquipmentTypeManagementDialog';
import { EquipmentBrandManagementDialog } from '@/components/EquipmentBrandManagementDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

const EquipmentPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [confirmedFilterType, setConfirmedFilterType] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [confirmedFilterBrand, setConfirmedFilterBrand] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { equipment, loading, refreshEquipment, updateEquipment } = useEquipment(confirmedSearchTerm, showInactive, confirmedFilterType, confirmedFilterBrand);
  const { types: equipmentTypes } = useEquipmentTypes();
  const { brands: equipmentBrands } = useEquipmentBrands();

  const handleToggleStatus = async (item: Equipment) => {
    try {
      await updateEquipment({ equipmentId: item.id, equipmentData: { is_active: !item.is_active } });
      refreshEquipment();
    } catch (error) {
      console.error("Error toggling equipment status:", error);
    }
  };

  return (
    <div className="relative space-y-8"> 
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s ease-in-out' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Equipos</h1>
            <p className="text-muted-foreground">
              Gestiona los equipos, máquinas y herramientas de tu negocio.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EquipmentTypeManagementDialog />
            <EquipmentBrandManagementDialog />
            <EquipmentDialog trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Equipo
              </Button>
            } onSuccess={refreshEquipment} />
          </div>
        </div>

        <Card className="mt-4">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Input
                  placeholder="Buscar por nombre o nro. de serie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:col-span-3"
                />
                <Button onClick={() => {
                  setConfirmedSearchTerm(searchTerm);
                  setConfirmedFilterType(filterType);
                  setConfirmedFilterBrand(filterBrand);
                }} className="md:col-span-1">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  {equipmentTypes?.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                >
                  <option value="">Todas las marcas</option>
                  {equipmentBrands?.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
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
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Lista de Equipos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando equipos...</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead><TableHead>Marca</TableHead><TableHead>Asignado a</TableHead><TableHead>Sucursal</TableHead><TableHead>Activo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.type_name}</TableCell>
                      <TableCell>{item.brand_name}</TableCell>
                      <TableCell>
                        {item.assigned_user_name ? (
                          <Badge variant="secondary">{item.assigned_user_name}</Badge>
                        ) : (
                          <Badge variant="outline">Sin asignar</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.assigned_branch_name ? (
                          <Badge variant="secondary">{item.assigned_branch_name}</Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleStatus(item)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <EquipmentDialog
                            equipment={item}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            }
                            onSuccess={refreshEquipment}
                          />
                          <MaintenanceHistoryDialog 
                            equipmentId={item.id} 
                            trigger={
                              <Button variant="outline" size="sm">
                                <History className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <AssignEquipmentDialog 
                            equipmentId={item.id} 
                            onAssignmentSuccess={refreshEquipment}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Briefcase className="w-4 h-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipmentPage;
