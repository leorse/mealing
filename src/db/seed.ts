import { db, type Ingredient } from './schema';

const CIQUAL_SEED_KEY = 'ciqualSeededAt';

/** Charge le seed d'aliments génériques (public/seed/ciqual.json) au premier lancement uniquement. */
export async function ensureCiqualSeed(): Promise<void> {
  const alreadySeeded = await db.appMeta.get(CIQUAL_SEED_KEY);
  if (alreadySeeded) return;

  const res = await fetch('/seed/ciqual.json');
  if (!res.ok) return;
  const ingredients: Ingredient[] = await res.json();

  await db.transaction('rw', db.ingredients, db.appMeta, async () => {
    await db.ingredients.bulkPut(ingredients);
    await db.appMeta.put({ key: CIQUAL_SEED_KEY, value: new Date().toISOString() });
  });
}
