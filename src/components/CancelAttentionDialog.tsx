import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCancelAttention } from "@/hooks/useAttentions";

interface CancelAttentionDialogProps {
  attentionId: string;
  clientName: string;
  children: React.ReactNode;
}

export const CancelAttentionDialog = ({ 
  attentionId, 
  clientName, 
  children 
}: CancelAttentionDialogProps) => {
  const cancelMutation = useCancelAttention();

  const handleCancel = () => {
    cancelMutation.mutate(attentionId);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[95vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar atención?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres cancelar la atención de <strong>{clientName}</strong>? 
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, mantener atención</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            Sí, cancelar atención
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};