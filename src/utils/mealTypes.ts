import type { MealSlot } from '../db/schema';

/** Créneaux d'une journée, dans l'ordre d'affichage. */
export const MEAL_TYPES: { type: MealSlot['mealType']; label: string }[] = [
  { type: 'BREAKFAST', label: 'Petit-déj' },
  { type: 'LUNCH', label: 'Déjeuner' },
  { type: 'DINNER', label: 'Dîner' },
  { type: 'SNACK', label: 'Collation' },
];

export function mealTypeLabel(type: MealSlot['mealType']): string {
  return MEAL_TYPES.find((m) => m.type === type)?.label ?? type;
}

export function mealTypeOrder(type: MealSlot['mealType']): number {
  return MEAL_TYPES.findIndex((m) => m.type === type);
}
