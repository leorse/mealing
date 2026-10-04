import { useLiveQuery } from 'dexie-react-hooks';
import { listShoppingSlots } from '../db/repositories/planningRepository';
import { getByIds as getRecipesByIds, getIngredientsForRecipes } from '../db/repositories/recipeRepository';
import { getByIds as getIngredientsByIds } from '../db/repositories/ingredientRepository';
import { buildOccurrences, type ShoppingOccurrence } from '../services/shopping';

/** Liste de courses déduite des plats marqués au planning, toutes dates confondues.
 *  Retourne undefined pendant le chargement initial. */
export function useShoppingList(): ShoppingOccurrence[] | undefined {
  return useLiveQuery(async () => {
    const slots = await listShoppingSlots();
    const recipeIds = [...new Set(slots.map((s) => s.recipeId!))];
    const recipes = await getRecipesByIds(recipeIds);
    const recipeIngredients = await getIngredientsForRecipes(recipeIds);
    const ingredients = await getIngredientsByIds([...new Set(recipeIngredients.map((ri) => ri.ingredientId))]);
    return buildOccurrences({ slots, recipes, recipeIngredients, ingredients });
  }, []);
}
