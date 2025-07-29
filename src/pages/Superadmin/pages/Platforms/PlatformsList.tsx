import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
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
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, BookKey, Package, Settings } from 'lucide-react';

// Definimos el tipo para una plataforma para tener un tipado fuerte
interface Platform {
  id: string;
  name: string;
  description: string | null;
  base_url: string | null;
  created_at: string;
}

export default function PlatformsList() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlatforms = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('superadmin-actions', {
          body: { action: 'get_platforms' },
        });

        if (error) throw new Error(error.message);
        if (Array.isArray(data)) {
          setPlatforms(data);
        } else {
          throw new Error("La respuesta de la función no es un array válido.");
        }
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error al cargar plataformas",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, [toast]);

  const handleDelete = async (platformId: string) => {
    try {
      const { error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'delete_platform', payload: { id: platformId } },
      });

      if (error) throw new Error(error.message);

      setPlatforms(platforms.filter(p => p.id !== platformId));
      toast({
        title: "Plataforma eliminada",
        description: "La plataforma ha sido eliminada exitosamente.",
      });
    } catch (err: any) {
      toast({
        title: "Error al eliminar la plataforma",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Cargando plataformas...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Plataformas</h1>
        <Button asChild>
          <Link to="/superadmin/platforms/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Plataforma
          </Link>
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>URL Base</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {platforms.length > 0 ? (
              platforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell>{platform.description || 'N/A'}</TableCell>
                  <TableCell>{platform.base_url || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => navigate(`/superadmin/platforms/${platform.id}/settings`)}
                        title="Configuración de la Plataforma"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => navigate(`/superadmin/platforms/${platform.id}/plans`)}
                        title="Gestionar Planes"
                      >
                        <BookKey className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => navigate(`/superadmin/platforms/${platform.id}/assets`)}
                        title="Catálogo de Activos"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => navigate(`/superadmin/platforms/edit/${platform.id}`)}
                        title="Editar Plataforma"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" title="Eliminar Plataforma">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la plataforma.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(platform.id)}>
                              Continuar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No se encontraron plataformas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
