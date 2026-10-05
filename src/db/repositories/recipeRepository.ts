import { db, type Recipe, type RecipeIngredient } from '../schema';

export async function list(): Promise<Recipe[]> {
  return db.recipes.orderBy('name').toArray();
}

export async function getById(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id);
}

export async function getIngredients(recipeId: string): Promise<RecipeIngredient[]> {
  return db.recipeIngredients.where('recipeId').equals(recipeId).toArray();
}

/** Chargement groupé ; les recettes disparues sont simplement absentes du résultat. */
export async function getByIds(ids: string[]): Promise<Recipe[]> {
  return (await db.recipes.bulkGet(ids)).filter((r): r is Recipe => r !== undefined);
}

export async function getIngredientsForRecipes(recipeIds: string[]): Promise<RecipeIngredient[]> {
  return db.recipeIngredients.where('recipeId').anyOf(recipeIds).toArray();
}

/** Marquer un favori n'est pas modifier le plat : updatedAt reste inchangé.
 *  Hors de RecipeInput, le favori survit donc à l'enregistrement du formulaire. */
export async function setFavorite(id: string, isFavorite: boolean): Promise<void> {
  await db.recipes.update(id, { isFavorite });
}

export interface RecipeInput {
  name: string;
  description?: string;
  servings: number;
  kind: Recipe['kind'];
  prepTimeMin?: number;
  cookTimeMin?: number;
  difficulty?: Recipe['difficulty'];
  isHealthy?: boolean;
  tags?: string[];
  caloriesPerServing?: number;
  proteinsPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
}

export interface RecipeIngredientInput {
  ingredientId: string;
  quantityG: number;
  unitLabel?: string;
}

export async function create(data: RecipeInput, ingredients: RecipeIngredientInput[]): Promise<Recipe> {
  const now = new Date().toISOString();
  const recipe: Recipe = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

  await db.transaction('rw', db.recipes, db.recipeIngredients, async () => {
    await db.recipes.add(recipe);
    await db.recipeIngredients.bulkAdd(
      ingredients.map((i) => ({ ...i, id: crypto.randomUUID(), recipeId: recipe.id! })),
    );
  });

  return recipe;
}

export async function update(id: string, data: RecipeInput, ingredients: RecipeIngredientInput[]): Promise<void> {
  await db.transaction('rw', db.recipes, db.recipeIngredients, async () => {
    await db.recipes.update(id, { ...data, updatedAt: new Date().toISOString() });
    await db.recipeIngredients.where('recipeId').equals(id).delete();
    await db.recipeIngredients.bulkAdd(
      ingredients.map((i) => ({ ...i, id: crypto.randomUUID(), recipeId: id })),
    );
  });
}

export async function remove(id: string): Promise<void> {
  await db.transaction('rw', db.recipes, db.recipeIngredients, async () => {
    await db.recipeIngredients.where('recipeId').equals(id).delete();
    await db.recipes.delete(id);
  });
}
