import { getDb, uuidv4, now, USER_ID } from './database';
import type { Recipe, RecipeIngredient, RecipeRequest } from '../api/recipes';
import { ingredientsDbApi } from './ingredientsDb';

async function loadRecipeIngredients(db: any, recipeId: string): Promise<RecipeIngredient[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT ri.*, i.* FROM recipe_ingredients ri
     JOIN ingredients i ON i.id = ri.ingredient_id
     WHERE ri.recipe_id = ?`,
    [recipeId]
  );
  return rows.map((row: any) => ({
    id: row.id,
    quantityG: row.quantity_g,
    unitLabel: row.unit_label ?? undefined,
    ingredient: {
      id: row.ingredient_id,
      name: row.name,
      brand: row.brand ?? undefined,
      category: row.category ?? undefined,
      calories100g: row.calories_100g ?? 0,
      proteins100g: row.proteins_100g ?? undefined,
      carbs100g: row.carbs_100g ?? undefined,
      fat100g: row.fat_100g ?? undefined,
      fiber100g: row.fiber_100g ?? undefined,
      isCustom: !!row.is_custom,
    },
  }));
}

async function rowToRecipe(db: any, row: any): Promise<Recipe> {
  const ingredients = await loadRecipeIngredients(db, row.id);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    servings: row.servings ?? 1,
    prepTimeMin: row.prep_time_min ?? undefined,
    cookTimeMin: row.cook_time_min ?? undefined,
    difficulty: row.difficulty ?? undefined,
    isHealthy: row.is_healthy != null ? !!row.is_healthy : undefined,
    photoUrl: row.photo_url ?? undefined,
    ingredients,
  };
}

function computeIsHealthy(ingredients: RecipeIngredient[], servings: number): boolean {
  if (ingredients.length === 0) return false;
  const totalCal = ingredients.reduce(
    (s, ri) => s + (ri.ingredient.calories100g * ri.quantityG) / 100,
    0
  );
  const calPerServing = totalCal / servings;
  return calPerServing < 600;
}

export const recipesDbApi = {
  getAll: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM recipes WHERE user_id = ? ORDER BY name',
      [USER_ID]
    );
    const recipes = await Promise.all(rows.map((r: any) => rowToRecipe(db, r)));
    return { data: recipes };
  },

  getById: async (id: string) => {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM recipes WHERE id = ? AND user_id = ?',
      [id, USER_ID]
    );
    if (!row) throw new Error(`Recette non trouvée : ${id}`);
    return { data: await rowToRecipe(db, row) };
  },

  create: async (req: RecipeRequest) => {
    const db = await getDb();
    const id = uuidv4();
    const ts = now();

    // Save recipe
    await db.runAsync(
      `INSERT INTO recipes (id, user_id, name, description, servings, prep_time_min,
        cook_time_min, difficulty, photo_url, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, USER_ID, req.name, req.description ?? null, req.servings ?? 1,
       req.prepTimeMin ?? null, req.cookTimeMin ?? null, req.difficulty ?? null,
       req.photoUrl ?? null, ts, ts]
    );

    // Save ingredients
    const ings: RecipeIngredient[] = [];
    for (const ri of req.ingredients ?? []) {
      const riId = uuidv4();
      await db.runAsync(
        `INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity_g, unit_label)
         VALUES (?,?,?,?,?)`,
        [riId, id, ri.ingredientId, ri.quantityG, ri.unitLabel ?? null]
      );
    }

    const result = await recipesDbApi.getById(id);

    // Update isHealthy
    const isHealthy = computeIsHealthy(result.data.ingredients, result.data.servings);
    await db.runAsync('UPDATE recipes SET is_healthy = ? WHERE id = ?', [isHealthy ? 1 : 0, id]);
    result.data.isHealthy = isHealthy;

    return result;
  },

  update: async (id: string, req: RecipeRequest) => {
    const db = await getDb();
    const ts = now();

    await db.runAsync(
      `UPDATE recipes SET name=?, description=?, servings=?, prep_time_min=?,
        cook_time_min=?, difficulty=?, photo_url=?, updated_at=?
       WHERE id=? AND user_id=?`,
      [req.name, req.description ?? null, req.servings ?? 1, req.prepTimeMin ?? null,
       req.cookTimeMin ?? null, req.difficulty ?? null, req.photoUrl ?? null,
       ts, id, USER_ID]
    );

    // Replace all ingredients
    await db.runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
    for (const ri of req.ingredients ?? []) {
      await db.runAsync(
        `INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity_g, unit_label)
         VALUES (?,?,?,?,?)`,
        [uuidv4(), id, ri.ingredientId, ri.quantityG, ri.unitLabel ?? null]
      );
    }

    const result = await recipesDbApi.getById(id);
    const isHealthy = computeIsHealthy(result.data.ingredients, result.data.servings);
    await db.runAsync('UPDATE recipes SET is_healthy = ? WHERE id = ?', [isHealthy ? 1 : 0, id]);
    result.data.isHealthy = isHealthy;

    return result;
  },

  delete: async (id: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM recipes WHERE id = ? AND user_id = ?', [id, USER_ID]);
    return { data: null };
  },

  getNutrition: async (id: string) => {
    const { data: recipe } = await recipesDbApi.getById(id);
    const servings = recipe.servings || 1;
    let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;

    for (const ri of recipe.ingredients) {
      const factor = ri.quantityG / 100;
      totalCal += (ri.ingredient.calories100g ?? 0) * factor;
      totalProt += (ri.ingredient.proteins100g ?? 0) * factor;
      totalCarbs += (ri.ingredient.carbs100g ?? 0) * factor;
      totalFat += (ri.ingredient.fat100g ?? 0) * factor;
      totalFiber += (ri.ingredient.fiber100g ?? 0) * factor;
    }

    const round = (v: number) => Math.round(v * 10) / 10;
    return {
      data: {
        totalCalories: round(totalCal),
        totalProteins: round(totalProt),
        totalCarbs: round(totalCarbs),
        totalFat: round(totalFat),
        totalFiber: round(totalFiber),
        caloriesPerServing: round(totalCal / servings),
        proteinsPerServing: round(totalProt / servings),
        carbsPerServing: round(totalCarbs / servings),
        fatPerServing: round(totalFat / servings),
        fiberPerServing: round(totalFiber / servings),
        isHealthy: totalCal / servings < 600,
      },
    };
  },
};
