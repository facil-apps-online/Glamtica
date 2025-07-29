
import { FilterableSelect } from "./FilterableSelect";
import { useSchedulableUsers } from "@/hooks/useSchedulableUsers";

interface UserSelectorProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}

export const UserSelector = ({ selectedUserId, onUserChange }: UserSelectorProps) => {
  const { data: users } = useSchedulableUsers();

  const userOptions = [
    { value: "all", label: "Todos los usuarios" },
    ...(users?.map(user => ({
      value: user.id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim()
    })) || [])
  ];

  return (
    <FilterableSelect
      label="Usuario"
      placeholder="Selecciona un usuario"
      options={userOptions}
      value={selectedUserId}
      onValueChange={onUserChange}
      searchPlaceholder="Buscar usuario..."
      emptyText="No se encontraron usuarios"
    />
  );
};

