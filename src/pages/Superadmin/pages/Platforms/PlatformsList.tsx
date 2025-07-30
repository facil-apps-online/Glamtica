import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlatforms } from '../../hooks/usePlatforms';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
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
import { useDebounce } from '@/hooks/useDebounce';
import { PlusCircle, Edit, Trash2, BookKey, Package, Settings, Search } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  description: string | null;
  base_url: string | null;
}

export default function PlatformsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { data: platforms, isLoading, isError, error } = usePlatforms(debouncedSearchTerm);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; platformId: string | null; platformName: string | null }>({ isOpen: false, platformId: null, platformName: null });

  const handleDeleteRequest = (platformId: string, platformName: string) => {
    setDeleteAlert({ isOpen: true, platformId, platformName });
  };

  const confirmDelete = async () => {
    if (!deleteAlert.platformId || !deleteAlert.platformName) return;
    try {
      const { error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'delete_platform', payload: { id: deleteAlert.platformId } },
      });

      if (error) throw new Error(error.message);

      // This part needs to be handled by react-query's invalidation, but for now we'll keep it simple
      // The list will automatically refetch due to the query key changing if we were to implement it fully
      toast({
        title: "Plataforma eliminada",
        description: `La plataforma "${deleteAlert.platformName}" ha sido eliminada exitosamente.`,
      });
    } catch (err: any) {
      toast({
        title: "Error al eliminar la plataforma",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeleteAlert({ isOpen: false, platformId: null, platformName: null });
    }
  };

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

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div>Cargando plataformas...</div>
      ) : isError ? (
        <div className="text-red-500">Error: {error?.message}</div>
      ) : (
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
              {platforms && platforms.length > 0 ? (
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
                            <Button variant="destructive" size="icon" title="Eliminar Plataforma" onClick={() => handleDeleteRequest(platform.id, platform.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
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
      )}
      <AlertDialog open={deleteAlert.isOpen} onOpenChange={(isOpen) => setDeleteAlert({ ...deleteAlert, isOpen })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la plataforma <strong>{deleteAlert.platformName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ isOpen: false, platformId: null, platformName: null })}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
