
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// TODO: Fetch equipment and implement proper logic
const dummyEquipment = [
  { id: '1', name: 'Laptop Dell XPS 15' },
  { id: '2', name: 'Monitor LG Ultrawide 34"' },
  { id: '3', name: 'Silla Ergonómica Herman Miller' },
];

interface EquipmentSelectorProps {
  onSelectEquipment: (equipmentId: string | null) => void;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ onSelectEquipment }) => {
  return (
    <Select onValueChange={(value) => onSelectEquipment(value)}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar equipo..." />
      </SelectTrigger>
      <SelectContent>
        {dummyEquipment.map((equipment) => (
          <SelectItem key={equipment.id} value={equipment.id}>
            {equipment.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
