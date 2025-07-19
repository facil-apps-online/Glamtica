
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
import { useCancelAppointment } from "@/hooks/useAppointments";

interface CancelAppointmentDialogProps {
  appointmentId: string;
  clientName: string;
  children: React.ReactNode;
}

export const CancelAppointmentDialog = ({ 
  appointmentId, 
  clientName, 
  children 
}: CancelAppointmentDialogProps) => {
  const cancelMutation = useCancelAppointment();

  const handleCancel = () => {
    cancelMutation.mutate(appointmentId);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[95vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar cita?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres cancelar la cita de <strong>{clientName}</strong>? 
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            Sí, cancelar cita
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
