import { create } from 'zustand';
import { ingredientsApi, Ingredient } from '../api/ingredients';

interface IngredientState {
  localIngredients: Ingredient[];
  isLoading: boolean;
  // Ingrédient récemment ajouté — lu par la page recette pour l'auto-sélectionner
  lastAdded: Ingredient | null;

  fetchLocal: () => Promise<void>;
  addToLocal: (ingredient: Partial<Ingredient>) => Promise<Ingredient>;
  clearLastAdded: () => void;
}

export const useIngredientStore = create<IngredientState>((set, get) => ({
  localIngredients: [],
  isLoading: false,
  lastAdded: null,

  fetchLocal: async () => {
    set({ isLoading: true });
    try {
      const { data } = await ingredientsApi.search('', undefined as any);
      set({ localIngredients: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addToLocal: async (ingredient) => {
    const { data } = await ingredientsApi.create({ ...ingredient, isCustom: true });
    set((state) => ({
      localIngredients: [...state.localIngredients, data],
      lastAdded: data,
    }));
    return data;
  },

  clearLastAdded: () => set({ lastAdded: null }),
}));
