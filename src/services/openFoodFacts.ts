import type { Ingredient } from '../db/schema';

const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fat_100g?: number;
  'saturated-fat_100g'?: number;
  fiber_100g?: number;
  salt_100g?: number;
}

interface OFFProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: OFFNutriments;
  nutriscore_grade?: string;
  allergens_tags?: string[];
}

export type ImportedIngredient = Omit<Ingredient, 'id' | 'createdAt' | 'isCustom'>;

function mapOFFProduct(product: OFFProduct): ImportedIngredient | null {
  const n = product.nutriments ?? {};
  if (product.product_name == null || n['energy-kcal_100g'] == null) return null;
  const nutriScore = product.nutriscore_grade?.toUpperCase();
  return {
    name: product.product_name,
    brand: product.brands,
    barcode: product.code,
    category: 'Autres',
    calories100g: n['energy-kcal_100g'],
    proteins100g: n.proteins_100g,
    carbs100g: n.carbohydrates_100g,
    sugars100g: n.sugars_100g,
    fat100g: n.fat_100g,
    saturatedFat100g: n['saturated-fat_100g'],
    fiber100g: n.fiber_100g,
    salt100g: n.salt_100g,
    nutriScore: ['A', 'B', 'C', 'D', 'E'].includes(nutriScore ?? '') ? (nutriScore as Ingredient['nutriScore']) : undefined,
    allergens: product.allergens_tags,
    offId: product.code,
  };
}

export async function searchByName(query: string): Promise<ImportedIngredient[]> {
  const url = new URL(`${OFF_BASE_URL}/search`);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('fields', 'code,product_name,brands,nutriments,nutriscore_grade,allergens_tags');
  url.searchParams.set('page_size', '20');

  const res = await fetch(url);
  if (!res.ok) throw new Error('Open Food Facts indisponible');
  const data = (await res.json()) as { products: OFFProduct[] };
  return data.products.map(mapOFFProduct).filter((i): i is ImportedIngredient => i !== null);
}

export async function searchByBarcode(ean: string): Promise<ImportedIngredient | null> {
  const res = await fetch(`${OFF_BASE_URL}/product/${ean}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Open Food Facts indisponible');
  const data = (await res.json()) as { product?: OFFProduct };
  return data.product ? mapOFFProduct(data.product) : null;
}
