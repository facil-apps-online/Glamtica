import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TransfersTable } from "@/components/TransfersTable";
import { ProductTransferRequestDialog } from "@/components/ProductTransferRequestDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/useBranches";
import { PageHeader } from "@/components/PageHeader";
import { TransfersList } from "@/components/TransfersList";
import { useScreenSize } from "@/hooks/useScreenSize";
import { useAuth } from "@/contexts/AuthContext";

export function TransfersPage() {
  const navigate = useNavigate();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { data: branches } = useBranches(tenantId);
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statuses = ['solicitado', 'aprobado', 'rechazado', 'en_transito', 'recibido_con_incidencias', 'completado', 'cancelado'];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestión de Traslados"
        subtitle="Solicita, aprueba y gestiona transferencias de productos entre sucursales."
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate('/app/inventory')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      >
        <ProductTransferRequestDialog
            trigger={
              <Button size={isMobile ? "icon" : "default"}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Nuevo Traslado</span>
              </Button>
            }
          />
      </PageHeader>

      <Card>
        <CardHeader>
          <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between'}`}>
            <CardTitle>Historial de Traslados</CardTitle>
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'gap-4'}`}>
              <Select onValueChange={setBranchFilter} value={branchFilter || ''}>
                <SelectTrigger>
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
                <SelectTrigger>
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
        <CardContent className="p-0 sm:p-6">
          {isMobile ? (
            <TransfersList branchFilter={branchFilter} statusFilter={statusFilter} />
          ) : (
            <TransfersTable branchFilter={branchFilter} statusFilter={statusFilter} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
