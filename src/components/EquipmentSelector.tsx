
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipment } from '@/hooks/useEquipment';

interface EquipmentSelectorProps {
  onSelectEquipment: (equipmentId: string | null) => void;
  selectedEquipmentId?: string | null;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ onSelectEquipment, selectedEquipmentId }) => {
  const { equipment, loading } = useEquipment();

  const unassignedEquipment = equipment.filter(e => !e.assigned_user_name);

  return (
    <Select onValueChange={(value) => onSelectEquipment(value)} value={selectedEquipmentId || ''}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar equipo..." />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <SelectItem value="loading" disabled>Cargando equipo...</SelectItem>
        ) : (
          unassignedEquipment.map((eq) => (
            <SelectItem key={eq.id} value={eq.id}>
              {eq.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};
