// Convertit assets/ciqual.sql (dump SQL des inserts Ciqual) en public/seed/ciqual.json,
// consommé par src/db/seed.ts au premier lancement de l'app.
// À relancer si assets/ciqual.sql est mis à jour : node scripts/convert-ciqual.mjs

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEED_DIR, ciqualHash, hasVectors, readCiqualRows, readIndex } from './ciqual-sql.mjs';

const OUT_PATH = join(SEED_DIR, 'ciqual.json');

function toIngredient(row) {
  const isCustom = row.is_custom === 1 || row.is_custom === '1';
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    barcode: row.barcode ?? undefined,
    category: row.category ?? 'Autres',
    calories100g: row.calories_100g,
    proteins100g: row.proteins_100g ?? undefined,
    carbs100g: row.carbs_100g ?? undefined,
    sugars100g: row.sugars_100g ?? undefined,
    fat100g: row.fat_100g ?? undefined,
    saturatedFat100g: row.saturated_fat_100g ?? undefined,
    fiber100g: row.fiber_100g ?? undefined,
    salt100g: row.salt_100g ?? undefined,
    glycemicIndex: row.glycemic_index ?? undefined,
    nutriScore: row.nutri_score ?? undefined,
    portionG: row.portion_g ?? undefined,
    portionLabel: row.portion_label ?? undefined,
    isCustom,
    source: 'CIQUAL',
    createdAt: new Date(row.created_at.replace(' ', 'T') + 'Z').toISOString(),
  };
}

// Les vecteurs de la recherche sémantique sont calculés à part (plusieurs minutes) : ici on vérifie
// seulement qu'ils viennent bien de cette base, pour ne jamais livrer une base et des vecteurs désaccordés.
const index = readIndex();
if (!index || index.sourceHash !== ciqualHash()) {
  console.error(
    index
      ? 'assets/ciqual.sql a changé depuis le calcul des vecteurs de recherche.'
      : 'Les vecteurs de recherche (public/seed/ciqual-index.json) sont absents.',
  );
  console.error('Relancer : npm run embed:ciqual');
  process.exit(1);
}

// Le fichier de vecteurs n'est pas dans git : sur un poste où il manque, on le recalcule ici,
// à la version du manifeste. Plusieurs minutes, et le modèle est téléchargé la première fois.
if (!hasVectors(index)) {
  console.log('Vecteurs de recherche absents sur ce poste : calcul en cours (quelques minutes)…');
  execFileSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), 'embed-ciqual.mjs')], { stdio: 'inherit' });
}

const ingredients = readCiqualRows().map(toIngredient);

writeFileSync(OUT_PATH, JSON.stringify(ingredients));
console.log(`${ingredients.length} ingrédients écrits dans ${OUT_PATH}`);
