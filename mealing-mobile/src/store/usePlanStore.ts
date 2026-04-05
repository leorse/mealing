import { create } from 'zustand';
import { mealPlanApi, WeekPlan, MealSlot, MealType } from '../api/mealplan';
import { format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlanState {
  currentWeek: WeekPlan | null;
  selectedDate: Date;
  isLoading: boolean;
  error: string | null;

  fetchWeek: (weekStart: string) => Promise<void>;
  fetchCurrentWeek: () => Promise<void>;
  addSlot: (planId: string, slot: { slotDate: string; mealType: MealType; recipeId?: string; preparedMealId?: string; freeLabel?: string; caloriesOverride?: number; portions?: number }) => Promise<void>;
  updateSlot: (slotId: string, slot: Partial<MealSlot> & { recipeId?: string }) => Promise<void>;
  deleteSlot: (slotId: string) => Promise<void>;
  markConsumed: (slotId: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  currentWeek: null,
  selectedDate: new Date(),
  isLoading: false,
  error: null,

  fetchWeek: async (weekStart: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await mealPlanApi.getWeek(weekStart);
      set({ currentWeek: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchCurrentWeek: async () => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekStart = format(monday, 'yyyy-MM-dd');
    await get().fetchWeek(weekStart);
  },

  addSlot: async (planId, slot) => {
    const { data } = await mealPlanApi.addSlot(planId, slot);
    set((state) => ({
      currentWeek: state.currentWeek
        ? { ...state.currentWeek, slots: [...state.currentWeek.slots, data] }
        : null,
    }));
  },

  updateSlot: async (slotId, slot) => {
    const { data } = await mealPlanApi.updateSlot(slotId, slot);
    set((state) => ({
      currentWeek: state.currentWeek
        ? {
            ...state.currentWeek,
            slots: state.currentWeek.slots.map((s) => (s.id === slotId ? data : s)),
          }
        : null,
    }));
  },

  deleteSlot: async (slotId) => {
    await mealPlanApi.deleteSlot(slotId);
    set((state) => ({
      currentWeek: state.currentWeek
        ? { ...state.currentWeek, slots: state.currentWeek.slots.filter((s) => s.id !== slotId) }
        : null,
    }));
  },

  markConsumed: async (slotId) => {
    const { data } = await mealPlanApi.markConsumed(slotId);
    set((state) => ({
      currentWeek: state.currentWeek
        ? {
            ...state.currentWeek,
            slots: state.currentWeek.slots.map((s) => (s.id === slotId ? data : s)),
          }
        : null,
    }));
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
}));
