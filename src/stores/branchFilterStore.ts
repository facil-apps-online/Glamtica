import { create } from 'zustand';

interface BranchFilterState {
  selectedBranchId: string; // 'all' para todas, o el UUID de una sucursal
  setBranchId: (branchId: string) => void;
}

export const useBranchFilterStore = create<BranchFilterState>((set) => ({
  selectedBranchId: 'all', // Por defecto, mostrar "Todas las Sucursales"
  setBranchId: (branchId) => set({ selectedBranchId: branchId }),
}));
