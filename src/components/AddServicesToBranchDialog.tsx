import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useMasterServices, useAssignServiceToBranch, useServiceBranchPrices, useBranchServicesAndCombos } from "@/hooks/useServices";

import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { MasterService } from "@/types/services";

interface AddServicesToBranchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  branchId: string;
  onSuccess: () => void;
}

const AddServicesToBranchDialog: React.FC<AddServicesToBranchDialogProps> = ({
  isOpen,
  onOpenChange,
  branchId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { data: masterServices, isLoading: isLoadingMasterServices } = useMasterServices();
  const { data: branchServicesAndCombos, isLoading: isLoadingBranchServices } = useBranchServicesAndCombos(branchId);
  const { mutate: assignService, isPending: isAssigning } = useAssignServiceToBranch();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<{
    service_id: string;
    selling_price: number;
    duration_minutes: number;
  }>({});

  const availableServices = useMemo(() => {
    if (isLoadingMasterServices || isLoadingBranchServices) return [];
    const assignedServiceIds = new Set(branchServicesAndCombos?.filter(item => item.type === 'service').map(bs => bs.id));
    return masterServices?.filter(ms => !assignedServiceIds.has(ms.id));
  }, [masterServices, branchServicesAndCombos, isLoadingMasterServices, isLoadingBranchServices]);

  const filteredServices = availableServices?.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectService = (service: MasterService, isChecked: boolean) => {
    setSelectedServices(prev => {
      const newSelected = { ...prev };
      if (isChecked) {
        newSelected[service.id] = {
          service_id: service.id,
          selling_price: service.cost_price || 0, // Default to cost price or 0
          duration_minutes: service.duration_minutes || 0,
        };
      } else {
        delete newSelected[service.id];
      }
      return newSelected;
    });
  };

  const handlePriceChange = (serviceId: string, value: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], selling_price: parseFloat(value) || 0 },
    }));
  };

  const handleDurationChange = (serviceId: string, value: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], duration_minutes: parseInt(value) || 0 },
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(selectedServices).length === 0) {
      toast({ title: "Advertencia", description: "Selecciona al menos un servicio para asignar.", variant: "warning" });
      return;
    }

    const servicesToAssign = Object.values(selectedServices).map(serv => ({
      service_id: serv.service_id,
      branch_ids: [branchId],
      defaults: {
        selling_price: serv.selling_price,
        duration_minutes: serv.duration_minutes,
        is_active: true, // Default to active
      },
    }));

    servicesToAssign.forEach(assignmentPayload => {
      assignService(assignmentPayload, {
        onSuccess: () => {
          // Individual success toast might be too much for batch, consider a single one at the end
        },
        onError: (error) => {
          toast({ title: "Error al asignar servicio", description: error.message, variant: "destructive" });
        },
      });
    });

    toast({ title: "Servicios Asignados", description: "Los servicios seleccionados han sido asignados a la sucursal.", variant: "success" });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Servicios a la Sucursal</DialogTitle>
          <DialogDescription>
            Selecciona servicios del catálogo general para añadir a esta sucursal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {(isLoadingMasterServices || isLoadingBranchServices) ? (
            <div className="text-center">Cargando servicios disponibles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Seleccionar</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Duración (min)</TableHead>
                  <TableHead className="w-[150px]">Precio de Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No se encontraron servicios disponibles o todos ya están asignados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map(service => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <Checkbox
                          checked={!!selectedServices[service.id]}
                          onCheckedChange={(checked) => handleSelectService(service, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={selectedServices[service.id]?.duration_minutes || ''}
                          onChange={(e) => handleDurationChange(service.id, e.target.value)}
                          disabled={!selectedServices[service.id]}
                          min="0"
                          step="1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={selectedServices[service.id]?.selling_price || ''}
                          onChange={(e) => handlePriceChange(service.id, e.target.value)}
                          disabled={!selectedServices[service.id]}
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isAssigning || Object.keys(selectedServices).length === 0}>
            {isAssigning ? "Asignando..." : "Asignar Servicios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddServicesToBranchDialog;
