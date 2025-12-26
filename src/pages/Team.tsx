import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, CalendarCheck, UserX, Briefcase, Edit } from "lucide-react";
import { useSchedulableUsers, SchedulableUser } from "@/hooks/useSchedulableUsers";
import { UserScheduleDialog } from "@/components/UserScheduleDialog";
import { TimeOffRequestDialog } from "@/components/TimeOffRequestDialog";
import { UserCommissionsDialog } from "@/components/UserCommissionsDialog";
import { AssignEquipmentDialog } from '@/components/AssignEquipmentDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { invokeTenantAction, TenantUserAssignment } from '@/hooks/useTenantUsers';
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleDriveImage } from "@/hooks/useGoogleDriveImage";
import { EditProfileDialog } from "@/components/EditProfileDialog";

const TeamMemberCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-start justify-between">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 min-w-0 min-h-[70px] space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-6 w-16" />
    </CardHeader>
    <CardContent className="space-y-2 pt-4 border-t">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-full" />
      </div>
    </CardContent>
  </Card>
);

const TeamMemberCard = ({ user, allUserAssignments, queryClient, tenantId }: { user: SchedulableUser, allUserAssignments: TenantUserAssignment[], queryClient: QueryClient, tenantId: string }) => {
  const { displayUrl } = useGoogleDriveImage(user.avatar_url);
  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const userSpecificAssignments = allUserAssignments?.filter(
    (assignment) => assignment.user_id === user.id
  ) || [];

  const cardClassName = `bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${!user.is_active ? 'opacity-60' : ''}`;
  const textClassName = !user.is_active ? 'text-muted-foreground' : '';

  return (
    <Card className={cardClassName}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center overflow-hidden ${!user.is_active ? 'grayscale' : ''}`}>
            {displayUrl ? (
              <img src={displayUrl} alt={`${userName}'s avatar`} className="w-full h-full object-cover" />
            ) : (
              <User className={`w-8 h-8 ${!user.is_active ? 'text-muted-foreground' : 'text-primary'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0 min-h-[70px]">
            <CardTitle className={`text-xl whitespace-nowrap overflow-hidden text-ellipsis ${!user.is_active ? 'text-muted-foreground' : 'text-primary'}`}>
              {user.first_name || ''}
            </CardTitle>
            {user.last_name && (
              <p className={`text-sm whitespace-nowrap overflow-hidden text-ellipsis ${textClassName}`}>{user.last_name}</p>
            )}
            {user.branch_name && (
              <p className={`text-sm ${textClassName}`}>{user.branch_name}</p>
            )}
          </div>
        </div>
        {user.is_schedulable && (
          <div className={`flex-shrink-0 ${!user.is_active ? 'opacity-60' : ''}`}>
            <CalendarCheck className="w-5 h-5 text-green-500" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {user.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className={`text-sm ${textClassName}`}>{user.email}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex gap-2">
            <UserScheduleDialog
              userId={user.id}
              userName={userName}
              targetUserAssignments={userSpecificAssignments}
              trigger={
                <Button variant="outline" size="sm" className="flex-1">
                  <CalendarCheck className="w-4 h-4 mr-1" />
                  Horarios
                </Button>
              }
            />
            <TimeOffRequestDialog
              userId={user.id}
              trigger={
                <Button variant="outline" size="sm" className="flex-1">
                  <UserX className="w-4 h-4 mr-1" />
                  Ausencias
                </Button>
              }
            />
          </div>
          <div className="flex gap-2">
            <UserCommissionsDialog userId={user.id} userName={userName} />
            <AssignEquipmentDialog
              userId={user.id}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['userAssignedEquipment', tenantId, user.id] });
                queryClient.invalidateQueries({ queryKey: ['equipment'] });
              }}
              trigger={
                <Button variant="outline" size="sm" className="flex-1">
                  <Briefcase className="w-4 h-4 mr-1" />
                  Asignar Equipo
                </Button>
              }
            />
          </div>
          <div className="flex gap-2">
            <EditProfileDialog 
              user={user}
              trigger={
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Editar Perfil
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Team() {
  const { data: users, isLoading } = useSchedulableUsers();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id || '';
  const queryClient = useQueryClient();

  const { data: allUserAssignments, isLoading: isLoadingAssignments } = useQuery<TenantUserAssignment[], Error>({
    queryKey: ['all-tenant-user-assignments', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const assignments = await invokeTenantAction('get_users_for_tenant', { tenantId });
      return assignments.map((assignment: TenantUserAssignment) => ({
        ...assignment,
        tenant_id: tenantId,
      }));
    },
    enabled: !!tenantId,
  });

  const renderContent = () => {
    if (isLoading || isLoadingAssignments) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <TeamMemberCardSkeleton key={i} />)}
        </div>
      );
    }

    if (!users || users.length === 0) {
      return (
        <EmptyState
          Icon={User}
          title="No hay personal agendable"
          description={`Puedes marcar a un usuario como "agendable" desde la página de Gestión de Usuarios.`}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <TeamMemberCard key={user.id} user={user} allUserAssignments={allUserAssignments || []} queryClient={queryClient} tenantId={tenantId} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Equipo Agendable"
        subtitle="Gestiona los horarios, permisos y comisiones del personal que realiza servicios."
      />
      {renderContent()}
    </div>
  );
}