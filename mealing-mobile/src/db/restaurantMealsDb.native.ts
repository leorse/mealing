import { getDb, uuidv4, now, USER_ID } from './database';
import type { RestaurantMeal } from '../api/restaurantMeals';

function rowToMeal(row: any, ingredients: any[] = []): RestaurantMeal {
  return {
    id: row.id, userId: row.user_id,
    restaurantName: row.restaurant_name ?? undefined, restaurantType: row.restaurant_type ?? undefined,
    dishName: row.dish_name, dishNotes: row.dish_notes ?? undefined,
    estimationMethod: (row.estimation_method ?? 'FREE') as RestaurantMeal['estimationMethod'],
    caloriesFree: row.calories_free ?? undefined, proteinsFree: row.proteins_free ?? undefined,
    carbsFree: row.carbs_free ?? undefined, fatFree: row.fat_free ?? undefined,
    portionSize: (row.portion_size ?? 'NORMAL') as RestaurantMeal['portionSize'],
    totalCalories: row.total_calories ?? undefined, totalProteins: row.total_proteins ?? undefined,
    totalCarbs: row.total_carbs ?? undefined, totalFat: row.total_fat ?? undefined,
    isDeviation: !!row.is_deviation, originalSlotId: row.original_slot_id ?? undefined,
    createdAt: row.created_at ?? undefined,
    ingredients: ingredients.map((i: any) => ({
      id: i.id, quantityG: i.quantity_g, unitLabel: i.unit_label ?? undefined,
      isEstimated: !!i.is_estimated,
      ingredient: { id: i.ingredient_id, name: i.ing_name ?? '', calories100g: i.calories_100g ?? 0 },
    })),
  };
}

export const restaurantMealsDbApi = {
  getAll: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM restaurant_meals WHERE user_id = ? ORDER BY created_at DESC', [USER_ID]
    );
    const meals = await Promise.all(rows.map(async (r: any) => {
      const ings = await db.getAllAsync<any>(
        `SELECT rmi.*, i.name as ing_name, i.calories_100g FROM restaurant_meal_ingredients rmi
         LEFT JOIN ingredients i ON i.id = rmi.ingredient_id WHERE rmi.restaurant_meal_id = ?`,
        [r.id]
      );
      return rowToMeal(r, ings);
    }));
    return { data: meals };
  },

  getById: async (id: string) => {
    const db = await getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM restaurant_meals WHERE id = ?', [id]);
    if (!row) throw new Error(`Repas restaurant non trouvé : ${id}`);
    const ings = await db.getAllAsync<any>(
      `SELECT rmi.*, i.name as ing_name, i.calories_100g FROM restaurant_meal_ingredients rmi
       LEFT JOIN ingredients i ON i.id = rmi.ingredient_id WHERE rmi.restaurant_meal_id = ?`,
      [id]
    );
    return { data: rowToMeal(row, ings) };
  },

  create: async (meal: Partial<RestaurantMeal>) => {
    const db = await getDb();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO restaurant_meals (id, user_id, restaurant_name, restaurant_type, dish_name,
        dish_notes, estimation_method, calories_free, proteins_free, carbs_free, fat_free,
        portion_size, total_calories, total_proteins, total_carbs, total_fat,
        is_deviation, original_slot_id, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, USER_ID, meal.restaurantName ?? null, meal.restaurantType ?? null,
       meal.dishName ?? '', meal.dishNotes ?? null, meal.estimationMethod ?? 'FREE',
       meal.caloriesFree ?? null, meal.proteinsFree ?? null, meal.carbsFree ?? null, meal.fatFree ?? null,
       meal.portionSize ?? 'NORMAL', meal.totalCalories ?? null, meal.totalProteins ?? null,
       meal.totalCarbs ?? null, meal.totalFat ?? null,
       meal.isDeviation ? 1 : 0, meal.originalSlotId ?? null, now()]
    );
    return restaurantMealsDbApi.getById(id);
  },

  update: async (id: string, meal: Partial<RestaurantMeal>) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE restaurant_meals SET restaurant_name=?, restaurant_type=?, dish_name=?, dish_notes=?,
        estimation_method=?, calories_free=?, proteins_free=?, carbs_free=?, fat_free=?,
        total_calories=?, total_proteins=?, total_carbs=?, total_fat=?
       WHERE id=? AND user_id=?`,
      [meal.restaurantName ?? null, meal.restaurantType ?? null, meal.dishName ?? '',
       meal.dishNotes ?? null, meal.estimationMethod ?? 'FREE',
       meal.caloriesFree ?? null, meal.proteinsFree ?? null, meal.carbsFree ?? null, meal.fatFree ?? null,
       meal.totalCalories ?? null, meal.totalProteins ?? null, meal.totalCarbs ?? null, meal.totalFat ?? null,
       id, USER_ID]
    );
    return restaurantMealsDbApi.getById(id);
  },

  delete: async (id: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM restaurant_meals WHERE id = ? AND user_id = ?', [id, USER_ID]);
    return { data: null };
  },
};
