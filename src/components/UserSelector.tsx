import { FilterableSelect } from "./FilterableSelect";
import { TenantUserAssignment } from "@/hooks/useTenantUsers";

interface UserSelectorProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  users: any[];
  label?: string;
}

export const UserSelector = ({ selectedUserId, onUserChange, users, label = "Profesional" }: UserSelectorProps) => {
  const sortedUsers = users?.slice().sort((a, b) => {
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const userOptions = [
    { value: "all", label: "Todos los usuarios" },
    ...(sortedUsers?.map(user => ({
      value: user.id || user.user_id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim()
    })) || [])
  ];

  return (
    <FilterableSelect
      label={label}
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