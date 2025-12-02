
import React, { useState, useMemo, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useBranches } from "@/hooks/useBranches";
import { useAssignServiceToBranch, useRemoveServiceFromBranch, MasterService, useServiceBranchPrices } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { Skeleton } from './ui/skeleton';

interface ServiceAssignmentTabProps {
  service: MasterService;
}

import { Switch } from './ui/switch';
import { useUpdateBranchService } from '@/hooks/useServices';

interface ServiceAssignmentTabProps {
  service: MasterService;
}

export const ServiceAssignmentTab: React.FC<ServiceAssignmentTabProps> = ({ service }) => {
  const { toast } = useToast();
  const { data: allBranches, isLoading: isLoadingBranches } = useBranches();
  const { data: assignedBranchesData, isLoading: isLoadingAssigned, refetch } = useServiceBranchPrices(service.id);
  
  const { mutate: assignService, isPending: isAssigning } = useAssignServiceToBranch();
  const { mutate: removeService, isPending: isRemoving } = useRemoveServiceFromBranch();
  const { mutate: updateBranchService, isPending: isUpdating } = useUpdateBranchService();

  const [searchTerm, setSearchTerm] = useState("");

  const branchAssignmentMap = useMemo(() => {
    const map = new Map<string, { is_assigned: boolean; branch_service_id: string | null; is_visible_on_microsite: boolean }>();
    assignedBranchesData?.forEach(bp => {
      map.set(bp.branch_id, { is_assigned: true, branch_service_id: bp.branch_service_id, is_visible_on_microsite: bp.is_visible_on_microsite });
    });
    return map;
  }, [assignedBranchesData]);

  const filteredBranches = useMemo(() => {
    if (!allBranches) return [];
    return allBranches.filter(branch =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allBranches, searchTerm]);

  const handleAssignmentChange = (branchId: string, isChecked: boolean) => {
    const assignmentInfo = branchAssignmentMap.get(branchId);
    const isCurrentlyAssigned = !!assignmentInfo?.is_assigned;

    if (isChecked && !isCurrentlyAssigned) {
      // Assign
      assignService({
        service_id: service.id,
        branch_ids: [branchId],
        defaults: { selling_price: 0, is_active: true },
      }, {
        onSuccess: () => {
          toast({ title: "Asignado", description: `Servicio asignado a la sucursal.` });
          refetch();
        },
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
      });
    } else if (!isChecked && isCurrentlyAssigned && assignmentInfo?.branch_service_id) {
      // Unassign
      removeService(assignmentInfo.branch_service_id, {
        onSuccess: () => {
          toast({ title: "Desasignado", description: `Servicio desasignado de la sucursal.` });
          refetch();
        },
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
      });
    }
  };

  const isLoading = isLoadingBranches || isLoadingAssigned;
  const isMutating = isAssigning || isRemoving || isUpdating;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Nombre de Sucursal</TableHead>
                <TableHead className="text-right">Visible en Micrositio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No se encontraron sucursales.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBranches.map(branch => {
                  const assignment = branchAssignmentMap.get(branch.id);
                  const isAssigned = !!assignment;
                  return (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <Checkbox
                          checked={isAssigned}
                          onCheckedChange={(checked) => handleAssignmentChange(branch.id, !!checked)}
                          disabled={isMutating}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={assignment?.is_visible_on_microsite || false}
                          onCheckedChange={(isChecked) => {
                            if (assignment?.branch_service_id) {
                              updateBranchService({
                                id: assignment.branch_service_id,
                                updates: { is_visible_on_microsite: isChecked }
                              }, {
                                onSuccess: () => {
                                  toast({ title: "Visibilidad Actualizada", description: "La visibilidad en el micrositio ha sido actualizada.", variant: "success" });
                                  refetch();
                                },
                                onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
                              });
                            }
                          }}
                          disabled={!isAssigned || isMutating}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
