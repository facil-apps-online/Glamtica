
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, History, Briefcase } from "lucide-react";
import { useEquipment } from '@/hooks/useEquipment';
import { EquipmentDialog } from '@/components/EquipmentDialog';
import { MaintenanceHistoryDialog } from '@/components/MaintenanceHistoryDialog';
import { AssignEquipmentDialog } from '@/components/AssignEquipmentDialog';
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
  const { equipment, loading, refreshEquipment } = useEquipment();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Equipos</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los equipos, máquinas y herramientas de tu negocio.
          </p>
        </div>
        <EquipmentDialog trigger={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Añadir Equipo
          </Button>
        } />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Equipos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando equipos...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead><TableHead>Asignado a</TableHead><TableHead>Sucursal</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <MaintenanceHistoryDialog 
                            equipmentId={item.id} 
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <History className="w-4 h-4 mr-2" />
                                Historial
                              </DropdownMenuItem>
                            }
                          />
                          <AssignEquipmentDialog 
                            equipmentId={item.id} 
                            onAssignmentSuccess={refreshEquipment}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Briefcase className="w-4 h-4 mr-2" />
                                Asignar
                              </DropdownMenuItem>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentPage;
