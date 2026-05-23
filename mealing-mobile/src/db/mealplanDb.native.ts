import { getDb, uuidv4, now, USER_ID } from './database';
import type { WeekPlan, MealSlot, MealType } from '../api/mealplan';
import { format, startOfWeek } from 'date-fns';

async function loadSlots(db: any, weekPlanId: string): Promise<MealSlot[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT ms.*,
       r.id as r_id, r.name as r_name, r.description as r_desc, r.servings as r_servings,
       r.prep_time_min as r_prep, r.cook_time_min as r_cook, r.difficulty as r_diff, r.is_healthy as r_healthy
     FROM meal_slots ms
     LEFT JOIN recipes r ON r.id = ms.recipe_id
     WHERE ms.week_plan_id = ?
     ORDER BY ms.slot_date, ms.meal_type`,
    [weekPlanId]
  );
  return rows.map((row: any) => ({
    id: row.id,
    slotDate: row.slot_date,
    mealType: row.meal_type as MealType,
    portions: row.portions ?? 1,
    isDeviation: !!row.is_deviation,
    caloriesOverride: row.calories_override ?? undefined,
    isConsumed: !!row.is_consumed,
    consumedAt: row.consumed_at ?? undefined,
    freeLabel: row.free_label ?? undefined,
    sourceType: row.source_type ?? 'RECIPE',
    preparedMealId: row.prepared_meal_id ?? undefined,
    recipe: row.r_id ? {
      id: row.r_id,
      name: row.r_name,
      description: row.r_desc ?? undefined,
      servings: row.r_servings ?? 1,
      prepTimeMin: row.r_prep ?? undefined,
      cookTimeMin: row.r_cook ?? undefined,
      difficulty: row.r_diff ?? undefined,
      isHealthy: row.r_healthy != null ? !!row.r_healthy : undefined,
      ingredients: [],
    } : undefined,
  }));
}

async function rowToWeekPlan(db: any, row: any): Promise<WeekPlan> {
  const slots = await loadSlots(db, row.id);
  return { id: row.id, weekStart: row.week_start, notes: row.notes ?? undefined, slots };
}

export const mealplanDbApi = {
  getWeek: async (week: string) => {
    const db = await getDb();
    let row = await db.getFirstAsync<any>(
      'SELECT * FROM week_plans WHERE user_id = ? AND week_start = ?',
      [USER_ID, week]
    );
    if (!row) {
      // Auto-create
      const id = uuidv4();
      await db.runAsync(
        'INSERT INTO week_plans (id, user_id, week_start) VALUES (?,?,?)',
        [id, USER_ID, week]
      );
      row = await db.getFirstAsync<any>('SELECT * FROM week_plans WHERE id = ?', [id]);
    }
    return { data: await rowToWeekPlan(db, row) };
  },

  create: async (weekStart: string) => {
    const db = await getDb();
    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM week_plans WHERE user_id = ? AND week_start = ?',
      [USER_ID, weekStart]
    );
    if (existing) return { data: await rowToWeekPlan(db, existing) };

    const id = uuidv4();
    await db.runAsync(
      'INSERT INTO week_plans (id, user_id, week_start) VALUES (?,?,?)',
      [id, USER_ID, weekStart]
    );
    const row = await db.getFirstAsync<any>('SELECT * FROM week_plans WHERE id = ?', [id]);
    return { data: await rowToWeekPlan(db, row!) };
  },

  addSlot: async (planId: string, slot: Partial<MealSlot> & { recipeId?: string }) => {
    const db = await getDb();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO meal_slots (id, week_plan_id, slot_date, meal_type, recipe_id,
        prepared_meal_id, free_label, portions, is_deviation, calories_override, source_type)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, planId,
        slot.slotDate ?? format(new Date(), 'yyyy-MM-dd'),
        slot.mealType ?? 'LUNCH',
        slot.recipeId ?? null,
        (slot as any).preparedMealId ?? null,
        slot.freeLabel ?? null,
        slot.portions ?? 1,
        slot.isDeviation ? 1 : 0,
        slot.caloriesOverride ?? null,
        (slot as any).sourceType ?? 'RECIPE',
      ]
    );
    const rows = await db.getAllAsync<any>('SELECT * FROM meal_slots WHERE id = ?', [id]);
    const slots = await Promise.all(rows.map((r: any) => loadSlotRow(db, r)));
    return { data: slots[0] };
  },

  updateSlot: async (slotId: string, slot: Partial<MealSlot> & { recipeId?: string }) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE meal_slots SET recipe_id=?, prepared_meal_id=?, free_label=?, portions=?,
        is_deviation=?, calories_override=?, source_type=?
       WHERE id=?`,
      [
        slot.recipeId ?? null,
        (slot as any).preparedMealId ?? null,
        slot.freeLabel ?? null,
        slot.portions ?? 1,
        slot.isDeviation ? 1 : 0,
        slot.caloriesOverride ?? null,
        (slot as any).sourceType ?? 'RECIPE',
        slotId,
      ]
    );
    const row = await db.getFirstAsync<any>('SELECT * FROM meal_slots WHERE id = ?', [slotId]);
    return { data: await loadSlotRow(db, row!) };
  },

  deleteSlot: async (slotId: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM meal_slots WHERE id = ?', [slotId]);
    return { data: null };
  },

  markConsumed: async (slotId: string) => {
    const db = await getDb();
    const ts = now();
    await db.runAsync(
      'UPDATE meal_slots SET is_consumed = 1, consumed_at = ? WHERE id = ?',
      [ts, slotId]
    );
    const row = await db.getFirstAsync<any>('SELECT * FROM meal_slots WHERE id = ?', [slotId]);
    return { data: await loadSlotRow(db, row!) };
  },

  copyWeek: async (planId: string, targetWeekStart: string) => {
    const db = await getDb();
    const { data: source } = await mealplanDbApi.getWeek(
      (await db.getFirstAsync<any>('SELECT week_start FROM week_plans WHERE id = ?', [planId]))?.week_start ?? ''
    );
    const { data: target } = await mealplanDbApi.create(targetWeekStart);

    // Offset dates
    const srcDate = new Date(source.weekStart);
    const tgtDate = new Date(targetWeekStart);
    const diffMs = tgtDate.getTime() - srcDate.getTime();

    for (const slot of source.slots) {
      const newDate = new Date(new Date(slot.slotDate).getTime() + diffMs);
      await mealplanDbApi.addSlot(target.id, {
        ...slot,
        slotDate: format(newDate, 'yyyy-MM-dd'),
        recipeId: slot.recipe?.id,
        isConsumed: false,
      } as any);
    }
    return mealplanDbApi.getWeek(targetWeekStart);
  },
};

async function loadSlotRow(db: any, row: any): Promise<MealSlot> {
  let recipe = undefined;
  if (row.recipe_id) {
    const r = await db.getFirstAsync<any>('SELECT * FROM recipes WHERE id = ?', [row.recipe_id]);
    if (r) recipe = { id: r.id, name: r.name, servings: r.servings ?? 1, ingredients: [],
      description: r.description ?? undefined, difficulty: r.difficulty ?? undefined,
      isHealthy: r.is_healthy != null ? !!r.is_healthy : undefined };
  }
  return {
    id: row.id, slotDate: row.slot_date, mealType: row.meal_type as MealType,
    portions: row.portions ?? 1, isDeviation: !!row.is_deviation,
    caloriesOverride: row.calories_override ?? undefined,
    isConsumed: !!row.is_consumed, consumedAt: row.consumed_at ?? undefined,
    freeLabel: row.free_label ?? undefined, sourceType: row.source_type ?? 'RECIPE',
    preparedMealId: row.prepared_meal_id ?? undefined, recipe,
  };
}
