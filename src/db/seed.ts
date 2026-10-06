import { db, type Ingredient } from './schema';

const CIQUAL_SEED_KEY = 'ciqualSeededAt';
const CIQUAL_PORTIONS_KEY = 'ciqualPortionsSeededAt';

async function fetchCiqual(): Promise<Ingredient[] | null> {
  const res = await fetch('/seed/ciqual.json');
  return res.ok ? res.json() : null;
}

/** Charge le seed d'aliments génériques (public/seed/ciqual.json) au premier lancement uniquement. */
export async function ensureCiqualSeed(): Promise<void> {
  const alreadySeeded = await db.appMeta.get(CIQUAL_SEED_KEY);
  if (alreadySeeded) return;

  const ingredients = await fetchCiqual();
  if (!ingredients) return;

  const now = new Date().toISOString();
  await db.transaction('rw', db.ingredients, db.appMeta, async () => {
    await db.ingredients.bulkPut(ingredients);
    // Le fichier porte déjà les portions : rien à rattraper sur une installation neuve.
    await db.appMeta.bulkPut([
      { key: CIQUAL_SEED_KEY, value: now },
      { key: CIQUAL_PORTIONS_KEY, value: now },
    ]);
  });
}

/**
 * Apporte les portions estimées à une base chargée avant leur existence.
 * Ne touche qu'aux aliments Ciqual sans portion : une portion corrigée par l'utilisateur
 * existe déjà, et rejouer le chargement initial écraserait les aliments entiers.
 */
export async function ensureCiqualPortions(): Promise<void> {
  const alreadyDone = await db.appMeta.get(CIQUAL_PORTIONS_KEY);
  if (alreadyDone) return;

  const seed = await fetchCiqual();
  if (!seed) return;
  const seedById = new Map(seed.map((i) => [i.id!, i]));

  await db.transaction('rw', db.ingredients, db.appMeta, async () => {
    await db.ingredients.toCollection().modify((ingredient) => {
      const source = seedById.get(ingredient.id!);
      if (!source || ingredient.source !== 'CIQUAL' || ingredient.portionG !== undefined) return;
      ingredient.portionG = source.portionG;
      ingredient.portionLabel = source.portionLabel;
    });
    await db.appMeta.put({ key: CIQUAL_PORTIONS_KEY, value: new Date().toISOString() });
  });
}
