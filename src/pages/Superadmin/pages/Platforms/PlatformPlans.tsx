import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, ArrowLeft } from 'lucide-react';

// Definimos el tipo para un plan de suscripción para tener un tipado fuerte
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function PlatformPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [platformName, setPlatformName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { platformId } = useParams<{ platformId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!platformId) {
      setError("No se proporcionó un ID de plataforma.");
      setLoading(false);
      return;
    }

    const fetchPlansAndPlatform = async () => {
      setLoading(true);
      try {
        // TODO: Idealmente, obtener también el nombre de la plataforma para el título.
        // Por ahora, nos centramos en los planes.
        const { data, error } = await supabase.functions.invoke('superadmin-actions', {
          body: { action: 'get_subscription_plans_by_platform', payload: { platformId } },
        });

        if (error) throw new Error(error.message);
        if (Array.isArray(data)) {
          setPlans(data);
        } else {
          throw new Error("La respuesta de la función no es un array válido.");
        }
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error al cargar los planes",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlansAndPlatform();
  }, [platformId, toast]);

  if (loading) {
    return <div>Cargando planes...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/superadmin/platforms')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Planes para la Plataforma</h1>
        </div>
        <Button asChild>
          <Link to={`/superadmin/platforms/${platformId}/plans/create`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Plan
          </Link>
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length > 0 ? (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.description || 'N/A'}</TableCell>
                  <TableCell>{plan.is_active ? 'Sí' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => navigate(`/superadmin/platforms/${platformId}/plans/edit/${plan.id}`)}
                        title="Editar Plan"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No se encontraron planes para esta plataforma.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
