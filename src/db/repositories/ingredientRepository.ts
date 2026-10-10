import { db, type Ingredient } from '../schema';
import { fetchCiqual } from '../seed';
import { rankIngredients } from '../../services/ingredientSearch';

const SEARCH_LIMIT = 50;
const CIQUAL_INDEX_VERSION_KEY = 'ciqualIndexVersion';

/** Classe tous les aliments correspondants avant de couper : le meilleur résultat n'est jamais écarté. */
export async function search(query: string): Promise<Ingredient[]> {
  if (!query.trim()) return db.ingredients.orderBy('name').limit(SEARCH_LIMIT).toArray();
  return rankIngredients(await db.ingredients.toArray(), query).slice(0, SEARCH_LIMIT);
}

export async function getByBarcode(ean: string): Promise<Ingredient | undefined> {
  return db.ingredients.where('barcode').equals(ean).first();
}

export async function getById(id: string): Promise<Ingredient | undefined> {
  return db.ingredients.get(id);
}

export async function getByIds(ids: string[]): Promise<Ingredient[]> {
  return (await db.ingredients.bulkGet(ids)).filter((i): i is Ingredient => i !== undefined);
}

/**
 * Met la base de l'appareil au niveau des vecteurs de recherche livrés : ajoute les aliments Ciqual
 * qui lui manquent. Jamais de remplacement, qui écraserait une portion corrigée par l'utilisateur.
 */
export async function addMissingCiqual(indexVersion: number): Promise<void> {
  const known = await db.appMeta.get(CIQUAL_INDEX_VERSION_KEY);
  if (known && Number(known.value) >= indexVersion) return;

  const seed = await fetchCiqual();
  if (!seed) return;

  await db.transaction('rw', db.ingredients, db.appMeta, async () => {
    const present = new Set(await db.ingredients.toCollection().primaryKeys());
    await db.ingredients.bulkAdd(seed.filter((ingredient) => !present.has(ingredient.id!)));
    await db.appMeta.put({ key: CIQUAL_INDEX_VERSION_KEY, value: String(indexVersion) });
  });
}

/** Aliments personnels, saisis librement. `isCustom` est un booléen, qu'IndexedDB n'indexe pas : filtre en mémoire. */
export async function listCustom(): Promise<Ingredient[]> {
  return db.ingredients.filter((i) => i.isCustom).toArray();
}

export async function create(data: Omit<Ingredient, 'id' | 'createdAt' | 'isCustom' | 'source'>): Promise<Ingredient> {
  const ingredient: Ingredient = {
    ...data,
    id: crypto.randomUUID(),
    isCustom: true,
    source: 'CUSTOM',
    createdAt: new Date().toISOString(),
  };
  await db.ingredients.add(ingredient);
  return ingredient;
}

export async function update(id: string, data: Partial<Ingredient>): Promise<void> {
  await db.ingredients.update(id, data);
}

/**
 * Enregistre l'unité d'un aliment. Les plats qui le comptent en unités gardent leur nombre
 * et prennent le nouveau poids ; les lignes saisies en grammes n'ont pas d'unitCount et ne bougent pas.
 */
export async function setPortion(
  id: string,
  portion: { portionG: number; portionLabel: string },
): Promise<Ingredient | undefined> {
  return db.transaction('rw', db.ingredients, db.recipeIngredients, async () => {
    await db.ingredients.update(id, portion);
    await db.recipeIngredients
      .where('ingredientId')
      .equals(id)
      .modify((line) => {
        if (line.unitCount !== undefined) line.quantityG = line.unitCount * portion.portionG;
      });
    return db.ingredients.get(id);
  });
}

export async function remove(id: string): Promise<void> {
  const ingredient = await db.ingredients.get(id);
  if (ingredient && !ingredient.isCustom) {
    throw new Error('Seuls les ingrédients personnalisés peuvent être supprimés');
  }
  await db.ingredients.delete(id);
}

export async function saveImported(data: Omit<Ingredient, 'id' | 'createdAt' | 'isCustom' | 'source'>): Promise<Ingredient> {
  const ingredient: Ingredient = {
    ...data,
    id: crypto.randomUUID(),
    isCustom: false,
    source: 'OFF',
    createdAt: new Date().toISOString(),
  };
  await db.ingredients.add(ingredient);
  return ingredient;
}
