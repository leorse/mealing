import api from './client';
import { Recipe } from './recipes';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface MealSlot {
  id: string;
  slotDate: string;
  mealType: MealType;
  recipe?: Recipe;
  freeLabel?: string;
  portions: number;
  isDeviation: boolean;
  caloriesOverride?: number;
  isConsumed: boolean;
  consumedAt?: string;
}

export interface WeekPlan {
  id: string;
  weekStart: string;
  notes?: string;
  slots: MealSlot[];
}

export const mealPlanApi = {
  getWeek: (week: string) =>
    api.get<WeekPlan>('/plans', { params: { week } }),

  create: (weekStart: string) =>
    api.post<WeekPlan>('/plans', { weekStart }),

  addSlot: (planId: string, slot: Partial<MealSlot> & { recipeId?: string }) =>
    api.post<MealSlot>(`/plans/${planId}/slots`, slot),

  updateSlot: (slotId: string, slot: Partial<MealSlot> & { recipeId?: string }) =>
    api.put<MealSlot>(`/plans/slots/${slotId}`, slot),

  deleteSlot: (slotId: string) =>
    api.delete(`/plans/slots/${slotId}`),

  markConsumed: (slotId: string) =>
    api.put<MealSlot>(`/plans/slots/${slotId}/consume`),

  copyWeek: (planId: string, targetWeekStart: string) =>
    api.post<WeekPlan>(`/plans/${planId}/copy`, { targetWeekStart }),
};
