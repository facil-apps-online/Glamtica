import React, { useState } from 'react';
import { useTenantUsers, useUpdateUserStatus, useCreateTenantUser, useRoles, useCreatePasswordResetToken } from '@/hooks/useTenantUsers';
import { useBranches } from '@/hooks/useBranches';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { MoreHorizontal, PlusCircle, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useScreenSize } from '@/hooks/useScreenSize';
import { AddUserDialog } from '@/components/AddUserDialog';

interface TenantUsersManagerProps {
  tenantId: string;
}

const roleLabels: { [key: string]: string } = {
  super_admin: 'Super Admin Global',
  tenant_super_admin: 'Super Admin Tenant',
  tenant_admin: 'Administrador',
  tenant_user: 'Usuario',
};

const addUserFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string().uuid(),
  branchId: z.string().uuid(),
});

export const TenantUsersManager: React.FC<TenantUsersManagerProps> = ({ tenantId }) => {
  const { data: users, isLoading: isLoadingUsers } = useTenantUsers(tenantId);
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const { data: branches, isLoading: isLoadingBranches } = useBranches(tenantId);
  const updateUserStatusMutation = useUpdateUserStatus();
  const createUserMutation = useCreateTenantUser();
  const createPasswordResetMutation = useCreatePasswordResetToken();
  const { toast } = useToast();
  const screenSize = useScreenSize();
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryLink, setRecoveryLink] = useState('');

  const handleStatusChange = (userId: string, currentStatus: boolean) => {
    updateUserStatusMutation.mutate({ userId, newStatus: !currentStatus, tenantId }, {
      onSuccess: () => toast({ title: 'Éxito', description: 'Estado del usuario actualizado.' }),
      onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const handleCreateUser = (values: z.infer<typeof addUserFormSchema>) => {
    createUserMutation.mutate({ values, tenantId }, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Usuario creado correctamente.' });
        setIsAddUserDialogOpen(false);
      },
      onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const handleResetPassword = (userId: string) => {
    createPasswordResetMutation.mutate({ userId }, {
      onSuccess: (data) => {
        const resetUrl = `${window.location.origin}/reset-password?token=${data.token}`;
        setRecoveryLink(resetUrl);
        setShowRecoveryDialog(true);
      },
      onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const copyToClipboard = () => {
    // Método moderno (preferido)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(recoveryLink)
        .then(() => toast({ title: 'Copiado', description: 'Enlace copiado al portapapeles.' }))
        .catch(err => console.error('Error con navigator.clipboard: ', err));
    } else {
      // Método alternativo (fallback)
      const textArea = document.createElement("textarea");
      textArea.value = recoveryLink;
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({ title: 'Copiado', description: 'Enlace copiado al portapapeles.' });
      } catch (err) {
        console.error('Error con document.execCommand: ', err);
        toast({ title: 'Error', description: 'No se pudo copiar el enlace.', variant: 'destructive' });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  if (isLoadingUsers || isLoadingRoles || isLoadingBranches) return <div className="p-4 text-center">Cargando datos...</div>;

  const userContent = users && users.length > 0 ? (
    screenSize === 'mobile' ? (
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="truncate text-base">{user.email}</CardTitle>
              <div className="text-sm text-muted-foreground pt-1">
                <Badge variant="secondary">{roleLabels[user.role_name] || user.role_name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <div className="flex items-center gap-2">
                  <Switch checked={user.is_active} onCheckedChange={() => handleStatusChange(user.id, user.is_active)} disabled={updateUserStatusMutation.isPending} id={`switch-${user.id}`} />
                  <label htmlFor={`switch-${user.id}`} className={user.is_active ? 'text-green-600' : 'text-red-600'}>{user.is_active ? 'Activo' : 'Inactivo'}</label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="w-full"><MoreHorizontal className="mr-2 h-4 w-4" /> Acciones</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>Resetear Contraseña</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>
    ) : (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead>Fecha de Creación</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell><Badge variant="secondary">{roleLabels[user.role_name] || user.role_name}</Badge></TableCell>
                <TableCell><Switch checked={user.is_active} onCheckedChange={() => handleStatusChange(user.id, user.is_active)} disabled={updateUserStatusMutation.isPending} /></TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>Resetear Contraseña</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  ) : (
    <p className="text-center text-muted-foreground py-4">No hay usuarios para este tenant.</p>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Añade, edita o desactiva usuarios para este tenant.</CardDescription>
            </div>
            <Button onClick={() => setIsAddUserDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Añadir Usuario</Button>
          </div>
        </CardHeader>
        <CardContent>{userContent}</CardContent>
      </Card>
      <AddUserDialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen} onSubmit={handleCreateUser} roles={roles || []} branches={branches || []} isSubmitting={createUserMutation.isPending} />
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enlace de Recuperación Generado</DialogTitle>
            <DialogDescription>Copia el siguiente enlace y envíalo al usuario. Este enlace es de un solo uso y expirará en 1 hora.</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-md text-sm break-all relative pr-12">
            {recoveryLink}
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRecoveryDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};