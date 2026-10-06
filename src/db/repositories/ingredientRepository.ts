import { db, type Ingredient } from '../schema';
import { rankIngredients } from '../../services/ingredientSearch';

const SEARCH_LIMIT = 50;

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
