import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreHorizontal, History, Briefcase, Search, Edit, SlidersHorizontal, Tag, FileEdit } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useEquipment, Equipment } from '@/hooks/useEquipment';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';
import { useEquipmentBrands } from '@/hooks/useEquipmentBrands';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';


import { EquipmentDialog } from '@/components/EquipmentDialog';
import { MaintenanceHistoryDialog } from '@/components/MaintenanceHistoryDialog';
import { AssignEquipmentDialog } from '@/components/AssignEquipmentDialog';
import { EquipmentTypeManagementDialog } from '@/components/EquipmentTypeManagementDialog';
import { EquipmentBrandManagementDialog } from '@/components/EquipmentBrandManagementDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/PageHeader';

import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const EquipmentCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <div className="h-10 w-full mt-4 rounded-md border flex items-center justify-between p-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
    </CardContent>
  </Card>
);



const EquipmentCard = ({ item, handleToggleStatus, refreshEquipment }) => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { assignments, returnEquipment } = useEquipmentAssignments(item.id);

  const handleReturn = () => {
    const activeAssignment = assignments?.find(a => !a.return_date);
    if (activeAssignment) {
      returnEquipment(activeAssignment.id);
    }
  };

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
    navigate(`/app/equipment/edit/${item.id}`);
  };

  return (
  <Card onClick={handleCardClick} className="cursor-pointer transition-colors hover:bg-muted/50">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle>{item.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{item.type_name} - {item.brand_name}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EquipmentDialog 
              equipment={item} 
              trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Edit className="w-4 h-4 mr-2" />Edición Rápida</DropdownMenuItem>} 
              onSuccess={refreshEquipment} 
              onOpenChange={setIsDialogOpen}
            />
            <DropdownMenuItem onClick={() => navigate(`/app/equipment/edit/${item.id}`)}>
              <FileEdit className="w-4 h-4 mr-2" />
              Edición Completa
            </DropdownMenuItem>
            <MaintenanceHistoryDialog equipmentId={item.id} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><History className="w-4 h-4 mr-2" />Historial</DropdownMenuItem>} />
            {!item.assigned_user_name ? (
              <AssignEquipmentDialog equipmentId={item.id} onAssignmentSuccess={refreshEquipment} onOpenChange={setIsDialogOpen} trigger={<DropdownMenuItem onSelect={(e) => { e.preventDefault(); e.stopPropagation(); }}><Briefcase className="w-4 h-4 mr-2" />Asignar</DropdownMenuItem>} />
            ) : (
              <DropdownMenuItem onClick={handleReturn}>
                <Briefcase className="w-4 h-4 mr-2" />
                Devolver
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Asignado a</span>
        <span>{item.assigned_user_name ? <Badge variant="secondary">{item.assigned_user_name}</Badge> : <Badge variant="outline">Sin asignar</Badge>}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Sucursal</span>
        <span>{item.assigned_branch_name ? <Badge variant="secondary">{item.assigned_branch_name}</Badge> : <Badge variant="outline">N/A</Badge>}</span>
      </div>
      <div className="h-10 w-full mt-4 rounded-md border flex items-center justify-between p-3">
        <span className="text-sm font-medium">Estado</span>
        <Switch
          checked={item.is_active}
          onCheckedChange={() => handleToggleStatus(item)}
        />
      </div>
    </CardContent>
  </Card>
  );
}


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
    await updateEquipment({
      equipmentId: item.id,
      equipmentData: { is_active: !item.is_active },
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {[...Array(6)].map((_, i) => <EquipmentCardSkeleton key={i} />)}
        </div>
      );
    }

    if (!equipment || equipment.length === 0) {
      return <EmptyState Icon={Briefcase} title="No hay equipos" description="Añade tu primer equipo para empezar a gestionarlo." action={<EquipmentDialog trigger={<Button>Añadir Equipo</Button>} onSuccess={refreshEquipment} />} />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {equipment.map((item) => <EquipmentCard key={item.id} item={item} handleToggleStatus={handleToggleStatus} refreshEquipment={refreshEquipment} />)}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Equipos" subtitle="Gestiona los equipos, máquinas y herramientas de tu negocio.">
        <div className="flex items-center gap-2">
          <EquipmentTypeManagementDialog trigger={
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="sm:block hidden ml-2">Tipos</span>
            </Button>
          } />
          <EquipmentBrandManagementDialog trigger={
            <Button variant="outline" size="sm">
              <Tag className="w-4 h-4" />
              <span className="sm:block hidden ml-2">Marcas</span>
            </Button>
          } />
          <EquipmentDialog trigger={
            <Button size="sm">
              <Plus className="w-4 h-4" />
              <span className="sm:block hidden ml-2">Añadir Equipo</span>
            </Button>
          } onSuccess={refreshEquipment} />
        </div>
      </PageHeader>

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
                {equipmentTypes?.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
              >
                <option value="">Todas las marcas</option>
                {equipmentBrands?.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
              <div className="flex items-center space-x-2">
                <Switch checked={showInactive} onCheckedChange={setShowInactive} />
                <span className="text-sm text-muted-foreground">Mostrar inactivos</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentPage;
