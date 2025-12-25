import React from 'react';
import { useClientTreatments, useClientTreatmentDetails, ClientTreatment, useDeleteClientTreatment, useCancelTreatmentSession, useReactivateTreatmentSession } from '@/hooks/useTreatments'; // Updated import
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { CheckCircle2, Circle, LucideIcon, Trash2, CalendarClock, XCircle, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
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

const TreatmentDetailContent = ({ clientTreatmentId }: { clientTreatmentId: string }) => {
    const { data: details, isLoading, error } = useClientTreatmentDetails(clientTreatmentId);
    const { formatPrice } = usePriceFormat();
    const { mutate: cancelSession, isPending: isCancelling } = useCancelTreatmentSession();
    const { mutate: reactivateSession, isPending: isReactivating } = useReactivateTreatmentSession();

    if (isLoading) return <div className="p-4"><p>Cargando detalles...</p></div>;
    if (error) return <div className="p-4 text-red-500"><p>Error: {error.message}</p></div>;
    if (!details) return null;

    const renderSessionIcon = (session: any) => {
        const isActionPending = isCancelling || isReactivating;
        switch (session.status) {
            case 'completed':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'Cita Asignada':
                return <CalendarClock className="h-5 w-5 text-blue-500" />;
            case 'Cancelada':
                return (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 cursor-pointer" disabled={isActionPending}>
                                <Undo2 className="h-5 w-5 text-gray-400 hover:text-green-500" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Reactivar esta sesión?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    La sesión volverá al estado 'Pendiente' y podrá ser asignada a una nueva cita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Volver</AlertDialogCancel>
                                <AlertDialogAction onClick={() => reactivateSession(session.id)} disabled={isActionPending}>
                                    {isReactivating ? 'Reactivando...' : 'Confirmar Reactivación'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            case 'pending':
                return (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 cursor-pointer" disabled={isActionPending}>
                                <XCircle className="h-5 w-5 text-gray-400 hover:text-red-500" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro de cancelar esta sesión?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción marcará la sesión como cancelada. Podrás reactivarla más tarde.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Volver</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancelSession(session.id)} disabled={isActionPending}>
                                    {isCancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            default:
                return <Circle className="h-5 w-5 text-gray-400" />;
        }
    };

    const renderSessionStatusBadge = (status: string) => {
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' = 'outline';
        let text = '';
        switch (status) {
            case 'pending':
                variant = 'outline'; // Blanco
                text = 'Pendiente';
                break;
            case 'Cita Asignada':
                variant = 'default'; // Azul
                text = 'Agendada';
                break;
            case 'Cancelada':
                variant = 'destructive'; // Rojo
                text = 'Cancelada';
                break;
            case 'completed':
                variant = 'success'; // Verde
                text = 'Finalizada';
                break;
            default:
                variant = 'outline';
                text = status; // Fallback
        }
        return <Badge variant={variant}>{text}</Badge>;
    };

    return (
        <div className="pl-4 space-y-3">
            {details.sessions.map((session, index) => (
                <div key={session.id} className="flex items-start justify-between border-t py-3">
                    {/* --- CONTENEDOR IZQUIERDO --- */}
                    <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">{renderSessionIcon(session)}</div>
                        <div className="flex flex-col gap-1">
                            <p className="font-semibold">{index + 1}. {session.name}</p>
                            <p className="text-sm text-muted-foreground">{session.description}</p>
                            
                            {session.attention_datetime && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded-md mt-1 inline-block">
                                    Cita: {format(new Date(session.attention_datetime), "d 'de' MMMM, h:mm a", { locale: es })}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* --- CONTENEDOR DERECHO (PRECIO y BADGE ÚNICO) --- */}
                    {(session.payment_due || session.status) && (
                        <div className="text-right flex-shrink-0 pl-4 pr-4 flex flex-col items-end gap-1"> 
                            {session.payment_due && (
                                <p className="font-semibold">{formatPrice(session.payment_due.amount)}</p>
                            )}
                            
                            {/* Lógica de Badge Único: Prioriza el estado 'Pagado' */}
                            {session.payment_due?.status === 'paid' ? (
                                <Badge variant='success'>Pagado</Badge>
                            ) : (
                                session.status && renderSessionStatusBadge(session.status)
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


export const ClientTreatmentsList = ({ clientId }: { clientId: string }) => {
    const { data: treatments, isLoading, error } = useClientTreatments(clientId);
    const { mutate: deleteTreatment, isPending: isDeleting } = useDeleteClientTreatment();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
        );
    }
    
    if (error) {
        return <p className="text-red-500">Error al cargar los tratamientos: {error.message}</p>;
    }

    if (!treatments || treatments.length === 0) {
        return <p className="text-sm text-slate-500">Este cliente no tiene tratamientos asignados.</p>;
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {treatments.map((treatment) => (
                <Card key={treatment.id}>
                    <AccordionItem value={treatment.id} className="border-b-0">
                        <AccordionTrigger className="p-6">
                            <div className="flex justify-between items-center w-full">
                                <div className="text-left">
                                    <p className="font-bold text-lg">{treatment.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Progreso: {treatment.progress.completed} de {treatment.progress.total} sesiones
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={treatment.status === 'completed' ? 'success' : 'default'} className="capitalize">
                                        {treatment.status}
                                    </Badge>
                                    {treatment.progress.completed === 0 && !treatment.has_scheduled_sessions && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <span
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </span>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Se eliminará permanentemente el tratamiento asignado y todos sus datos.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteTreatment({ client_treatment_id: treatment.id, client_id: clientId })}
                                                        disabled={isDeleting}
                                                    >
                                                        Eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <TreatmentDetailContent clientTreatmentId={treatment.id} />
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            ))}
        </Accordion>
    );
};