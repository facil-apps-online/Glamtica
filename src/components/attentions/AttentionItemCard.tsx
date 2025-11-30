import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { DollarSign, User, Hash, Box, Scissors, Link, MoreHorizontal, UploadCloud, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStartService, useFinishService, useCallClient } from "@/hooks/useAttentionServiceActions";
import { ServiceTimer } from "../ServiceTimer";
import { useState } from "react";
import { EvidenceUploadDialog } from "../EvidenceUpload";

type ItemStatus = 'Pendiente' | 'Llamado' | 'En Proceso' | 'Finalizado' | 'Cancelado';

interface AttentionItemCardProps {
  id: string; // Service or Combo ID
  type: 'service' | 'product' | 'combo';
  name: string;
  quantity?: number;
  price: number;
  assignedTo?: string;
  status?: ItemStatus;
  statusHistory?: { status: string; created_at: string }[] | null;
  isFirst?: boolean;
  notes?: string;
  attentionStatus: string;
  details?: string[];
  is_parallel?: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  branchId: string;
  surveyRating?: { rating: number; comments: string } | null;
}

const getStatusBadge = (status: ItemStatus, attentionStatus: string) => {
    if (attentionStatus === 'Cancelada') {
      return <Badge variant="destructive">Cancelado</Badge>;
    }

    switch (status) {
      case 'Pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'Llamado':
        return <Badge variant="default" className="bg-yellow-500">Llamado</Badge>;
      case 'En Proceso':
        return <Badge variant="default" className="bg-blue-500">En Proceso</Badge>;
      case 'Finalizado':
        return <Badge variant="default" className="bg-green-500">Finalizado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
};

const getStatusColorClass = (status: ItemStatus | undefined, attentionStatus: string) => {
    if (attentionStatus === 'Cancelada') {
      return 'bg-red-500';
    }

    switch (status) {
      case 'Pendiente':
        return 'bg-gray-500';
      case 'Llamado':
        return 'bg-yellow-500';
      case 'En Proceso':
        return 'bg-blue-500';
      case 'Finalizado':
        return 'bg-green-500';
      case 'Cancelado':
        return 'bg-red-500';
      default:
        return 'bg-muted-foreground';
    }
};

export const AttentionItemCard = ({
  id,
  type,
  name,
  quantity,
  price,
  assignedTo,
  status,
  statusHistory,
  isFirst = false,
  notes,
  attentionStatus,
  details,
  is_parallel = false,
  screenSize,
  branchId,
  surveyRating,
}: AttentionItemCardProps) => {
  const { formatPrice } = usePriceFormat();
  const callClientMutation = useCallClient();
  const startServiceMutation = useStartService();
  const finishServiceMutation = useFinishService();
  const [isEvidenceDialogOpen, setIsEvidenceDialogOpen] = useState(false);

  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const iconMap = {
    service: <Scissors className="w-4 h-4 text-muted-foreground" />,
    product: <Box className="w-4 h-4 text-muted-foreground" />,
    combo: <Box className="w-4 h-4 text-muted-foreground" />,
  };

  const canPerformActions = type !== 'product' && type !== 'combo' && attentionStatus !== 'Cancelada' && attentionStatus !== 'Pagada' && attentionStatus !== 'Finalizada';
  const canUploadEvidence = type === 'service';

  return (
    <>
      <div className={`relative pl-8 ${!isFirst ? 'pt-2' : ''}`}>
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>
        <div className={`absolute left-4 ${!isFirst ? 'top-4' : 'top-2.5'} w-3 h-3 ${getStatusColorClass(status, attentionStatus)} rounded-full -translate-x-1/2`}></div>
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
            <div className="space-y-1 flex flex-col justify-center">
                <p className="font-medium flex items-center gap-2">
                    {is_parallel && <Link className="w-4 h-4 text-blue-500" />}
                    {iconMap[type]}
                    {name}
                </p>
                <div className={`flex ${isMobile ? 'flex-col items-start gap-1' : 'items-center gap-4'} text-sm text-muted-foreground`}>
                    {assignedTo && type !== 'combo' && (
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {assignedTo}
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatPrice(price || 0)}
                    </div>
                    {quantity && (
                        <div className="flex items-center gap-1">
                            <Hash className="w-4 h-4" />
                            {`Cantidad: ${quantity}`}
                        </div>
                    )}
                </div>
            </div>
            <div className={`flex items-center gap-2 ${isMobile ? 'self-end' : ''}`}>
                {type !== 'combo' && status && (status === 'En Proceso' || status === 'Finalizado') ? (
                    <ServiceTimer status={status} statusHistory={statusHistory} />
                ) : (
                    type !== 'combo' && status && getStatusBadge(status, attentionStatus)
                )}
                {(canPerformActions || canUploadEvidence) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {canPerformActions && status === 'Pendiente' && (
                        <DropdownMenuItem
                          onClick={() => callClientMutation.mutate(id)}
                          disabled={callClientMutation.isPending}
                        >
                          Llamar Cliente
                        </DropdownMenuItem>
                      )}
                      {canPerformActions && (status === 'Pendiente' || status === 'Llamado') && (
                        <DropdownMenuItem
                          onClick={() => startServiceMutation.mutate(id)}
                          disabled={startServiceMutation.isPending}
                        >
                          Empezar Servicio
                        </DropdownMenuItem>
                      )}
                      {canPerformActions && status === 'En Proceso' && (
                        <DropdownMenuItem
                          onClick={() => finishServiceMutation.mutate(id)}
                          disabled={finishServiceMutation.isPending}
                        >
                          Finalizar Servicio
                        </DropdownMenuItem>
                      )}
                      {canUploadEvidence && (
                        <DropdownMenuItem onClick={() => setIsEvidenceDialogOpen(true)}>
                          <UploadCloud className="w-4 h-4 mr-2" />
                          Cargar Evidencia
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
        </div>
        {notes && (
            <p className="text-sm text-muted-foreground mt-1">Notas: {notes}</p>
        )}
        {details && details.length > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
                <p className="font-medium">Incluye:</p>
                <ul className="list-disc list-inside pl-4">
                    {details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                    ))}
                </ul>
            </div>
        )}
        {surveyRating && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Calificación:</p>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < surveyRating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            {surveyRating.comments && (
              <p className="text-sm text-gray-500 italic">"{surveyRating.comments}"</p>
            )}
          </div>
        )}
    </div>
    <EvidenceUploadDialog
      isOpen={isEvidenceDialogOpen}
      onOpenChange={setIsEvidenceDialogOpen}
      attentionServiceId={id}
      branchId={branchId}
    />
  </>
  );
};