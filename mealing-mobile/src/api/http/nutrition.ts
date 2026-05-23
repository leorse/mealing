import api from './client';

export interface DailyLog {
  id?: string;
  logDate: string;
  totalCalories?: number;
  totalProteins?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFiber?: number;
  weightKg?: number;
  notes?: string;
}

export interface Deviation {
  id: string;
  deviationDate: string;
  type: 'PLANNED' | 'UNPLANNED';
  label?: string;
  caloriesExtra: number;
  compensationSpread: number;
  notes?: string;
}

export interface CompensationResponse {
  totalSurplusKcal: number;
  adjustments: { date: string; baseTarget: number; adjustment: number; adjustedTarget: number }[];
}

export const nutritionApi = {
  getDailyLog: (date: string) =>
    api.get<DailyLog>('/nutrition/log', { params: { date } }),

  updateDailyLog: (date: string, log: Partial<DailyLog>) =>
    api.put<DailyLog>(`/nutrition/log/${date}`, log),

  getStats: (from: string, to: string) =>
    api.get<DailyLog[]>('/nutrition/stats', { params: { from, to } }),

  addDeviation: (deviation: Omit<Deviation, 'id'>) =>
    api.post<Deviation>('/nutrition/deviations', deviation),

  getDeviations: () =>
    api.get<Deviation[]>('/nutrition/deviations'),

  getCompensation: () =>
    api.get<CompensationResponse>('/nutrition/deviations/compensation'),

  getWeeklyAnalytics: (week: string) =>
    api.get<DailyLog[]>('/analytics/weekly', { params: { week } }),

  getMonthlyAnalytics: (month: string) =>
    api.get<DailyLog[]>('/analytics/monthly', { params: { month } }),

  getTrends: (period?: number) =>
    api.get<DailyLog[]>('/analytics/trends', { params: { period } }),
};
