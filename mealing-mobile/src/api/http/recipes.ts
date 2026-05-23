import api from './client';
import { Ingredient } from './ingredients';

export interface RecipeIngredient {
  id: string;
  ingredient: Ingredient;
  quantityG: number;
  unitLabel?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  prepTimeMin?: number;
  cookTimeMin?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  isHealthy?: boolean;
  photoUrl?: string;
  ingredients: RecipeIngredient[];
}

export interface NutritionResponse {
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  caloriesPerServing: number;
  proteinsPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  fiberPerServing: number;
  isHealthy: boolean;
}

export interface RecipeRequest {
  name: string;
  description?: string;
  servings?: number;
  prepTimeMin?: number;
  cookTimeMin?: number;
  difficulty?: string;
  photoUrl?: string;
  ingredients?: { ingredientId: string; quantityG: number; unitLabel?: string }[];
}

export const recipesApi = {
  getAll: () => api.get<Recipe[]>('/recipes'),
  getById: (id: string) => api.get<Recipe>(`/recipes/${id}`),
  create: (recipe: RecipeRequest) => api.post<Recipe>('/recipes', recipe),
  update: (id: string, recipe: RecipeRequest) => api.put<Recipe>(`/recipes/${id}`, recipe),
  delete: (id: string) => api.delete(`/recipes/${id}`),
  getNutrition: (id: string) => api.get<NutritionResponse>(`/recipes/${id}/nutrition`),
};
