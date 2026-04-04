import { create } from 'zustand';
import { recipesApi, Recipe, RecipeRequest } from '../api/recipes';

interface RecipeState {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  isLoading: boolean;

  fetchRecipes: () => Promise<void>;
  fetchRecipe: (id: string) => Promise<void>;
  createRecipe: (recipe: RecipeRequest) => Promise<Recipe>;
  updateRecipe: (id: string, recipe: RecipeRequest) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  setSelectedRecipe: (recipe: Recipe | null) => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: [],
  selectedRecipe: null,
  isLoading: false,

  fetchRecipes: async () => {
    set({ isLoading: true });
    try {
      const { data } = await recipesApi.getAll();
      set({ recipes: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchRecipe: async (id: string) => {
    const { data } = await recipesApi.getById(id);
    set({ selectedRecipe: data });
  },

  createRecipe: async (recipe: RecipeRequest) => {
    const { data } = await recipesApi.create(recipe);
    set((state) => ({ recipes: [...state.recipes, data] }));
    return data;
  },

  updateRecipe: async (id: string, recipe: RecipeRequest) => {
    const { data } = await recipesApi.update(id, recipe);
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === id ? data : r)),
      selectedRecipe: state.selectedRecipe?.id === id ? data : state.selectedRecipe,
    }));
  },

  deleteRecipe: async (id: string) => {
    await recipesApi.delete(id);
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    }));
  },

  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
}));
