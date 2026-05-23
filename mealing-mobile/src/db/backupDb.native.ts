import { getDb, USER_ID, uuidv4, now } from './database';

export const backupDbApi = {
  exportData: async (): Promise<object> => {
    const db = await getDb();

    const profile = await db.getFirstAsync<any>(
      'SELECT * FROM user_profiles WHERE user_id = ?', [USER_ID]
    );
    const customIngredients = await db.getAllAsync<any>(
      "SELECT * FROM ingredients WHERE source = 'MANUAL' AND user_id = ?", [USER_ID]
    );
    const recipes = await db.getAllAsync<any>(
      'SELECT * FROM recipes WHERE user_id = ?', [USER_ID]
    );
    const recipeIngredients = await db.getAllAsync<any>(
      `SELECT ri.* FROM recipe_ingredients ri
       JOIN recipes r ON r.id = ri.recipe_id WHERE r.user_id = ?`, [USER_ID]
    );
    const preparedMeals = await db.getAllAsync<any>(
      'SELECT * FROM prepared_meals WHERE user_id = ?', [USER_ID]
    );
    const weekPlans = await db.getAllAsync<any>(
      'SELECT * FROM week_plans WHERE user_id = ?', [USER_ID]
    );
    const planIds = weekPlans.map((w: any) => w.id);
    const slots = planIds.length > 0
      ? await db.getAllAsync<any>(
          `SELECT * FROM meal_slots WHERE week_plan_id IN (${planIds.map(() => '?').join(',')})`,
          planIds
        )
      : [];
    const slotIds = slots.map((s: any) => s.id);
    const extras = slotIds.length > 0
      ? await db.getAllAsync<any>(
          `SELECT * FROM meal_extras WHERE meal_slot_id IN (${slotIds.map(() => '?').join(',')})`,
          slotIds
        )
      : [];
    const restaurantMeals = await db.getAllAsync<any>(
      'SELECT * FROM restaurant_meals WHERE user_id = ?', [USER_ID]
    );
    const deviations = await db.getAllAsync<any>(
      'SELECT * FROM deviations WHERE user_id = ?', [USER_ID]
    );

    return {
      version: '2.0',
      exportedAt: now(),
      profile,
      customIngredients,
      recipes: recipes.map((r: any) => ({
        ...r,
        ingredients: recipeIngredients.filter((ri: any) => ri.recipe_id === r.id),
      })),
      preparedMeals,
      weekPlans: weekPlans.map((wp: any) => ({
        ...wp,
        slots: slots.filter((s: any) => s.week_plan_id === wp.id),
      })),
      mealExtras: extras,
      restaurantMeals,
      deviations,
    };
  },

  importData: async (backup: any): Promise<void> => {
    const db = await getDb();

    // Clear existing user data
    const existingPlans = await db.getAllAsync<any>(
      'SELECT id FROM week_plans WHERE user_id = ?', [USER_ID]
    );
    if (existingPlans.length > 0) {
      const ids = existingPlans.map((p: any) => p.id);
      await db.runAsync(
        `DELETE FROM meal_slots WHERE week_plan_id IN (${ids.map(() => '?').join(',')})`, ids
      );
    }
    await db.runAsync('DELETE FROM week_plans WHERE user_id = ?', [USER_ID]);
    await db.runAsync('DELETE FROM deviations WHERE user_id = ?', [USER_ID]);
    await db.runAsync('DELETE FROM restaurant_meals WHERE user_id = ?', [USER_ID]);
    await db.runAsync('DELETE FROM prepared_meals WHERE user_id = ?', [USER_ID]);
    await db.runAsync(
      "DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = ?)", [USER_ID]
    );
    await db.runAsync('DELETE FROM recipes WHERE user_id = ?', [USER_ID]);
    await db.runAsync("DELETE FROM ingredients WHERE source = 'MANUAL' AND user_id = ?", [USER_ID]);

    // Restore profile
    if (backup.profile) {
      const p = backup.profile;
      await db.runAsync(
        `INSERT OR REPLACE INTO user_profiles (id, user_id, first_name, birth_date, gender,
          height_cm, weight_kg, activity_level, goal, target_calories, macro_protein_pct,
          macro_carbs_pct, macro_fat_pct, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p.id ?? uuidv4(), USER_ID, p.first_name ?? null, p.birth_date ?? null, p.gender ?? null,
         p.height_cm ?? null, p.weight_kg ?? null, p.activity_level ?? null, p.goal ?? null,
         p.target_calories ?? null, p.macro_protein_pct ?? 30, p.macro_carbs_pct ?? 45,
         p.macro_fat_pct ?? 25, now()]
      );
    }

    // Restore custom ingredients
    for (const ing of backup.customIngredients ?? []) {
      await db.runAsync(
        `INSERT OR IGNORE INTO ingredients (id, name, brand, barcode, category, calories_100g,
          proteins_100g, carbs_100g, sugars_100g, fat_100g, saturated_fat_100g, fiber_100g,
          salt_100g, glycemic_index, nutri_score, is_custom, source, user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'MANUAL',?,?)`,
        [ing.id ?? uuidv4(), ing.name, ing.brand ?? null, ing.barcode ?? null, ing.category ?? null,
         ing.calories_100g ?? 0, ing.proteins_100g ?? null, ing.carbs_100g ?? null, ing.sugars_100g ?? null,
         ing.fat_100g ?? null, ing.saturated_fat_100g ?? null, ing.fiber_100g ?? null,
         ing.salt_100g ?? null, ing.glycemic_index ?? null, ing.nutri_score ?? null, USER_ID, ing.created_at ?? now()]
      );
    }

    // Restore prepared meals
    for (const pm of backup.preparedMeals ?? []) {
      await db.runAsync(
        `INSERT OR IGNORE INTO prepared_meals (id, user_id, name, brand, barcode, nutri_score,
          calories_portion, proteins_g, carbs_g, fat_g, fiber_g, portion_label, off_id, is_favorite, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [pm.id ?? uuidv4(), USER_ID, pm.name, pm.brand ?? null, pm.barcode ?? null, pm.nutri_score ?? null,
         pm.calories_portion ?? 0, pm.proteins_g ?? null, pm.carbs_g ?? null, pm.fat_g ?? null,
         pm.fiber_g ?? null, pm.portion_label ?? null, pm.off_id ?? null, pm.is_favorite ?? 0, pm.created_at ?? now()]
      );
    }

    // Restore recipes
    for (const recipe of backup.recipes ?? []) {
      await db.runAsync(
        `INSERT OR IGNORE INTO recipes (id, user_id, name, description, servings, prep_time_min,
          cook_time_min, difficulty, is_healthy, photo_url, tags, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [recipe.id ?? uuidv4(), USER_ID, recipe.name, recipe.description ?? null,
         recipe.servings ?? 1, recipe.prep_time_min ?? null, recipe.cook_time_min ?? null,
         recipe.difficulty ?? null, recipe.is_healthy ?? null, recipe.photo_url ?? null,
         recipe.tags ?? null, recipe.created_at ?? now(), recipe.updated_at ?? now()]
      );
      for (const ri of recipe.ingredients ?? []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity_g, unit_label)
           VALUES (?,?,?,?,?)`,
          [ri.id ?? uuidv4(), recipe.id, ri.ingredient_id, ri.quantity_g, ri.unit_label ?? null]
        );
      }
    }

    // Restore week plans + slots
    for (const wp of backup.weekPlans ?? []) {
      await db.runAsync(
        'INSERT OR IGNORE INTO week_plans (id, user_id, week_start, notes) VALUES (?,?,?,?)',
        [wp.id ?? uuidv4(), USER_ID, wp.week_start, wp.notes ?? null]
      );
      for (const slot of wp.slots ?? []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO meal_slots (id, week_plan_id, slot_date, meal_type, recipe_id,
            prepared_meal_id, free_label, portions, is_deviation, calories_override,
            is_consumed, consumed_at, source_type)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [slot.id ?? uuidv4(), wp.id, slot.slot_date, slot.meal_type, slot.recipe_id ?? null,
           slot.prepared_meal_id ?? null, slot.free_label ?? null, slot.portions ?? 1,
           slot.is_deviation ?? 0, slot.calories_override ?? null, slot.is_consumed ?? 0,
           slot.consumed_at ?? null, slot.source_type ?? 'RECIPE']
        );
      }
    }

    // Restore meal extras
    for (const e of backup.mealExtras ?? []) {
      await db.runAsync(
        `INSERT OR IGNORE INTO meal_extras (id, meal_slot_id, label, extra_type, ingredient_id,
          quantity_g, prepared_meal_id, portions, calories_free, proteins_free, carbs_free, fat_free, added_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [e.id ?? uuidv4(), e.meal_slot_id, e.label, e.extra_type ?? 'OTHER',
         e.ingredient_id ?? null, e.quantity_g ?? null, e.prepared_meal_id ?? null, e.portions ?? null,
         e.calories_free ?? null, e.proteins_free ?? null, e.carbs_free ?? null, e.fat_free ?? null,
         e.added_at ?? now()]
      );
    }

    // Restore deviations
    for (const d of backup.deviations ?? []) {
      await db.runAsync(
        `INSERT OR IGNORE INTO deviations (id, user_id, deviation_date, type, label,
          calories_extra, compensation_spread, notes, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [d.id ?? uuidv4(), USER_ID, d.deviation_date, d.type, d.label ?? null,
         d.calories_extra ?? 0, d.compensation_spread ?? 2, d.notes ?? null, d.created_at ?? now()]
      );
    }
  },
};
