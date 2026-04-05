import api from './client';

export interface MealExtra {
  id: string;
  mealSlotId: string;
  label: string;
  extraType: 'STARTER' | 'DESSERT' | 'SIDE' | 'DRINK' | 'SNACK' | 'OTHER';
  // Option A : ingrédient
  ingredientId?: string;
  quantityG?: number;
  // Option B : plat préparé
  preparedMealId?: string;
  portions?: number;
  // Option C : libre
  caloriesFree?: number;
  proteinsFree?: number;
  carbsFree?: number;
  fatFree?: number;
  addedAt?: string;
}

export interface NutritionTotal {
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
  extrasCount: number;
}

export const mealExtrasApi = {
  getExtras: (slotId: string) => api.get<MealExtra[]>(`/meal-slots/${slotId}/extras`),
  addExtra: (slotId: string, extra: Partial<MealExtra>) => api.post<MealExtra>(`/meal-slots/${slotId}/extras`, extra),
  updateExtra: (slotId: string, extraId: string, extra: Partial<MealExtra>) =>
    api.put<MealExtra>(`/meal-slots/${slotId}/extras/${extraId}`, extra),
  deleteExtra: (slotId: string, extraId: string) =>
    api.delete(`/meal-slots/${slotId}/extras/${extraId}`),
  getNutritionTotal: (slotId: string) => api.get<NutritionTotal>(`/meal-slots/${slotId}/nutrition-total`),
};
