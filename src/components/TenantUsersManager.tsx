import React, { useState, useMemo } from 'react';
import { useTenantUsers, TenantUserAssignment } from '@/hooks/useTenantUsers';
import { useCreatePasswordResetToken } from '@/hooks/useUserActions';
import { useCreateUser, CreateUserFormValues } from '@/hooks/useCreateUser';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useScreenSize } from '@/hooks/useScreenSize';
import { AddUserDialog } from '@/components/AddUserDialog';
import { AssignmentManagerDialog } from '@/components/AssignmentManagerDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TenantUsersManagerProps {
  tenantId: string;
}

interface GroupedUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  assignments: TenantUserAssignment[];
}

export const TenantUsersManager: React.FC<TenantUsersManagerProps> = ({ tenantId }) => {
  const { data: assignments, isLoading: isLoadingUsers, isError } = useTenantUsers(tenantId);
  const createUserMutation = useCreateUser();
  const createPasswordResetTokenMutation = useCreatePasswordResetToken();
  
  const { toast } = useToast();
  const screenSize = useScreenSize();
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAssignmentManagerOpen, setIsAssignmentManagerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GroupedUser | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const groupedUsers = useMemo(() => {
    if (!assignments) return [];
    
    const userMap = new Map<string, GroupedUser>();

    assignments.forEach(assignment => {
      let user = userMap.get(assignment.user_id);
      if (!user) {
        user = {
          user_id: assignment.user_id,
          email: assignment.email,
          first_name: assignment.first_name,
          last_name: assignment.last_name,
          assignments: [],
        };
        userMap.set(assignment.user_id, user);
      }
      user.assignments.push(assignment);
    });

    return Array.from(userMap.values()).sort((a, b) => 
      (a.first_name || a.email).localeCompare(b.first_name || b.email)
    );
  }, [assignments]);

  const handleOpenAssignmentManager = (user: GroupedUser) => {
    setSelectedUser(user);
    setIsAssignmentManagerOpen(true);
  };

  const handleCreateUser = (values: CreateUserFormValues) => {
    createUserMutation.mutate({ values, tenantId }, {
      onSuccess: (data) => {
        toast({ title: 'Éxito', description: data.message });
        setIsAddUserDialogOpen(false);
      },
      onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const handleResetPassword = async (email: string) => {
    try {
      const result = await createPasswordResetTokenMutation.mutateAsync({ email });
      const fullLink = `${window.location.origin}/update-password#access_token=${result.token}&type=recovery`;
      setResetLink(fullLink);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoadingUsers) return <div className="p-4 text-center">Cargando usuarios...</div>;
  if (isError) return <div className="p-4 text-center text-red-500">Error al cargar los usuarios.</div>;

  const userContent = groupedUsers && groupedUsers.length > 0 ? (
    <Accordion type="single" collapsible className="w-full">
      {groupedUsers.map(user => (
        <AccordionItem value={user.user_id} key={user.user_id}>
          <AccordionTrigger className="hover:bg-gray-50 px-4 py-4 text-left hover:no-underline">
            <div className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario sin nombre'}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pt-2 pb-4 border-t">
              <div className="flex justify-end mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={createPasswordResetTokenMutation.isPending}>
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      Acciones
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenAssignmentManager(user)}>
                      Administrar Asignaciones
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>
                      Generar Enlace de Recuperación
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {screenSize !== 'mobile' && (
                <>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm font-medium text-muted-foreground mb-2">
                    <div>Rol</div>
                    <div>Sucursal</div>
                    <div className="text-center">Estado</div>
                  </div>
                  {user.assignments.map(assignment => (
                    <div key={assignment.assignment_id} className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm items-center py-2 hover:bg-gray-50 rounded">
                      <div>{assignment.role_display_name || <span className="text-muted-foreground italic">N/A</span>}</div>
                      <div>{assignment.branch_name || <span className="text-muted-foreground italic">N/A</span>}</div>
                      <div className="text-center">
                        <Badge variant={assignment.status === 'active' ? 'default' : 'outline'}>
                          {assignment.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {screenSize === 'mobile' && (
                <div className="space-y-4">
                  {user.assignments.map(assignment => (
                    <div key={assignment.assignment_id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Rol</span>
                        <span>{assignment.role_display_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Sucursal</span>
                        <span>{assignment.branch_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Estado</span>
                        <Badge variant={assignment.status === 'active' ? 'default' : 'outline'}>
                          {assignment.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ) : (
    <p className="text-center text-muted-foreground py-4">No hay usuarios vinculados a este tenant.</p>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>Invita usuarios a tu negocio. Una vez vinculados, podrás configurar sus asignaciones de roles y sucursales.</CardDescription>
            </div>
            <Button onClick={() => setIsAddUserDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Invitar Usuario</Button>
          </div>
        </CardHeader>
        <CardContent>{userContent}</CardContent>
      </Card>
      <AddUserDialog 
        open={isAddUserDialogOpen} 
        onOpenChange={setIsAddUserDialogOpen} 
        onSubmit={handleCreateUser} 
        isSubmitting={createUserMutation.isPending} 
      />
      {selectedUser && (
        <AssignmentManagerDialog
          open={isAssignmentManagerOpen}
          onOpenChange={setIsAssignmentManagerOpen}
          userId={selectedUser.user_id}
          tenantId={tenantId}
          userName={`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email}
        />
      )}
      <AlertDialog open={!!resetLink} onOpenChange={() => setResetLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enlace de Recuperación Generado</AlertDialogTitle>
            <AlertDialogDescription>
              Copia y pega el siguiente enlace en tu navegador para establecer una nueva contraseña.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 bg-muted rounded-md text-sm break-all">
            {resetLink}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResetLink(null)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};