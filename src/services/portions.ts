import type { Ingredient } from '../db/schema';

/** Libellé des aliments qui ne se comptent pas à l'unité : une « portion » n'est qu'une quantité usuelle. */
const GENERIC_LABEL = 'portion';

export type IngredientWithPortion = Ingredient & { portionG: number; portionLabel: string };

export function hasPortion(ingredient: Ingredient): ingredient is IngredientWithPortion {
  return ingredient.portionG !== undefined && ingredient.portionG > 0 && Boolean(ingredient.portionLabel);
}

/** Vrai pour « saucisse », « œuf », « c. à soupe »… : la saisie se propose alors en unités d'emblée. */
export function hasOwnUnit(ingredient: Ingredient): ingredient is IngredientWithPortion {
  return hasPortion(ingredient) && ingredient.portionLabel !== GENERIC_LABEL;
}

export function gramsFor(unitCount: number, portionG: number): number {
  return unitCount * portionG;
}

/** Accord du nom d'unité, pluriel à partir de 2. Un libellé abrégé ou composé reste invariable. */
export function pluralizeUnit(label: string, count: number): string {
  if (count < 2 || /[ .]/.test(label) || /[sxz]$/.test(label)) return label;
  return /au$/.test(label) ? `${label}x` : `${label}s`;
}

export function formatGrams(grams: number): string {
  return `${Math.round(grams)} g`;
}

function formatCount(count: number): string {
  return count.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

/** « 3 saucisses (390 g) » pour une saisie en unités, « 390 g » pour une saisie en grammes. */
export function formatQuantity(line: { quantityG: number; unitCount?: number }, ingredient: Ingredient): string {
  if (line.unitCount === undefined || !hasPortion(ingredient)) return formatGrams(line.quantityG);
  const unit = pluralizeUnit(ingredient.portionLabel, line.unitCount);
  return `${formatCount(line.unitCount)} ${unit} (${formatGrams(line.quantityG)})`;
}
