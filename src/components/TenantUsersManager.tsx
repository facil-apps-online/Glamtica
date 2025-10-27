import React, { useState, useMemo } from 'react';
import { useTenantUsers, TenantUserAssignment } from '@/hooks/useTenantUsers';
import { useCreatePasswordResetToken } from '@/hooks/useUserActions';
import { useInviteOrAssignUser, InviteOrAssignUserFormValues } from '@/hooks/useInviteOrAssignUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { PlusCircle, MoreHorizontal, Users, Search, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useAuth } from '@/contexts/AuthContext';
import { usePriceFormat } from '@/hooks/usePriceFormat'; // Importar el hook
import { AddUserDialog } from '@/components/AddUserDialog';
import { AssignmentManagerDialog } from '@/components/AssignmentManagerDialog';
import { UserScheduleDialog } from '@/components/UserScheduleDialog'; // Importar UserScheduleDialog
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
  first_name: string | null;
  last_name: string | null;
  assignments: TenantUserAssignment[];
}

export const TenantUsersManager: React.FC<TenantUsersManagerProps> = ({ tenantId }) => {
  const { data: assignments, isLoading: isLoadingUsers, isError } = useTenantUsers(tenantId);
  const inviteOrAssignUserMutation = useInviteOrAssignUser();
  const createPasswordResetTokenMutation = useCreatePasswordResetToken();
  
  const { toast } = useToast();
  const screenSize = useScreenSize();
  const { currentAssignment } = useAuth();
  const { formatPrice } = usePriceFormat(); // Usar el hook
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAssignmentManagerOpen, setIsAssignmentManagerOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false); // Nuevo estado
  const [selectedUser, setSelectedUser] = useState<GroupedUser | null>(null);
  const [selectedUserForSchedule, setSelectedUserForSchedule] = useState<GroupedUser | null>(null); // Nuevo estado
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const groupedUsers = useMemo(() => {
    if (!assignments) return [];
    
    const userMap = new Map<string, GroupedUser>();

    assignments.forEach(assignment => {
      let user = userMap.get(assignment.user_id);
      if (!user) {
        user = {
          user_id: assignment.user_id,
          email: (assignment as any).raw_user_meta_data?.real_email || assignment.email,
          first_name: assignment.first_name,
          last_name: assignment.last_name,
          assignments: [],
        };
        userMap.set(assignment.user_id, user);
      }
      user.assignments.push(assignment);
    });

    const allUsers = Array.from(userMap.values());

    const filteredUsers = searchTerm
      ? allUsers.filter(user => {
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
          return fullName.includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        })
      : allUsers;

    return filteredUsers.sort((a, b) => 
      (a.first_name || a.email).localeCompare(b.first_name || b.email)
    );
  }, [assignments, searchTerm]);

  const handleOpenAssignmentManager = (user: GroupedUser) => {
    setSelectedUser(user);
    setIsAssignmentManagerOpen(true);
  };

  const handleOpenScheduleDialog = (user: GroupedUser) => { // Nueva función
    setSelectedUserForSchedule(user);
    setIsScheduleDialogOpen(true);
  };

  const handleCreateUser = (values: InviteOrAssignUserFormValues) => {
    if (!currentAssignment?.platform_id) {
      toast({ title: 'Error', description: 'No se pudo obtener el ID de la plataforma actual.', variant: 'destructive' });
      return;
    }

    const payload = {
      ...values,
      tenantId: tenantId,
      platformId: currentAssignment.platform_id,
    };

    inviteOrAssignUserMutation.mutate(payload, {
      onSuccess: (data) => {
        toast({ title: 'Éxito', description: data.message, variant: 'success' });
        setIsAddUserDialogOpen(false);
      },
      onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const handleResetPassword = async (email: string) => {
    try {
      const result = await createPasswordResetTokenMutation.mutateAsync({ email, platform_id: currentAssignment?.platform_id });
      const fullLink = `${window.location.origin}/update-password#access_token=${result.token}&type=recovery`;
      setResetLink(fullLink);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ha ocurrido un error desconocido.',
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
            <div className="flex flex-col items-start">
              <div className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario sin nombre'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
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
                    <DropdownMenuItem onClick={() => handleOpenScheduleDialog(user)}> {/* Nuevo botón */}
                      <Calendar className="h-4 w-4 mr-2" />
                      Horarios
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {screenSize !== 'sm' && screenSize !== 'md' && (
                <>
                  <div className="grid grid-cols-5 gap-x-4 gap-y-2 text-sm font-medium text-muted-foreground mb-2">
                    <div>Rol</div>
                    <div>Sucursal</div>
                    <div className="text-right">Salario Base</div>
                    <div className="text-right">Com. Prod. (%)</div>
                    <div className="text-right">Com. Serv. (%)</div>
                  </div>
                  {user.assignments.map(assignment => (
                    <div key={assignment.assignment_id} className="grid grid-cols-5 gap-x-4 gap-y-2 text-sm items-center py-2 hover:bg-gray-50 rounded">
                      <div>{assignment.role_display_name || <span className="text-muted-foreground italic">N/A</span>}</div>
                      <div>{assignment.branch_name || <span className="text-muted-foreground italic">N/A</span>}</div>
                      <div className="text-right">{formatPrice(assignment.base_salary)}</div>
                      <div className="text-right">{assignment.default_product_commission_rate?.toFixed(2) ?? 'N/A'}</div>
                      <div className="text-right">{assignment.default_service_commission_rate?.toFixed(2) ?? 'N/A'}</div>
                    </div>
                  ))}
                </>
              )}

              {(screenSize === 'sm' || screenSize === 'md') && (
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
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Salario Base</span>
                        <span>{formatPrice(assignment.base_salary)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Com. Prod. (%)</span>
                        <span>{assignment.default_product_commission_rate?.toFixed(2) ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Com. Serv. (%)</span>
                        <span>{assignment.default_service_commission_rate?.toFixed(2) ?? 'N/A'}</span>
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
    <p className="text-center text-muted-foreground py-4">
      {searchTerm ? `No se encontraron usuarios para "${searchTerm}".` : 'No hay usuarios vinculados a este tenant.'}
    </p>
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
              <CardDescription>Invita usuarios a tu negocio, busca existentes y configura sus asignaciones.</CardDescription>
            </div>
            <Button onClick={() => setIsAddUserDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Invitar Usuario</Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>{userContent}</CardContent>
      </Card>
      <AddUserDialog 
        open={isAddUserDialogOpen} 
        onOpenChange={setIsAddUserDialogOpen} 
        onSubmit={handleCreateUser} 
        isSubmitting={inviteOrAssignUserMutation.isPending} 
      />
      {selectedUser && (
        <AssignmentManagerDialog
          open={isAssignmentManagerOpen}
          onOpenChange={setIsAssignmentManagerOpen}
          userId={selectedUser.user_id}
          tenantId={tenantId}
          userName={`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email}
          initialUserAssignments={selectedUser.assignments}
        />
      )}
      {selectedUserForSchedule && (
        <UserScheduleDialog
          open={isScheduleDialogOpen}
          onOpenChange={setIsScheduleDialogOpen}
          userId={selectedUserForSchedule.user_id}
          userName={`${selectedUserForSchedule.first_name || ''} ${selectedUserForSchedule.last_name || ''}`.trim() || selectedUserForSchedule.email}
          targetUserAssignments={selectedUserForSchedule.assignments} // Pasar las asignaciones del usuario objetivo
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