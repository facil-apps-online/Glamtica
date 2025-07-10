
import { FilterableSelect } from "./FilterableSelect";
import { useStylists } from "@/hooks/useStylists";

interface StylistSelectorProps {
  selectedStylistId: string;
  onStylistChange: (stylistId: string) => void;
}

export const StylistSelector = ({ selectedStylistId, onStylistChange }: StylistSelectorProps) => {
  const { data: stylists } = useStylists();

  const stylistOptions = [
    { value: "all", label: "Todos los estilistas" },
    ...(stylists?.map(stylist => ({
      value: stylist.id,
      label: stylist.name
    })) || [])
  ];

  return (
    <FilterableSelect
      label="Estilista"
      placeholder="Selecciona un estilista"
      options={stylistOptions}
      value={selectedStylistId}
      onValueChange={onStylistChange}
      searchPlaceholder="Buscar estilista..."
      emptyText="No se encontraron estilistas"
    />
  );
};
