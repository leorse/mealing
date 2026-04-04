import { create } from 'zustand';
import { nutritionApi, DailyLog, Deviation, CompensationResponse } from '../api/nutrition';
import { Objectives, profileApi } from '../api/profile';

interface NutritionState {
  dailyLogs: Record<string, DailyLog>;
  objectives: Objectives | null;
  deviations: Deviation[];
  compensation: CompensationResponse | null;
  weeklyData: DailyLog[];
  isLoading: boolean;

  fetchDailyLog: (date: string) => Promise<void>;
  updateDailyLog: (date: string, log: Partial<DailyLog>) => Promise<void>;
  fetchObjectives: () => Promise<void>;
  addDeviation: (deviation: Omit<Deviation, 'id'>) => Promise<void>;
  fetchDeviations: () => Promise<void>;
  fetchCompensation: () => Promise<void>;
  fetchWeeklyData: (week: string) => Promise<void>;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  dailyLogs: {},
  objectives: null,
  deviations: [],
  compensation: null,
  weeklyData: [],
  isLoading: false,

  fetchDailyLog: async (date: string) => {
    set({ isLoading: true });
    try {
      const { data } = await nutritionApi.getDailyLog(date);
      set((state) => ({ dailyLogs: { ...state.dailyLogs, [date]: data }, isLoading: false }));
    } catch {
      set({ isLoading: false });
    }
  },

  updateDailyLog: async (date: string, log: Partial<DailyLog>) => {
    const { data } = await nutritionApi.updateDailyLog(date, log);
    set((state) => ({ dailyLogs: { ...state.dailyLogs, [date]: data } }));
  },

  fetchObjectives: async () => {
    try {
      const { data } = await profileApi.getObjectives();
      set({ objectives: data });
    } catch {}
  },

  addDeviation: async (deviation) => {
    const { data } = await nutritionApi.addDeviation(deviation);
    set((state) => ({ deviations: [data, ...state.deviations] }));
  },

  fetchDeviations: async () => {
    const { data } = await nutritionApi.getDeviations();
    set({ deviations: data });
  },

  fetchCompensation: async () => {
    const { data } = await nutritionApi.getCompensation();
    set({ compensation: data });
  },

  fetchWeeklyData: async (week: string) => {
    const { data } = await nutritionApi.getWeeklyAnalytics(week);
    set({ weeklyData: data });
  },
}));
