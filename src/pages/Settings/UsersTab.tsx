import { useAuth } from '@/contexts/AuthContext';
import { TenantUsersManager } from '@/pages/Superadmin/TenantUsersManager';

export function UsersTab() {
  const { currentAssignment } = useAuth();

  if (!currentAssignment) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="mt-4">
      <TenantUsersManager tenantId={currentAssignment.tenant_id} />
    </div>
  );
}
