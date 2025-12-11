import React from 'react';
import { useClientTreatments, useClientTreatmentDetails, ClientTreatment } from '@/hooks/useTreatments'; // Updated import
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, Circle, LucideIcon } from 'lucide-react';

const TreatmentDetailContent = ({ clientTreatmentId }: { clientTreatmentId: string }) => {
    const { data: details, isLoading, error } = useClientTreatmentDetails(clientTreatmentId);

    if (isLoading) return <div className="p-4"><p>Cargando detalles...</p></div>;
    if (error) return <div className="p-4 text-red-500"><p>Error: {error.message}</p></div>;
    if (!details) return null;

    return (
        <div className="pl-4 space-y-3">
            {details.sessions.map((session, index) => (
                <div key={session.id} className="flex items-start justify-between border-t py-3">
                    <div className="flex items-start gap-3">
                        {session.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                        ) : (
                            <Circle className="h-5 w-5 text-gray-400 mt-1" />
                        )}
                        <div>
                            <p className="font-semibold">{index + 1}. {session.name}</p>
                            <p className="text-sm text-muted-foreground">{session.description}</p>
                        </div>
                    </div>
                    {session.payment_due && (
                        <div className="text-right">
                            <p className="font-semibold">{formatCurrency(session.payment_due.amount)}</p>
                            <Badge variant={session.payment_due.status === 'paid' ? 'success' : 'destructive'}>
                                {session.payment_due.status === 'paid' ? 'Pagado' : 'Pendiente'}
                            </Badge>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const ClientTreatmentsList = ({ clientId }: { clientId: string }) => {
    const { data: treatments, isLoading, error } = useClientTreatments(clientId);

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
                                <Badge variant={treatment.status === 'completed' ? 'success' : 'default'} className="capitalize">
                                    {treatment.status}
                                </Badge>
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