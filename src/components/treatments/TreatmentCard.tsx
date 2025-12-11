import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Treatment, useDeleteTreatment, useUpdateTreatment } from '@/hooks/useTreatments';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, ExternalLink, Trash2, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { TreatmentImageCarousel } from './TreatmentImageCarousel';

interface TreatmentCardProps {
  treatment: Treatment;
  onEdit: (treatment: Treatment) => void;
  onDelete: () => void;
}

export const TreatmentCard: React.FC<TreatmentCardProps> = ({ treatment, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const { mutate: deleteTreatment, isPending: isDeleting } = useDeleteTreatment();
  const { mutate: updateTreatment, isPending: isUpdatingStatus } = useUpdateTreatment();
  const { formatPrice } = usePriceFormat();

  const sessionCount = treatment.session_count?.[0]?.count ?? 0;

  const handleFullEdit = () => {
    navigate(`/app/treatments/${treatment.id}`);
  };

  const handleDelete = () => {
    deleteTreatment(treatment.id, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Tratamiento eliminado.", variant: "success" });
        onDelete();
        setShowDeleteConfirm(false);
      },
      onError: (error) => {
        toast({ title: "Error", description: `No se pudo eliminar el tratamiento: ${error.message}`, variant: "destructive" });
      },
    });
  };

  const handleToggleActive = (checked: boolean) => {
    updateTreatment(
      { id: treatment.id, updates: { is_active: checked } },
      {
        onSuccess: () => {
          toast({ title: "Éxito", description: "Estado del tratamiento actualizado.", variant: "success" });
          // The useUpdateTreatment hook already invalidates queries, so no need to call onDelete/refetch here.
        },
        onError: (error) => {
          toast({ title: "Error", description: `No se pudo actualizar el estado: ${error.message}`, variant: "destructive" });
        }
      }
    );
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Prevent navigation if clicking on interactive elements
    if (
      target.closest('button') ||
      target.closest('[role="switch"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('.embla') // Class for the image carousel
    ) {
      return;
    }
    handleFullEdit();
  };

  return (
    <>
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="p-0">
          <TreatmentImageCarousel images={treatment.treatment_images} treatmentName={treatment.name} />
        </CardHeader>
        <div onClick={handleCardClick} className="cursor-pointer transition-colors hover:bg-muted/50 flex-grow flex flex-col justify-between">
            <CardContent className="flex-grow p-4 space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex-grow pr-2">
                    <CardTitle className="text-lg leading-tight">{treatment.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
                        {treatment.description || ''}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(treatment)}>
                        <Edit className="w-4 h-4 mr-2" />
                        <span>Edición rápida</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFullEdit}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        <span>Edición completa</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span>Eliminar</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {treatment.categories && treatment.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {treatment.categories.map(c => (
                  c.treatment_categories && (
                    <Badge key={c.treatment_categories.id} variant="secondary">
                      {c.treatment_categories.name}
                    </Badge>
                  )
                ))}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground space-y-2 pt-2">
                <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center"><Layers className="w-4 h-4 mr-2" /> Sesiones</span>
                    <span className="font-bold text-foreground">{sessionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Contado</span>
                    <span className="font-semibold text-foreground">{formatPrice(treatment.upfront_price)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Financiado</span>
                    <span className="font-semibold text-foreground">{formatPrice(treatment.financed_price)}</span>
                </div>
            </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 pt-2">
                <div className="flex items-center space-x-2">
                    <Switch
                        id={`active-switch-${treatment.id}`}
                        checked={treatment.is_active} 
                        onCheckedChange={handleToggleActive}
                        disabled={isUpdatingStatus}
                    />
                    <Label htmlFor={`active-switch-${treatment.id}`} className="text-sm">Activo</Label>
                </div>
            </CardFooter>
        </div>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el tratamiento
              y toda su configuración.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

