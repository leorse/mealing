import type { UserProfile } from '../db/schema';

const ACTIVITY_MULTIPLIERS: Record<UserProfile['activityLevel'], number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const GOAL_ADJUSTMENTS: Record<UserProfile['goal'], number> = {
  LOSE: -0.2,
  MAINTAIN: 0,
  GAIN: 0.15,
};

function getAgeFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** Mifflin-St Jeor */
export function computeBMR(profile: Pick<UserProfile, 'gender' | 'weightKg' | 'heightCm' | 'birthDate'>): number {
  const age = getAgeFromBirthDate(profile.birthDate);
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age;
  return profile.gender === 'FEMALE' ? base - 161 : base + 5;
}

export function computeTDEE(bmr: number, activityLevel: UserProfile['activityLevel']): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function computeTargetCalories(
  profile: Pick<UserProfile, 'gender' | 'weightKg' | 'heightCm' | 'birthDate' | 'activityLevel' | 'goal' | 'targetCalories'>,
): number {
  if (profile.targetCalories != null) return profile.targetCalories;
  const bmr = computeBMR(profile);
  const tdee = computeTDEE(bmr, profile.activityLevel);
  return Math.round(tdee * (1 + GOAL_ADJUSTMENTS[profile.goal]));
}

export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Convertit la répartition macro en % en grammes cibles, à partir de l'objectif calorique. */
export function computeMacroTargets(
  targetCalories: number,
  profile: Pick<UserProfile, 'macroProteinPct' | 'macroCarbsPct' | 'macroFatPct'>,
): MacroTargets {
  return {
    proteinG: Math.round((targetCalories * (profile.macroProteinPct / 100)) / 4),
    carbsG: Math.round((targetCalories * (profile.macroCarbsPct / 100)) / 4),
    fatG: Math.round((targetCalories * (profile.macroFatPct / 100)) / 9),
  };
}

export interface CompensationPlan {
  reductionPerDay: number;
  days: number;
}

/** Répartit un écart calorique sur les jours suivants, avec plancher au BMR. */
export function computeCompensation(
  caloriesExtra: number,
  targetCaloriesToday: number,
  compensationSpread: number,
): CompensationPlan {
  const surplus = caloriesExtra - targetCaloriesToday;
  if (surplus <= 0) return { reductionPerDay: 0, days: 0 };
  return {
    reductionPerDay: Math.round(surplus / compensationSpread),
    days: compensationSpread,
  };
}

export interface HealthyCriteriaInput {
  caloriesPerServing: number;
  saturatedFatPerServing: number;
  fiberPerServing: number;
  sugarsPerServing: number;
  mainIngredientNutriScore: 'A' | 'B' | 'C' | 'D' | 'E' | undefined;
}

/** Une recette est "healthy" si elle remplit au moins 3 des 5 critères. */
export function isHealthyRecipe(input: HealthyCriteriaInput): boolean {
  const criteria = [
    input.caloriesPerServing <= 600,
    input.saturatedFatPerServing <= 5,
    input.fiberPerServing >= 3,
    input.sugarsPerServing <= 10,
    input.mainIngredientNutriScore != null && input.mainIngredientNutriScore <= 'B',
  ];
  return criteria.filter(Boolean).length >= 3;
}
