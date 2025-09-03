import { create } from 'zustand';

interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  is_global?: boolean;
}

interface UomState {
  units: UnitOfMeasure[];
  setUnits: (units: UnitOfMeasure[]) => void;
  addUnit: (unit: UnitOfMeasure) => void;
  updateUnitState: (unit: UnitOfMeasure) => void;
  removeUnit: (unitId: string) => void;
}

export const useUomStore = create<UomState>((set) => ({
  units: [],
  setUnits: (units) => set({ units }),
  addUnit: (unit) => set((state) => ({ units: [...state.units, unit] })),
  updateUnitState: (updatedUnit) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === updatedUnit.id ? updatedUnit : unit
      ),
    })),
  removeUnit: (unitId) =>
    set((state) => ({
      units: state.units.filter((unit) => unit.id !== unitId),
    })),
}));
