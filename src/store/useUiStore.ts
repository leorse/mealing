import { create } from 'zustand';
import { startOfWeekIso } from '../utils/date';

interface UiStore {
  selectedWeekStart: string;
  ingredientSearchQuery: string;
  setSelectedWeekStart: (weekStart: string) => void;
  setIngredientSearchQuery: (q: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  selectedWeekStart: startOfWeekIso(new Date()),
  ingredientSearchQuery: '',
  setSelectedWeekStart: (weekStart) => set({ selectedWeekStart: weekStart }),
  setIngredientSearchQuery: (q) => set({ ingredientSearchQuery: q }),
}));
