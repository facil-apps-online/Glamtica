import { Button } from "@/components/ui/button";
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { useTransfersLogic } from "@/hooks/useTransfersLogic";

export function TransfersTable({ branchFilter, statusFilter }: { branchFilter: string | null, statusFilter: string | null }) {
  const {
    transfers,
    isLoading,
    error,
    handleApproveClick,
    handleReceiveClick,
    handleViewClick,
    handleShipClick,
    handleCancelClick,
    Dialogs,
  } = useTransfersLogic(branchFilter, statusFilter);

  if (isLoading) return <div className="text-center p-8">Cargando traslados...</div>;
  if (error) return <div className="text-red-500 text-center p-8">Error al cargar traslados: {error.message}</div>;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completado': return 'success';
      case 'recibido_con_incidencias': return 'yellow';
      case 'cancelado':
      case 'rechazado':
        return 'destructive';
      case 'en_transito': return 'blue';
      case 'aprobado': return 'green';
      case 'solicitado':
      default: return 'secondary';
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Origen</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Fecha Solicitud</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers && transfers.length > 0 ? (
            transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>{transfer.origin_branch?.name || "N/A"}</TableCell>
                <TableCell>{transfer.destination_branch?.name || "N/A"}</TableCell>
                <TableCell>{new Date(transfer.transfer_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(transfer.status)}>
                    {transfer.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{transfer.items?.length || 0}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewClick(transfer)}>Ver Detalles</DropdownMenuItem>
                      {transfer.status === 'solicitado' && (
                        <DropdownMenuItem onClick={() => handleApproveClick(transfer)}>Aprobar/Rechazar</DropdownMenuItem>
                      )}
                      {transfer.status === 'aprobado' && (
                        <DropdownMenuItem onClick={() => handleShipClick(transfer)}>Marcar como Enviado</DropdownMenuItem>
                      )}
                      {transfer.status === 'en_transito' && (
                        <DropdownMenuItem onClick={() => handleReceiveClick(transfer)}>Recibir</DropdownMenuItem>
                      )}
                      {(transfer.status === 'solicitado' || transfer.status === 'aprobado') && (
                        <DropdownMenuItem onClick={() => handleCancelClick(transfer)}>Cancelar</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No hay traslados registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Dialogs />
    </>
  );
}
