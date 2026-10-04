import type { Ingredient, MealSlot, Recipe, RecipeIngredient } from '../db/schema';
import type { ShoppingItemChange } from '../db/repositories/planningRepository';
import { mealTypeOrder } from '../utils/mealTypes';

/** Un article d'un plat : un ingrédient, ou le plat lui-même s'il est tout prêt. */
export interface ShoppingLine {
  itemId: string;
  name: string;
  /** Absent pour un plat tout prêt, qui se compte à l'unité. */
  quantityG?: number;
  isOff: boolean;
}

/** Un plat marqué au planning. Le même plat marqué deux fois donne deux occurrences. */
export interface ShoppingOccurrence {
  slotId: string;
  recipeId: string;
  recipeName: string;
  slotDate: string;
  mealType: MealSlot['mealType'];
  isPrepared: boolean;
  /** Articles restants : les articles supprimés n'y figurent pas. */
  lines: ShoppingLine[];
  isOff: boolean;
}

export interface ShoppingSource {
  slotId: string;
  recipeName: string;
  slotDate: string;
  mealType: MealSlot['mealType'];
  quantityG?: number;
  isOff: boolean;
}

export interface ShoppingProvenance {
  recipeId: string;
  recipeName: string;
  count: number;
  isOff: boolean;
}

/** Un article regroupé sur tous les plats qui le demandent. */
export interface ShoppingGroup {
  itemId: string;
  name: string;
  isPrepared: boolean;
  /** Somme des quantités actives, et somme de toutes les quantités restantes. */
  activeG: number;
  totalG: number;
  activeCount: number;
  isOff: boolean;
  sources: ShoppingSource[];
  provenance: ShoppingProvenance[];
}

export interface ShoppingData {
  slots: MealSlot[];
  recipes: Recipe[];
  recipeIngredients: RecipeIngredient[];
  ingredients: Ingredient[];
}

/** Liste de courses, plat par plat, triée par date puis par repas.
 *  Un écart ou un plat dont la recette a disparu n'apporte rien. */
export function buildOccurrences({ slots, recipes, recipeIngredients, ingredients }: ShoppingData): ShoppingOccurrence[] {
  const recipeById = new Map(recipes.map((r) => [r.id!, r]));
  const ingredientById = new Map(ingredients.map((i) => [i.id!, i]));

  const occurrences: ShoppingOccurrence[] = [];
  for (const slot of slots) {
    if (!slot.includeInShopping || !slot.recipeId) continue;
    const recipe = recipeById.get(slot.recipeId);
    if (!recipe) continue;

    const states = slot.shoppingItemStates ?? {};
    const isPrepared = recipe.kind === 'PREPARED';
    // La quantité est celle de la recette, telle quelle : cocher un plat, c'est acheter de quoi le faire.
    const candidates: Omit<ShoppingLine, 'isOff'>[] = isPrepared
      ? [{ itemId: recipe.id!, name: recipe.name }]
      : recipeIngredients
          .filter((ri) => ri.recipeId === recipe.id)
          .flatMap((ri) => {
            const ingredient = ingredientById.get(ri.ingredientId);
            return ingredient ? [{ itemId: ingredient.id!, name: ingredient.name, quantityG: ri.quantityG }] : [];
          });

    const lines = candidates
      .filter((line) => states[line.itemId] !== 'DELETED')
      .map((line) => ({ ...line, isOff: states[line.itemId] === 'OFF' }));

    occurrences.push({
      slotId: slot.id!,
      recipeId: recipe.id!,
      recipeName: recipe.name,
      slotDate: slot.slotDate,
      mealType: slot.mealType,
      isPrepared,
      lines,
      isOff: lines.length > 0 && lines.every((l) => l.isOff),
    });
  }

  return occurrences.sort(
    (a, b) => a.slotDate.localeCompare(b.slotDate) || mealTypeOrder(a.mealType) - mealTypeOrder(b.mealType),
  );
}

/** La même liste, article par article : une ligne par ingrédient, quantités additionnées. */
export function groupByItem(occurrences: ShoppingOccurrence[]): { ingredients: ShoppingGroup[]; prepared: ShoppingGroup[] } {
  const groups = new Map<string, ShoppingGroup>();

  for (const occurrence of occurrences) {
    for (const line of occurrence.lines) {
      let group = groups.get(line.itemId);
      if (!group) {
        group = {
          itemId: line.itemId,
          name: line.name,
          isPrepared: occurrence.isPrepared,
          activeG: 0,
          totalG: 0,
          activeCount: 0,
          isOff: true,
          sources: [],
          provenance: [],
        };
        groups.set(line.itemId, group);
      }

      group.sources.push({
        slotId: occurrence.slotId,
        recipeName: occurrence.recipeName,
        slotDate: occurrence.slotDate,
        mealType: occurrence.mealType,
        quantityG: line.quantityG,
        isOff: line.isOff,
      });
      group.totalG += line.quantityG ?? 0;
      if (!line.isOff) {
        group.activeG += line.quantityG ?? 0;
        group.activeCount += 1;
        group.isOff = false;
      }

      const provenance = group.provenance.find((p) => p.recipeId === occurrence.recipeId);
      if (provenance) {
        provenance.count += 1;
        provenance.isOff = provenance.isOff && line.isOff;
      } else {
        group.provenance.push({
          recipeId: occurrence.recipeId,
          recipeName: occurrence.recipeName,
          count: 1,
          isOff: line.isOff,
        });
      }
    }
  }

  const sorted = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return {
    ingredients: sorted.filter((g) => !g.isPrepared),
    prepared: sorted.filter((g) => g.isPrepared),
  };
}

/** Regroupe des articles visés par créneau. Pour une suppression, signale les plats
 *  qui n'auraient plus aucun article : ils doivent quitter la liste. */
export function toItemChanges(
  occurrences: ShoppingOccurrence[],
  targets: { slotId: string; itemId: string }[],
  isDeletion: boolean,
): ShoppingItemChange[] {
  const itemIdsBySlot = new Map<string, string[]>();
  for (const { slotId, itemId } of targets) {
    itemIdsBySlot.set(slotId, [...(itemIdsBySlot.get(slotId) ?? []), itemId]);
  }

  return [...itemIdsBySlot].map(([slotId, itemIds]) => {
    const lines = occurrences.find((o) => o.slotId === slotId)?.lines ?? [];
    const unmark = isDeletion && lines.every((l) => itemIds.includes(l.itemId));
    return { slotId, itemIds, unmark };
  });
}
