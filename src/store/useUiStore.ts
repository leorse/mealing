import { create } from 'zustand';

function startOfWeekIso(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // lundi
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

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
