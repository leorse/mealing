import { getDb, uuidv4, now, USER_ID } from './database';
import type { Ingredient } from '../api/ingredients';

function rowToIngredient(row: any): Ingredient {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    barcode: row.barcode ?? undefined,
    category: row.category ?? undefined,
    calories100g: row.calories_100g ?? 0,
    proteins100g: row.proteins_100g ?? undefined,
    carbs100g: row.carbs_100g ?? undefined,
    sugars100g: row.sugars_100g ?? undefined,
    fat100g: row.fat_100g ?? undefined,
    saturatedFat100g: row.saturated_fat_100g ?? undefined,
    fiber100g: row.fiber_100g ?? undefined,
    salt100g: row.salt_100g ?? undefined,
    glycemicIndex: row.glycemic_index ?? undefined,
    nutriScore: row.nutri_score ?? undefined,
    isCustom: !!row.is_custom,
  };
}

export const ingredientsDbApi = {
  search: async (q: string) => {
    const db = await getDb();
    const rows = q.trim()
      ? await db.getAllAsync<any>(
          `SELECT * FROM ingredients
           WHERE LOWER(name) LIKE LOWER(?) AND (is_custom = 0 OR user_id = ?)
           ORDER BY name LIMIT 50`,
          [`%${q}%`, USER_ID]
        )
      : await db.getAllAsync<any>(
          `SELECT * FROM ingredients WHERE is_custom = 1 AND user_id = ? ORDER BY name LIMIT 50`,
          [USER_ID]
        );
    return { data: rows.map(rowToIngredient) };
  },

  getById: async (id: string) => {
    const db = await getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM ingredients WHERE id = ?', [id]);
    if (!row) throw new Error(`Ingrédient non trouvé : ${id}`);
    return { data: rowToIngredient(row) };
  },

  findByBarcode: async (ean: string) => {
    const db = await getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM ingredients WHERE barcode = ?', [ean]);
    if (!row) throw new Error(`Ingrédient non trouvé pour le code-barre : ${ean}`);
    return { data: rowToIngredient(row) };
  },

  create: async (ingredient: Partial<Ingredient>) => {
    const db = await getDb();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO ingredients (id, name, brand, barcode, category,
        calories_100g, proteins_100g, carbs_100g, sugars_100g, fat_100g,
        saturated_fat_100g, fiber_100g, salt_100g, glycemic_index, nutri_score,
        is_custom, source, user_id, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'MANUAL',?,?)`,
      [
        id, ingredient.name ?? '', ingredient.brand ?? null, ingredient.barcode ?? null,
        ingredient.category ?? null, ingredient.calories100g ?? 0,
        ingredient.proteins100g ?? null, ingredient.carbs100g ?? null,
        ingredient.sugars100g ?? null, ingredient.fat100g ?? null,
        ingredient.saturatedFat100g ?? null, ingredient.fiber100g ?? null,
        ingredient.salt100g ?? null, ingredient.glycemicIndex ?? null,
        ingredient.nutriScore ?? null, USER_ID, now(),
      ]
    );
    return ingredientsDbApi.getById(id);
  },

  update: async (id: string, ingredient: Partial<Ingredient>) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE ingredients SET name=?, brand=?, barcode=?, category=?,
        calories_100g=?, proteins_100g=?, carbs_100g=?, sugars_100g=?, fat_100g=?,
        saturated_fat_100g=?, fiber_100g=?, salt_100g=?, glycemic_index=?, nutri_score=?
       WHERE id=? AND user_id=?`,
      [
        ingredient.name ?? '', ingredient.brand ?? null, ingredient.barcode ?? null,
        ingredient.category ?? null, ingredient.calories100g ?? 0,
        ingredient.proteins100g ?? null, ingredient.carbs100g ?? null,
        ingredient.sugars100g ?? null, ingredient.fat100g ?? null,
        ingredient.saturatedFat100g ?? null, ingredient.fiber100g ?? null,
        ingredient.salt100g ?? null, ingredient.glycemicIndex ?? null,
        ingredient.nutriScore ?? null, id, USER_ID,
      ]
    );
    return ingredientsDbApi.getById(id);
  },

  delete: async (id: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM ingredients WHERE id = ? AND user_id = ?', [id, USER_ID]);
    return { data: null };
  },
};
