import { getDb, uuidv4, now, USER_ID } from './database';
import type { ShoppingList, ShoppingItem } from '../api/shopping';

function rowToList(row: any, items: any[]): ShoppingList {
  return {
    id: row.id, name: row.name, weekPlanId: row.week_plan_id ?? undefined,
    items: items.map(rowToItem),
  };
}

function rowToItem(row: any): ShoppingItem {
  return {
    id: row.id, label: row.label, quantityG: row.quantity_g ?? undefined,
    unitLabel: row.unit_label ?? undefined, category: row.category ?? undefined,
    isChecked: !!row.is_checked, isManual: !!row.is_manual,
  };
}

export const shoppingDbApi = {
  generateForWeek: async (weekPlanId: string) => {
    const db = await getDb();

    // Check if list already exists for this week
    let list = await db.getFirstAsync<any>(
      'SELECT * FROM shopping_lists WHERE week_plan_id = ? AND user_id = ?',
      [weekPlanId, USER_ID]
    );

    if (!list) {
      const listId = uuidv4();
      await db.runAsync(
        'INSERT INTO shopping_lists (id, user_id, name, week_plan_id, created_at) VALUES (?,?,?,?,?)',
        [listId, USER_ID, 'Liste de courses', weekPlanId, now()]
      );

      // Aggregate ingredients from recipe slots
      const slots = await db.getAllAsync<any>(
        'SELECT * FROM meal_slots WHERE week_plan_id = ? AND recipe_id IS NOT NULL',
        [weekPlanId]
      );

      // Sum ingredients grouped by ingredient_id
      const totals: Record<string, { label: string; quantityG: number; category: string | null }> = {};
      for (const slot of slots) {
        const ris = await db.getAllAsync<any>(
          `SELECT ri.quantity_g, ri.unit_label, i.name, i.category
           FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id
           WHERE ri.recipe_id = ?`,
          [slot.recipe_id]
        );
        const portions = slot.portions ?? 1;
        const servings = (await db.getFirstAsync<any>('SELECT servings FROM recipes WHERE id = ?', [slot.recipe_id]))?.servings ?? 1;
        for (const ri of ris) {
          const key = ri.name.toLowerCase();
          if (!totals[key]) totals[key] = { label: ri.name, quantityG: 0, category: ri.category };
          totals[key].quantityG += (ri.quantity_g / servings) * portions;
        }
      }

      for (const { label, quantityG, category } of Object.values(totals)) {
        await db.runAsync(
          `INSERT INTO shopping_items (id, list_id, label, quantity_g, category, is_checked, is_manual)
           VALUES (?,?,?,?,?,0,0)`,
          [uuidv4(), listId, label, Math.round(quantityG), category]
        );
      }

      list = await db.getFirstAsync<any>('SELECT * FROM shopping_lists WHERE id = ?', [listId]);
    }

    const items = await db.getAllAsync<any>(
      'SELECT * FROM shopping_items WHERE list_id = ? ORDER BY category, label',
      [list.id]
    );
    return { data: rowToList(list, items) };
  },

  addItem: async (listId: string, item: Partial<ShoppingItem>) => {
    const db = await getDb();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO shopping_items (id, list_id, label, quantity_g, unit_label, category, is_checked, is_manual)
       VALUES (?,?,?,?,?,?,0,1)`,
      [id, listId, item.label ?? '', item.quantityG ?? null, item.unitLabel ?? null, item.category ?? null]
    );
    const row = await db.getFirstAsync<any>('SELECT * FROM shopping_items WHERE id = ?', [id]);
    return { data: rowToItem(row!) };
  },

  toggleCheck: async (itemId: string) => {
    const db = await getDb();
    await db.runAsync(
      'UPDATE shopping_items SET is_checked = CASE WHEN is_checked = 1 THEN 0 ELSE 1 END WHERE id = ?',
      [itemId]
    );
    const row = await db.getFirstAsync<any>('SELECT * FROM shopping_items WHERE id = ?', [itemId]);
    return { data: rowToItem(row!) };
  },

  deleteItem: async (itemId: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM shopping_items WHERE id = ?', [itemId]);
    return { data: null };
  },

  exportText: async (listId: string) => {
    const db = await getDb();
    const items = await db.getAllAsync<any>(
      'SELECT * FROM shopping_items WHERE list_id = ? ORDER BY category, label',
      [listId]
    );
    const text = items
      .map((i: any) => `${i.is_checked ? '✓' : '○'} ${i.label}${i.quantity_g ? ` (${i.quantity_g}g)` : ''}`)
      .join('\n');
    return { data: text };
  },
};
