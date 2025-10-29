import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { User as UserIcon, Plus, MoreHorizontal, Edit, CalendarCheck, UserX, Briefcase, Percent, Search, Users } from "lucide-react";
import { useTenantUsers, invokeTenantAction, TenantUserAssignment } from "@/hooks/useTenantUsers";
import { AddUserDialog } from "@/components/AddUserDialog";
import { UserScheduleDialog } from "@/components/UserScheduleDialog";
import { TimeOffRequestDialog } from "@/components/TimeOffRequestDialog";
import { UserCommissionsDialog } from "@/components/UserCommissionsDialog";
import { AssignEquipmentDialog } from '@/components/AssignEquipmentDialog';
import { AssignmentManagerDialog } from '@/components/AssignmentManagerDialog';
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useScreenSize } from '@/hooks/useScreenSize';

interface GroupedUser {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  assignments: TenantUserAssignment[];
}

const UsersTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Usuario</TableHead>
        <TableHead>Rol</TableHead>
        <TableHead>Agendable</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-12" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const UserCardSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-grow">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full mt-2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const UserCard = ({ user, handleToggleIsSchedulable, isUpdating }) => {
  const { currentAssignment } = useAuth();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`}</div>
            <Badge variant="outline">{user.role_display_name}</Badge>
          </div>
          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
            {user.status === 'active' ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground pt-1">{user.email}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-3">
          <label htmlFor={`schedulable-${user.assignment_id}`} className="text-sm font-medium">Agendable</label>
          <Switch
            id={`schedulable-${user.assignment_id}`}
            checked={user.is_schedulable}
            onCheckedChange={() => handleToggleIsSchedulable(user.assignment_id, user.is_schedulable)}
            disabled={isUpdating}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full">Acciones <MoreHorizontal className="ml-2 h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled>
              <Edit className="mr-2 h-4 w-4" />
              <span>Editar Rol (próximamente)</span>
            </DropdownMenuItem>
            {user.is_schedulable && (
              <>
                <UserScheduleDialog userId={user.user_id} userName={`${user.first_name} ${user.last_name}`} targetUserAssignments={[user]} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><CalendarCheck className="mr-2 h-4 w-4" />Horarios</DropdownMenuItem>} />
                <TimeOffRequestDialog userId={user.user_id} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><UserX className="mr-2 h-4 w-4" />Ausencias</DropdownMenuItem>} />
                <UserCommissionsDialog userId={user.user_id} userName={`${user.first_name} ${user.last_name}`} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Percent className="mr-2 h-4 w-4" />Comisiones</DropdownMenuItem>} />
                <AssignEquipmentDialog userId={user.user_id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['userAssignedEquipment', tenantId, user.user_id]})} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Briefcase className="mr-2 h-4 w-4" />Asignar Equipo</DropdownMenuItem>} />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}

export function UsersTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id || '';
  const { data: assignments, isLoading, refetch } = useTenantUsers(tenantId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const [isAssignmentManagerOpen, setIsAssignmentManagerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GroupedUser | null>(null);

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

  const updateUserAssignmentMutation = useMutation({
    mutationFn: ({ assignmentId, updates }: { assignmentId: string, updates: Partial<TenantUserAssignment> }) =>
      invokeTenantAction('update_user_assignment', { assignmentId, updates }),
    onSuccess: () => {
      toast({ title: "Éxito", description: "La asignación del usuario ha sido actualizada." });
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', tenantId] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleToggleIsSchedulable = (assignmentId: string, isSchedulable: boolean) => {
    updateUserAssignmentMutation.mutate({
      assignmentId: assignmentId,
      updates: { is_schedulable: !isSchedulable },
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return isMobile ? <UserCardSkeleton /> : <UsersTableSkeleton />;
    }

    if (!groupedUsers || groupedUsers.length === 0) {
      return (
        <EmptyState
          Icon={UserIcon}
          title="No se encontraron usuarios"
          description={searchTerm ? "Intenta con otro término de búsqueda." : "Invita a nuevos miembros para empezar a gestionar tu equipo."}
          action={
            !searchTerm && (
              <AddUserDialog onUserAdded={refetch}>
                <Button><Plus className="w-4 h-4 mr-2"/>Invitar Usuario</Button>
              </AddUserDialog>
            )
          }
        />
      );
    }

    return (
      <Accordion type="single" collapsible className="w-full">
        {groupedUsers.map(user => (
          <AccordionItem value={user.user_id} key={user.user_id}>
            <AccordionTrigger className="hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2 text-left hover:no-underline rounded-t-lg">
              <div className="flex flex-col items-start w-full">
                <div className="font-medium text-primary">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario sin nombre'}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t bg-gray-50/50 dark:bg-black/20">
              <div className="px-4 pt-3 pb-4">
                <div className="flex justify-end mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4 mr-2" />
                        Acciones de Usuario
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenAssignmentManager(user)}>
                        Administrar Asignaciones
                      </DropdownMenuItem>
                      {/* TODO: Add other user-level actions like password reset if needed */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isMobile ? (
                  <div className="space-y-3 pt-2">
                    {user.assignments.map(assignment => (
                      <div key={assignment.assignment_id} className="p-3 border rounded-lg space-y-2 bg-background">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-muted-foreground">Rol</span>
                          <span className="text-sm font-semibold">{assignment.role_display_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-muted-foreground">Sucursal</span>
                          <span className="text-sm">{assignment.branch_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-muted-foreground">Estado</span>
                          <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                            {assignment.status === 'active' ? 'Activo' : 'Invitado'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Agendable</span>
                          <Switch
                            checked={assignment.is_schedulable}
                            onCheckedChange={() => handleToggleIsSchedulable(assignment.assignment_id, assignment.is_schedulable)}
                            disabled={updateUserAssignmentMutation.isPending}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rol</TableHead>
                        <TableHead>Sucursal</TableHead>
                        <TableHead>Agendable</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.assignments.map((assignment) => (
                        <TableRow key={assignment.assignment_id}>
                          <TableCell className="font-medium">{assignment.role_display_name}</TableCell>
                          <TableCell>{assignment.branch_name || <span className="text-muted-foreground italic">N/A</span>}</TableCell>
                          <TableCell>
                            <Switch
                              checked={assignment.is_schedulable}
                              onCheckedChange={() => handleToggleIsSchedulable(assignment.assignment_id, assignment.is_schedulable)}
                              disabled={updateUserAssignmentMutation.isPending}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                              {assignment.status === 'active' ? 'Activo' : 'Invitado'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            Gestión de Usuarios
          </CardTitle>
          <CardDescription>Invita y administra los roles y permisos de los miembros de tu equipo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <AddUserDialog onUserAdded={refetch}>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Invitar Usuario</span>
              </Button>
            </AddUserDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      {selectedUser && (
        <AssignmentManagerDialog
          open={isAssignmentManagerOpen}
          onOpenChange={setIsAssignmentManagerOpen}
          userId={selectedUser.user_id}
          tenantId={tenantId}
          userName={`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email}
          initialUserAssignments={selectedUser.assignments}
          onAssignmentsUpdate={refetch}
        />
      )}
    </div>
  );
}