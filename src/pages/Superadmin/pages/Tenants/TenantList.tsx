import React, { useState } from 'react';
import { useTenants, useDeleteTenant, useSetSystemOwner } from '../../hooks/useSuperadminTenants';
import { usePlatforms } from '../../hooks/usePlatforms';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2, Edit, Search, Eye } from 'lucide-react';
import { useToast } from '../../../../hooks/use-toast';
import { useScreenSize } from '../../../../hooks/useScreenSize';
import { useDebounce } from '../../../../hooks/useDebounce';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilterableSelect } from '@/components/FilterableSelect';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TenantsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformId, setPlatformId] = useState<string | undefined>(undefined);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: tenants, isLoading, isError, error } = useTenants({ 
    searchTerm: debouncedSearchTerm,
    platformId: platformId
  });
  
  const { data: platforms, isLoading: isLoadingPlatforms } = usePlatforms();
  const deleteTenantMutation = useDeleteTenant();
  const setSystemOwnerMutation = useSetSystemOwner();
  const { toast } = useToast();
  const screenSize = useScreenSize();

  const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; tenantId: string | null; tenantName: string | null }>({ isOpen: false, tenantId: null, tenantName: null });

  const handleDeleteRequest = (tenantId: string, tenantName: string) => {
    setDeleteAlert({ isOpen: true, tenantId, tenantName });
  };

  const confirmDelete = () => {
    if (!deleteAlert.tenantId || !deleteAlert.tenantName) return;
    deleteTenantMutation.mutate(deleteAlert.tenantId, {
      onSuccess: () => toast({ title: 'Éxito', description: `El tenant "${deleteAlert.tenantName}" ha sido eliminado.` }),
      onError: (e) => toast({ title: 'Error', description: `No se pudo eliminar el tenant: ${e.message}`, variant: 'destructive' }),
      onSettled: () => setDeleteAlert({ isOpen: false, tenantId: null, tenantName: null }),
    });
  };

  const handleOwnerChange = (tenantId: string, platformId: string | undefined) => {
    if (!platformId) {
      toast({ title: 'Error', description: 'El tenant no está asociado a ninguna plataforma.', variant: 'destructive' });
      return;
    }
    setSystemOwnerMutation.mutate({ tenantId, platformId }, {
      onSuccess: () => toast({ title: 'Éxito', description: 'El propietario del sistema ha sido actualizado.' }),
      onError: (e) => toast({ title: 'Error', description: `No se pudo cambiar el propietario: ${e.message}`, variant: 'destructive' }),
    });
  };

  const getStatusVariant = (status: string | null) => {
    if (!status) return 'outline';
    switch (status) {
      case 'active': return 'activo';
      case 'grace_period': return 'gracia';
      case 'suspended': return 'suspendido';
      case 'cancelled': return 'cancelado';
      default: return 'outline';
    }
  };

  const platformOptions = platforms?.map(p => ({ value: p.id, label: p.name })) || [];

  return (
    <>
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Listado de Tenants</h1>
          <Button asChild>
            <Link to="/superadmin/create-tenant">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear
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
          <div className="w-full md:w-56">
            <FilterableSelect
              options={platformOptions}
              value={platformId || ''}
              onValueChange={setPlatformId}
              placeholder="Filtrar por aplicación..."
            />
          </div>
        </div>

        {isLoading ? (
          <div>Cargando tenants...</div>
        ) : isError ? (
          <div>Error al cargar los tenants: {error?.message}</div>
        ) : tenants && tenants.length > 0 ? (
          screenSize === 'mobile' ? (
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <Card key={tenant.id}>
                  <CardHeader>
                    <CardTitle>{tenant.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Plataforma:</strong> {tenant.platform?.name || 'N/A'}</div>
                    <div className="flex items-center gap-2">
                      <strong>País:</strong>
                      {tenant.countries?.iso_code ? (
                        <img src={`https://flagcdn.com/w20/${tenant.countries.iso_code.toLowerCase()}.png`} alt={`Bandera de ${tenant.countries.name}`} className="w-5 h-auto" />
                      ) : <span className="w-5 h-3"></span>}
                      <span>{tenant.countries?.name || 'N/A'}</span>
                    </div>
                    <div><strong>Estado:</strong> <Badge variant={getStatusVariant(tenant.subscription_status)}>{tenant.subscription_status}</Badge></div>
                    <div className="flex items-center justify-between">
                      <strong>Propietario:</strong>
                      <Switch
                        checked={tenant.is_system_owner}
                        onCheckedChange={() => handleOwnerChange(tenant.id, tenant.platform?.id)}
                        disabled={setSystemOwnerMutation.isPending}
                        aria-label="Marcar como propietario del sistema"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild><Link to={`/superadmin/tenants/${tenant.id}`}><Eye className="mr-2 h-4 w-4" /> Ver</Link></Button>
                    <Button variant="outline" size="sm" asChild><Link to={`/superadmin/tenants/${tenant.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Editar</Link></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(tenant.id, tenant.name)} disabled={deleteTenantMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.platform?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!tenant.is_system_owner}
                        onCheckedChange={() => handleOwnerChange(tenant.id, tenant.platform?.id)}
                        disabled={setSystemOwnerMutation.isPending}
                        aria-label={`Marcar a ${tenant.name} como propietario del sistema`}
                      />
                    </TableCell>
                    <TableCell><Badge variant={getStatusVariant(tenant.subscription_status)}>{tenant.subscription_status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tenant.countries?.iso_code ? (
                          <img src={`https://flagcdn.com/w20/${tenant.countries.iso_code.toLowerCase()}.png`} alt={`Bandera de ${tenant.countries.name}`} className="w-5 h-auto" />
                        ) : <span className="w-5 h-3"></span>}
                        <span>{tenant.countries?.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild><Link to={`/superadmin/tenants/${tenant.id}`}><Eye className="mr-2 h-4 w-4" /> Ver Detalles</Link></Button>
                      <Button variant="outline" size="sm" asChild className="ml-2"><Link to={`/superadmin/tenants/${tenant.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Editar</Link></Button>
                      <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDeleteRequest(tenant.id, tenant.name)} disabled={deleteTenantMutation.isPending}><Trash2 className="mr-2 h-4 w-4" /> Borrar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          <p>No se encontraron tenants con los criterios de búsqueda.</p>
        )}
      </div>

      <AlertDialog open={deleteAlert.isOpen} onOpenChange={(isOpen) => setDeleteAlert({ ...deleteAlert, isOpen })}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible y borrará permanentemente el tenant <strong>{deleteAlert.tenantName}</strong> y todos sus datos asociados, incluyendo usuarios, citas, productos y configuraciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ isOpen: false, tenantId: null, tenantName: null })}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteTenantMutation.isPending}>
              {deleteTenantMutation.isPending ? 'Borrando...' : 'Sí, borrar tenant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
