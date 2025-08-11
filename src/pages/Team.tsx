import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, DollarSign, Calendar, Edit, Phone, Mail, CalendarCheck, UserX } from "lucide-react";
import { useSchedulableUsers } from "@/hooks/useSchedulableUsers";
import { UserScheduleDialog } from "@/components/UserScheduleDialog";
import { TimeOffRequestDialog } from "@/components/TimeOffRequestDialog";
import { TimeOffRequestsList } from "@/components/TimeOffRequestsList";

export default function Team() {
  const { data: users, isLoading } = useSchedulableUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Equipo Agendable
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los horarios, permisos y comisiones del personal que realiza servicios.
          </p>
        </div>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="requests">Solicitudes de Permisos</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users?.map((user) => {
              const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
              return (
                <Card key={user.id} className="bg-card hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={`${userName}'s avatar`} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 min-h-[70px]">
                        <CardTitle className="text-xl text-primary whitespace-nowrap overflow-hidden text-ellipsis">{user.first_name || ''}</CardTitle>
                        {user.last_name && (
                          <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{user.last_name}</p>
                        )}
                        {user.branch_name && (
                          <p className="text-sm text-muted-foreground">{user.branch_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {user.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex gap-2">
                        <UserScheduleDialog
                          userId={user.id}
                          userName={userName}
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
                              Permisos
                            </Button>
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <DollarSign className="w-4 h-4 mr-1" />
                          Comisiones
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <Edit className="w-4 h-4 mr-1" />
                          Editar Perfil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {users?.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No hay personal agendable</h3>
              <p className="text-muted-foreground mb-4">Puedes marcar a un usuario como "agendable" desde la página de Gestión de Usuarios.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-primary mb-2">Gestión de Solicitudes de Permisos</h3>
            <p className="text-muted-foreground">Revisa y aprueba las solicitudes de permisos del equipo.</p>
          </div>
          
          {users?.map((user) => (
            <div key={user.id} className="space-y-4">
              <div className="flex items-center gap-3 border-b pb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-medium text-primary">{`${user.first_name || ''} ${user.last_name || ''}`.trim()}</h4>
              </div>
              <TimeOffRequestsList userId={user.id} canApprove={true} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}