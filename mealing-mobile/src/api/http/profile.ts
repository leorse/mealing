import api from './client';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
export type Goal = 'LOSE' | 'MAINTAIN' | 'GAIN';

export interface UserProfile {
  firstName?: string;
  birthDate?: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  goal?: Goal;
  targetCalories?: number;
  macroProteinPct?: number;
  macroCarbsPct?: number;
  macroFatPct?: number;
  offUsername?: string;
  offPassword?: string;
}

export interface Objectives {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}

export const profileApi = {
  get: () => api.get<UserProfile>('/profile'),
  update: (profile: UserProfile) => api.put<UserProfile>('/profile', profile),
  getObjectives: () => api.get<Objectives>('/profile/objectives'),
};
