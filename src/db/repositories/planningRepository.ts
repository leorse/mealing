import { db, type WeekPlan, type MealSlot, type ShoppingItemState } from '../schema';

/** Lecture seule — n'écrit jamais, safe à utiliser dans une useLiveQuery. */
export async function getWeek(weekStart: string): Promise<WeekPlan | undefined> {
  return db.weekPlans.where('weekStart').equals(weekStart).first();
}

/** Crée la semaine si elle n'existe pas encore — réservé aux opérations d'écriture. */
export async function ensureWeek(weekStart: string): Promise<WeekPlan> {
  const existing = await getWeek(weekStart);
  if (existing) return existing;

  const weekPlan: WeekPlan = { id: crypto.randomUUID(), weekStart };
  await db.weekPlans.add(weekPlan);
  return weekPlan;
}

export async function listSlotsForWeek(weekPlanId: string): Promise<MealSlot[]> {
  return db.mealSlots.where('weekPlanId').equals(weekPlanId).toArray();
}

export async function addSlot(
  weekPlanId: string,
  data: Omit<MealSlot, 'id' | 'weekPlanId' | 'isConsumed' | 'consumedAt'>,
): Promise<MealSlot> {
  const slot: MealSlot = {
    ...data,
    id: crypto.randomUUID(),
    weekPlanId,
    isConsumed: false,
  };
  await db.mealSlots.add(slot);
  return slot;
}

export async function addSlotForWeek(
  weekStart: string,
  data: Omit<MealSlot, 'id' | 'weekPlanId' | 'isConsumed' | 'consumedAt'>,
): Promise<MealSlot> {
  const weekPlan = await ensureWeek(weekStart);
  return addSlot(weekPlan.id!, data);
}

export async function updateSlot(slotId: string, data: Partial<MealSlot>): Promise<void> {
  await db.mealSlots.update(slotId, data);
}

export async function deleteSlot(slotId: string): Promise<void> {
  await db.mealSlots.delete(slotId);
}

export async function markConsumed(slotId: string, isConsumed: boolean): Promise<void> {
  await db.mealSlots.update(slotId, {
    isConsumed,
    consumedAt: isConsumed ? new Date().toISOString() : undefined,
  });
}

/** Créneaux marqués pour les courses, toutes dates confondues. Lecture seule. */
export async function listShoppingSlots(): Promise<MealSlot[]> {
  return db.mealSlots.filter((s) => s.includeInShopping === true && s.recipeId !== undefined).toArray();
}

/** Bascule de la pastille. Dans les deux sens, l'état des articles repart de zéro :
 *  rallumer une pastille est le seul chemin de retour d'un article supprimé. */
export async function setSlotShopping(slotId: string, include: boolean): Promise<void> {
  await db.mealSlots.update(slotId, { includeInShopping: include, shoppingItemStates: undefined });
}

export interface ShoppingItemChange {
  slotId: string;
  itemIds: string[];
  /** La suppression emporte les derniers articles du plat : le créneau quitte la liste. */
  unmark?: boolean;
}

/** Pose un état sur des articles de plusieurs créneaux ; 'ON' les rend actifs.
 *  En transaction : un double clic ne doit pas écraser le changement précédent. */
export async function setShoppingItemStates(
  changes: ShoppingItemChange[],
  state: ShoppingItemState | 'ON',
): Promise<void> {
  await db.transaction('rw', db.mealSlots, async () => {
    for (const change of changes) {
      if (change.unmark) {
        await db.mealSlots.update(change.slotId, { includeInShopping: false, shoppingItemStates: undefined });
        continue;
      }
      const slot = await db.mealSlots.get(change.slotId);
      if (!slot) continue;
      const states = { ...slot.shoppingItemStates };
      for (const itemId of change.itemIds) {
        if (state === 'ON') delete states[itemId];
        else states[itemId] = state;
      }
      await db.mealSlots.update(change.slotId, { shoppingItemStates: states });
    }
  });
}

/** Vide la liste de courses. Les repas restent au planning, pastilles éteintes. */
export async function clearShoppingList(): Promise<void> {
  await db.mealSlots
    .filter((s) => s.includeInShopping === true)
    .modify({ includeInShopping: false, shoppingItemStates: undefined });
}

export async function copyWeek(fromWeekStart: string, toWeekStart: string): Promise<void> {
  const fromWeek = await getWeek(fromWeekStart);
  if (!fromWeek) return;

  const toWeek = await ensureWeek(toWeekStart);
  const fromDate = new Date(fromWeekStart);
  const toDate = new Date(toWeekStart);
  const dayOffsetMs = toDate.getTime() - fromDate.getTime();

  const slots = await listSlotsForWeek(fromWeek.id!);
  for (const slot of slots) {
    const newDate = new Date(new Date(slot.slotDate).getTime() + dayOffsetMs).toISOString().slice(0, 10);
    await addSlot(toWeek.id!, {
      slotDate: newDate,
      mealType: slot.mealType,
      recipeId: slot.recipeId,
      freeLabel: slot.freeLabel,
      portions: slot.portions,
      isDeviation: slot.isDeviation,
      caloriesOverride: slot.caloriesOverride,
    });
  }
}
