import { FilterableSelect } from "./FilterableSelect";
import { TenantUserAssignment } from "@/hooks/useTenantUsers";

interface UserSelectorProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  users: TenantUserAssignment[];
}

export const UserSelector = ({ selectedUserId, onUserChange, users }: UserSelectorProps) => {
  const userOptions = [
    { value: "all", label: "Todos los usuarios" },
    ...(users?.map(user => ({
      value: user.user_id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim()
    })) || [])
  ];

  return (
    <FilterableSelect
      placeholder="Selecciona un usuario"
      options={userOptions}
      value={selectedUserId}
      onValueChange={onUserChange}
      searchPlaceholder="Buscar usuario..."
      emptyText="No se encontraron usuarios"
      className="flex flex-col"
    />
  );
};