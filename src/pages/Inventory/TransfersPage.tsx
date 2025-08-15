import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TransfersTable } from "@/components/TransfersTable";
import { ProductTransferRequestDialog } from "@/components/ProductTransferRequestDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/useBranches";
import { useAuth } from "@/contexts/AuthContext";

export function TransfersPage() {
  const navigate = useNavigate();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { data: branches } = useBranches(tenantId);

  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statuses = ['solicitado', 'aprobado', 'rechazado', 'en_transito', 'recibido_con_incidencias', 'completado', 'cancelado'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/inventory')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Gestión de Traslados</h1>
        </div>
        <ProductTransferRequestDialog
            trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Traslado
              </Button>
            }
          />
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>Historial de Traslados</CardTitle>
            <div className="flex gap-4">
              <Select onValueChange={setBranchFilter} value={branchFilter || ''}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {branches?.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setStatusFilter} value={statusFilter || ''}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TransfersTable branchFilter={branchFilter} statusFilter={statusFilter} />
        </CardContent>
      </Card>
    </div>
  );
}
