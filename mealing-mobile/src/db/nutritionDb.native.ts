import { getDb, uuidv4, now, USER_ID } from './database';
import type { DailyLog, Deviation } from '../api/nutrition';

// Calcule les calories d'un slot depuis la DB
async function computeSlotCalories(db: any, slot: any): Promise<{ cal: number; prot: number; carbs: number; fat: number; fiber: number }> {
  const zero = { cal: 0, prot: 0, carbs: 0, fat: 0, fiber: 0 };

  if (slot.source_type === 'FREE' || (!slot.recipe_id && !slot.prepared_meal_id)) {
    return { ...zero, cal: slot.calories_override ?? 0 };
  }

  if (slot.prepared_meal_id) {
    const pm = await db.getFirstAsync<any>('SELECT * FROM prepared_meals WHERE id = ?', [slot.prepared_meal_id]);
    if (!pm) return zero;
    const portions = slot.prepared_meal_portions ?? 1;
    return {
      cal: (pm.calories_portion ?? 0) * portions,
      prot: (pm.proteins_g ?? 0) * portions,
      carbs: (pm.carbs_g ?? 0) * portions,
      fat: (pm.fat_g ?? 0) * portions,
      fiber: (pm.fiber_g ?? 0) * portions,
    };
  }

  if (slot.recipe_id) {
    const recipe = await db.getFirstAsync<any>('SELECT * FROM recipes WHERE id = ?', [slot.recipe_id]);
    if (!recipe) return zero;
    const ris = await db.getAllAsync<any>(
      `SELECT ri.quantity_g, i.calories_100g, i.proteins_100g, i.carbs_100g, i.fat_100g, i.fiber_100g
       FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id
       WHERE ri.recipe_id = ?`,
      [slot.recipe_id]
    );
    const servings = recipe.servings || 1;
    const portions = slot.portions ?? 1;
    let cal = 0, prot = 0, carbs = 0, fat = 0, fiber = 0;
    for (const ri of ris) {
      const f = ri.quantity_g / 100;
      cal += (ri.calories_100g ?? 0) * f;
      prot += (ri.proteins_100g ?? 0) * f;
      carbs += (ri.carbs_100g ?? 0) * f;
      fat += (ri.fat_100g ?? 0) * f;
      fiber += (ri.fiber_100g ?? 0) * f;
    }
    return {
      cal: (cal / servings) * portions,
      prot: (prot / servings) * portions,
      carbs: (carbs / servings) * portions,
      fat: (fat / servings) * portions,
      fiber: (fiber / servings) * portions,
    };
  }

  return zero;
}

async function computeDayNutrition(db: any, date: string) {
  // Get all slots for this date
  const slots = await db.getAllAsync<any>(
    `SELECT ms.* FROM meal_slots ms
     JOIN week_plans wp ON wp.id = ms.week_plan_id
     WHERE wp.user_id = ? AND ms.slot_date = ?`,
    [USER_ID, date]
  );

  let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
  for (const slot of slots) {
    const n = await computeSlotCalories(db, slot);
    totalCal += n.cal;
    totalProt += n.prot;
    totalCarbs += n.carbs;
    totalFat += n.fat;
    totalFiber += n.fiber;
  }

  // Also add meal extras
  const slotIds = slots.map((s: any) => s.id);
  if (slotIds.length > 0) {
    const placeholders = slotIds.map(() => '?').join(',');
    const extras = await db.getAllAsync<any>(
      `SELECT * FROM meal_extras WHERE meal_slot_id IN (${placeholders})`,
      slotIds
    );
    for (const e of extras) {
      if (e.calories_free) totalCal += e.calories_free;
      if (e.proteins_free) totalProt += e.proteins_free;
      if (e.carbs_free) totalCarbs += e.carbs_free;
      if (e.fat_free) totalFat += e.fat_free;
      if (e.ingredient_id && e.quantity_g) {
        const ing = await db.getFirstAsync<any>('SELECT * FROM ingredients WHERE id = ?', [e.ingredient_id]);
        if (ing) {
          const f = e.quantity_g / 100;
          totalCal += (ing.calories_100g ?? 0) * f;
          totalProt += (ing.proteins_100g ?? 0) * f;
          totalCarbs += (ing.carbs_100g ?? 0) * f;
          totalFat += (ing.fat_100g ?? 0) * f;
        }
      }
    }
  }

  return { totalCal, totalProt, totalCarbs, totalFat, totalFiber };
}

