import { getDb, uuidv4, now, USER_ID } from './database';
import type { PreparedMeal } from '../api/preparedMeals';

function rowToPm(row: any): PreparedMeal {
  return {
    id: row.id, userId: row.user_id, name: row.name,
    brand: row.brand ?? undefined, photoUrl: row.photo_url ?? undefined,
    barcode: row.barcode ?? undefined, nutriScore: row.nutri_score ?? undefined,
    caloriesPortion: row.calories_portion ?? 0,
    proteinsG: row.proteins_g ?? undefined, carbsG: row.carbs_g ?? undefined,
    fatG: row.fat_g ?? undefined, fiberG: row.fiber_g ?? undefined,
    portionLabel: row.portion_label ?? undefined, offId: row.off_id ?? undefined,
    isFavorite: !!row.is_favorite, createdAt: row.created_at ?? undefined,
  };
}

export const preparedMealsDbApi = {
  getAll: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM prepared_meals WHERE user_id = ? ORDER BY created_at DESC',
      [USER_ID]
    );
    return { data: rows.map(rowToPm) };
  },

  getFavorites: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM prepared_meals WHERE user_id = ? AND is_favorite = 1 ORDER BY name',
      [USER_ID]
    );
    return { data: rows.map(rowToPm) };
  },

  getById: async (id: string) => {
    const db = await getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM prepared_meals WHERE id = ?', [id]);
    if (!row) throw new Error(`Plat préparé non trouvé : ${id}`);
    return { data: rowToPm(row) };
  },

  create: async (meal: Partial<PreparedMeal>) => {
    const db = await getDb();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO prepared_meals (id, user_id, name, brand, barcode, nutri_score,
        calories_portion, proteins_g, carbs_g, fat_g, fiber_g, portion_label,
        is_favorite, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?)`,
      [id, USER_ID, meal.name ?? '', meal.brand ?? null, meal.barcode ?? null,
       meal.nutriScore ?? null, meal.caloriesPortion ?? 0, meal.proteinsG ?? null,
       meal.carbsG ?? null, meal.fatG ?? null, meal.fiberG ?? null,
       meal.portionLabel ?? null, now()]
    );
    return preparedMealsDbApi.getById(id);
  },

  update: async (id: string, meal: Partial<PreparedMeal>) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE prepared_meals SET name=?, brand=?, barcode=?, nutri_score=?,
        calories_portion=?, proteins_g=?, carbs_g=?, fat_g=?, fiber_g=?, portion_label=?
       WHERE id=? AND user_id=?`,
      [meal.name ?? '', meal.brand ?? null, meal.barcode ?? null, meal.nutriScore ?? null,
       meal.caloriesPortion ?? 0, meal.proteinsG ?? null, meal.carbsG ?? null,
       meal.fatG ?? null, meal.fiberG ?? null, meal.portionLabel ?? null, id, USER_ID]
    );
    return preparedMealsDbApi.getById(id);
  },

  toggleFavorite: async (id: string) => {
    const db = await getDb();
    await db.runAsync(
      'UPDATE prepared_meals SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?',
      [id]
    );
    return preparedMealsDbApi.getById(id);
  },

  delete: async (id: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM prepared_meals WHERE id = ? AND user_id = ?', [id, USER_ID]);
    return { data: null };
  },
};
