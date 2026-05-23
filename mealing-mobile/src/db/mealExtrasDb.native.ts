import { getDb, uuidv4, now } from './database';
import type { MealExtra, NutritionTotal } from '../api/mealExtras';

function rowToExtra(row: any): MealExtra {
  return {
    id: row.id, mealSlotId: row.meal_slot_id, label: row.label,
    extraType: row.extra_type as MealExtra['extraType'],
    ingredientId: row.ingredient_id ?? undefined, quantityG: row.quantity_g ?? undefined,
    preparedMealId: row.prepared_meal_id ?? undefined, portions: row.portions ?? undefined,
    caloriesFree: row.calories_free ?? undefined, proteinsFree: row.proteins_free ?? undefined,
    carbsFree: row.carbs_free ?? undefined, fatFree: row.fat_free ?? undefined,
    addedAt: row.added_at ?? undefined,
  };
}

export const mealExtrasDbApi = {
  getExtras: async (slotId: string) => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM meal_extras WHERE meal_slot_id = ? ORDER BY added_at',
      [slotId]
    );
    return { data: rows.map(rowToExtra) };
  },

  addExtra: async (slotId: string, extra: Partial<MealExtra>) => {
    const db = await getDb();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO meal_extras (id, meal_slot_id, label, extra_type, ingredient_id, quantity_g,
        prepared_meal_id, portions, calories_free, proteins_free, carbs_free, fat_free, added_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, slotId, extra.label ?? '', extra.extraType ?? 'OTHER',
       extra.ingredientId ?? null, extra.quantityG ?? null,
       extra.preparedMealId ?? null, extra.portions ?? null,
       extra.caloriesFree ?? null, extra.proteinsFree ?? null,
       extra.carbsFree ?? null, extra.fatFree ?? null, now()]
    );
    const row = await db.getFirstAsync<any>('SELECT * FROM meal_extras WHERE id = ?', [id]);
    return { data: rowToExtra(row!) };
  },

  updateExtra: async (slotId: string, extraId: string, extra: Partial<MealExtra>) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE meal_extras SET label=?, extra_type=?, ingredient_id=?, quantity_g=?,
        prepared_meal_id=?, portions=?, calories_free=?, proteins_free=?, carbs_free=?, fat_free=?
       WHERE id=? AND meal_slot_id=?`,
      [extra.label ?? '', extra.extraType ?? 'OTHER',
       extra.ingredientId ?? null, extra.quantityG ?? null,
       extra.preparedMealId ?? null, extra.portions ?? null,
       extra.caloriesFree ?? null, extra.proteinsFree ?? null,
       extra.carbsFree ?? null, extra.fatFree ?? null, extraId, slotId]
    );
    const row = await db.getFirstAsync<any>('SELECT * FROM meal_extras WHERE id = ?', [extraId]);
    return { data: rowToExtra(row!) };
  },

  deleteExtra: async (slotId: string, extraId: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM meal_extras WHERE id = ? AND meal_slot_id = ?', [extraId, slotId]);
    return { data: null };
  },

  getNutritionTotal: async (slotId: string) => {
    const db = await getDb();
    const extras = await db.getAllAsync<any>(
      'SELECT * FROM meal_extras WHERE meal_slot_id = ?', [slotId]
    );
    let calories = 0, proteins = 0, carbs = 0, fat = 0;
    for (const e of extras) {
      calories += e.calories_free ?? 0;
      proteins += e.proteins_free ?? 0;
      carbs += e.carbs_free ?? 0;
      fat += e.fat_free ?? 0;
      if (e.ingredient_id && e.quantity_g) {
        const ing = await db.getFirstAsync<any>('SELECT * FROM ingredients WHERE id = ?', [e.ingredient_id]);
        if (ing) {
          const f = e.quantity_g / 100;
          calories += (ing.calories_100g ?? 0) * f;
          proteins += (ing.proteins_100g ?? 0) * f;
          carbs += (ing.carbs_100g ?? 0) * f;
          fat += (ing.fat_100g ?? 0) * f;
        }
      }
    }
    return { data: { calories: Math.round(calories), proteins: Math.round(proteins), carbs: Math.round(carbs), fat: Math.round(fat), extrasCount: extras.length } as NutritionTotal };
  },
};