export const nutritionDbApi = {
  getDailyLog: async (date: string) => {
    const db = await getDb();
    const log = await db.getFirstAsync<any>(
      'SELECT * FROM daily_logs WHERE user_id = ? AND log_date = ?',
      [USER_ID, date]
    );
    const nutrition = await computeDayNutrition(db, date);
    const round = (v: number) => Math.round(v);
    return {
      data: {
        id: log?.id,
        logDate: date,
        totalCalories: round(nutrition.totalCal),
        totalProteins: round(nutrition.totalProt),
        totalCarbs: round(nutrition.totalCarbs),
        totalFat: round(nutrition.totalFat),
        totalFiber: round(nutrition.totalFiber),
        weightKg: log?.weight_kg ?? undefined,
        notes: log?.notes ?? undefined,
      } as DailyLog,
    };
  },

  updateDailyLog: async (date: string, log: Partial<DailyLog>) => {
    const db = await getDb();
    const existing = await db.getFirstAsync<any>(
      'SELECT * FROM daily_logs WHERE user_id = ? AND log_date = ?',
      [USER_ID, date]
    );
    if (existing) {
      await db.runAsync(
        'UPDATE daily_logs SET weight_kg = ?, notes = ? WHERE id = ?',
        [log.weightKg ?? null, log.notes ?? null, existing.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO daily_logs (id, user_id, log_date, weight_kg, notes) VALUES (?,?,?,?,?)',
        [uuidv4(), USER_ID, date, log.weightKg ?? null, log.notes ?? null]
      );
    }
    return nutritionDbApi.getDailyLog(date);
  },

  getStats: async (from: string, to: string) => {
    const db = await getDb();
    const results: DailyLog[] = [];
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const { data } = await nutritionDbApi.getDailyLog(dateStr);
      results.push(data);
    }
    return { data: results };
  },

  addDeviation: async (deviation: Omit<Deviation, 'id'>) => {
    const db = await getDb();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO deviations (id, user_id, deviation_date, meal_slot_id, type, label,
        calories_extra, compensation_spread, notes, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, USER_ID, deviation.deviationDate, null, deviation.type,
       deviation.label ?? null, deviation.caloriesExtra,
       deviation.compensationSpread ?? 2, deviation.notes ?? null, now()]
    );
    const row = await db.getFirstAsync<any>('SELECT * FROM deviations WHERE id = ?', [id]);
    return { data: rowToDeviation(row!) };
  },

  getDeviations: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM deviations WHERE user_id = ? ORDER BY deviation_date DESC',
      [USER_ID]
    );
    return { data: rows.map(rowToDeviation) };
  },

  getCompensation: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM deviations WHERE user_id = ? AND deviation_date >= date('now', '-30 days')`,
      [USER_ID]
    );
    const totalSurplusKcal = rows.reduce((s: number, r: any) => s + (r.calories_extra ?? 0), 0);
    return { data: { totalSurplusKcal, adjustments: [] } };
  },

  getWeeklyAnalytics: async (week: string) => {
    const end = new Date(week);
    end.setDate(end.getDate() + 6);
    return nutritionDbApi.getStats(week, end.toISOString().slice(0, 10));
  },

  getMonthlyAnalytics: async (month: string) => {
    const start = month + '-01';
    const d = new Date(start);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return nutritionDbApi.getStats(start, d.toISOString().slice(0, 10));
  },

  getTrends: async (period = 30) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - period);
    return nutritionDbApi.getStats(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  },
};

function rowToDeviation(row: any): Deviation {
  return {
    id: row.id,
    deviationDate: row.deviation_date,
    type: row.type as 'PLANNED' | 'UNPLANNED',
    label: row.label ?? undefined,
    caloriesExtra: row.calories_extra ?? 0,
    compensationSpread: row.compensation_spread ?? 2,
    notes: row.notes ?? undefined,
  };
}
