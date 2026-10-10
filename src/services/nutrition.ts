import type { UserProfile, Ingredient } from '../db/schema';

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

export interface RecipeNutritionItem {
  ingredient: Ingredient;
  quantityG: number;
}

export interface RecipeNutritionTotals {
  calories: number;
  proteins: number;
  carbs: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
}

function sumPer100g(items: RecipeNutritionItem[], field: keyof Ingredient): number {
  return items.reduce((sum, { ingredient, quantityG }) => {
    const value = ingredient[field];
    return sum + (typeof value === 'number' ? (value / 100) * quantityG : 0);
  }, 0);
}

/** Valeurs nutritionnelles totales d'une recette, à partir de ses ingrédients et quantités (§8.4). */
export function computeRecipeNutrition(items: RecipeNutritionItem[]): RecipeNutritionTotals {
  return {
    calories: sumPer100g(items, 'calories100g'),
    proteins: sumPer100g(items, 'proteins100g'),
    carbs: sumPer100g(items, 'carbs100g'),
    sugars: sumPer100g(items, 'sugars100g'),
    fat: sumPer100g(items, 'fat100g'),
    saturatedFat: sumPer100g(items, 'saturatedFat100g'),
    fiber: sumPer100g(items, 'fiber100g'),
  };
}

export function perServing(totals: RecipeNutritionTotals, servings: number): RecipeNutritionTotals {
  const n = servings > 0 ? servings : 1;
  return {
    calories: totals.calories / n,
    proteins: totals.proteins / n,
    carbs: totals.carbs / n,
    sugars: totals.sugars / n,
    fat: totals.fat / n,
    saturatedFat: totals.saturatedFat / n,
    fiber: totals.fiber / n,
  };
}

/** Ingrédient principal = plus grosse quantité en grammes, utilisé pour le critère "healthy" (§8.5). */
export function mainIngredient(items: RecipeNutritionItem[]): Ingredient | undefined {
  return items.reduce<RecipeNutritionItem | undefined>(
    (max, item) => (!max || item.quantityG > max.quantityG ? item : max),
    undefined,
  )?.ingredient;
}

/** Saisie des valeurs pour 100 g d'un aliment personnel ; un champ vide vaut 0. */
export interface Per100gDraft {
  calories: number | '';
  proteins: number | '';
  carbs: number | '';
  fat: number | '';
}

export type Per100gValues = Required<Pick<Ingredient, 'calories100g' | 'proteins100g' | 'carbs100g' | 'fat100g'>>;

export const EMPTY_PER_100G: Per100gDraft = { calories: 0, proteins: 0, carbs: 0, fat: 0 };

export function per100gDraftOf(ingredient: Ingredient): Per100gDraft {
  return {
    calories: ingredient.calories100g ?? 0,
    proteins: ingredient.proteins100g ?? 0,
    carbs: ingredient.carbs100g ?? 0,
    fat: ingredient.fat100g ?? 0,
  };
}

export function isPer100gDraftValid(draft: Per100gDraft): boolean {
  return Object.values(draft).every((value) => value === '' || value >= 0);
}

export function per100gFromDraft(draft: Per100gDraft): Per100gValues {
  return {
    calories100g: draft.calories || 0,
    proteins100g: draft.proteins || 0,
    carbs100g: draft.carbs || 0,
    fat100g: draft.fat || 0,
  };
}

/**
 * Aliment personnel dont aucune valeur n'est renseignée : il compte pour zéro dans un plat.
 * Un aliment Ciqual à 0 kcal (eau, sel) n'est pas concerné.
 */
export function lacksNutrition(ingredient: Ingredient): boolean {
  return (
    ingredient.isCustom &&
    !ingredient.calories100g &&
    !ingredient.proteins100g &&
    !ingredient.carbs100g &&
    !ingredient.fat100g
  );
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
