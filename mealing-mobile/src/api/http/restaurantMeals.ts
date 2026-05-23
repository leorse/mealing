import api from './client';

export interface DishTemplate {
  id: string;
  name: string;
  category?: string;
  restaurantType?: string;
  caloriesSmall?: number;
  caloriesNormal: number;
  caloriesLarge?: number;
  proteinsNormal?: number;
  carbsNormal?: number;
  fatNormal?: number;
  source?: string;
}

export interface RestaurantMeal {
  id: string;
  userId: string;
  restaurantName?: string;
  restaurantType?: string;
  dishName: string;
  dishNotes?: string;
  estimationMethod: 'RECONSTRUCTED' | 'GUIDED' | 'FREE' | 'MIXED';
  caloriesFree?: number;
  proteinsFree?: number;
  carbsFree?: number;
  fatFree?: number;
  dishTemplate?: DishTemplate;
  portionSize?: 'SMALL' | 'NORMAL' | 'LARGE';
  totalCalories?: number;
  totalProteins?: number;
  totalCarbs?: number;
  totalFat?: number;
  isDeviation?: boolean;
  originalSlotId?: string;
  ingredients?: RestaurantIngredient[];
  createdAt?: string;
}

export interface RestaurantIngredient {
  id: string;
  ingredient: { id: string; name: string; calories100g: number };
  quantityG: number;
  unitLabel?: string;
  isEstimated: boolean;
}

export const restaurantMealsApi = {
  getAll: () => api.get<RestaurantMeal[]>('/restaurant-meals'),
  getById: (id: string) => api.get<RestaurantMeal>(`/restaurant-meals/${id}`),
  create: (meal: Partial<RestaurantMeal>) => api.post<RestaurantMeal>('/restaurant-meals', meal),
  update: (id: string, meal: Partial<RestaurantMeal>) => api.put<RestaurantMeal>(`/restaurant-meals/${id}`, meal),
  delete: (id: string) => api.delete(`/restaurant-meals/${id}`),
  addIngredient: (id: string, ingredientId: string, quantityG: number, unitLabel?: string) =>
    api.post(`/restaurant-meals/${id}/ingredients`, { ingredientId, quantityG, unitLabel }),
  removeIngredient: (id: string, ingredientId: string) =>
    api.delete(`/restaurant-meals/${id}/ingredients/${ingredientId}`),
  searchTemplates: (q?: string, category?: string) =>
    api.get<DishTemplate[]>('/dish-templates', { params: { q, category } }),
};
