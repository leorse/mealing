import type { Ingredient } from '../db/schema';

/** Minuscules, sans accents : « Pâté » et « pate » se comparent à égalité. */
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

// Accents déjà retirés : « à » s'écrit « a ».
const LIAISON = /^ (?:d'|(?:de|du|des|a|au|aux|en)(?: |'|$))/;
const LETTER = /\p{L}/u;

/**
 * Niveau d'un nom pour une saisie normalisée, du plus pertinent (1) au moins pertinent (4) :
 * 1 « Pomme, chair… », 2 « Pomme Gala… », 3 « Pomme de terre… », 4 « Jus de pomme… ».
 * Une saisie partielle vaut le mot qu'elle commence : « pom » classe comme « pomme ».
 */
function rankOf(name: string, query: string): number {
  if (!name.startsWith(query)) return 4;

  let end = query.length;
  while (end < name.length && LETTER.test(name[end])) end++;
  const rest = name.slice(end);

  if (rest === '' || rest.startsWith(',')) return 1;
  if (LIAISON.test(rest)) return 3;
  return 2;
}

/** Aliments dont le nom ou la marque contient la saisie, classés par niveau puis par nom. */
export function rankIngredients(ingredients: Ingredient[], query: string): Ingredient[] {
  const q = normalize(query).trim();
  if (!q) return [];

  return ingredients
    .flatMap((ingredient) => {
      const name = normalize(ingredient.name);
      const matches = name.includes(q) || (ingredient.brand !== undefined && normalize(ingredient.brand).includes(q));
      return matches ? [{ ingredient, rank: rankOf(name, q) }] : [];
    })
    .sort(
      (a, b) =>
        a.rank - b.rank || a.ingredient.name.localeCompare(b.ingredient.name, 'fr', { sensitivity: 'base' }),
    )
    .map(({ ingredient }) => ingredient);
}
