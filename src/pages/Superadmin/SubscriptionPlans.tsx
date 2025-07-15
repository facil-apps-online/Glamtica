
import React from 'react';
import { useSubscriptionPlans, useDeleteSubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useScreenSize } from '@/hooks/useScreenSize'; // Importar el nuevo hook
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SubscriptionPlans() {
  const { data: plans, isLoading, isError, error } = useSubscriptionPlans();
  const deletePlanMutation = useDeleteSubscriptionPlan();
  const { toast } = useToast();
  const screenSize = useScreenSize(); // Usar el nuevo hook

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el plan "${name}"?`)) {
      deletePlanMutation.mutate(id, {
        onSuccess: () => {
          toast({ title: 'Éxito', description: `Plan "${name}" eliminado.` });
        },
        onError: (err) => {
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
      });
    }
  };

  if (isLoading) return <div>Cargando planes de suscripción...</div>;
  if (isError) return <div>Error al cargar los planes: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planes de Suscripción</h1>
        <Button asChild>
          <Link to="/superadmin/subscription-plans/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo
          </Link>
        </Button>
      </div>

      {screenSize === 'mobile' ? (
        // Vista de Tarjetas para Móvil
        <div className="space-y-4">
          {plans?.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{plan.name}</span>
                  <Badge variant="secondary">Orden: {plan.display_order}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{plan.description}</p>
                <div><strong>Activo:</strong> <Badge variant={plan.is_active ? 'default' : 'outline'}>{plan.is_active ? 'Sí' : 'No'}</Badge></div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/superadmin/subscription-plans/edit/${plan.id}`}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(plan.id, plan.name)}
                  disabled={deletePlanMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Borrar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        // Vista de Tabla para Escritorio y Tablet
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Orden</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.display_order}</TableCell>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.description}</TableCell>
                <TableCell><Badge variant={plan.is_active ? 'default' : 'outline'}>{plan.is_active ? 'Sí' : 'No'}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/superadmin/subscription-plans/edit/${plan.id}`}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-2"
                    onClick={() => handleDelete(plan.id, plan.name)}
                    disabled={deletePlanMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Borrar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
