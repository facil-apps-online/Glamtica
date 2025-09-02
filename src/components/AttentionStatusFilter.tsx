import { FilterableSelect } from "./FilterableSelect";

interface AttentionStatusFilterProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export const AttentionStatusFilter = ({ selectedStatus, onStatusChange }: AttentionStatusFilterProps) => {
  const statusOptions = [
    { value: "all", label: "Todos los Estados" },
    { value: "pending", label: "Solo Pendientes" },
    { value: "Confirmada", label: "Confirmadas" },
    { value: "En Proceso", label: "En Proceso" },
    { value: "Finalizada", label: "Finalizadas" },
    { value: "Pagada", label: "Pagadas" },
    { value: "Cancelada", label: "Canceladas" }
  ];

  return (
    <FilterableSelect
      label="Estado"
      placeholder="Selecciona un estado"
      options={statusOptions}
      value={selectedStatus}
      onValueChange={onStatusChange}
      searchPlaceholder="Buscar estado..."
      emptyText="No se encontraron estados"
      className="flex flex-col h-16"
    />
  );
};