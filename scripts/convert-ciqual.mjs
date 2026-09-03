// Convertit assets/ciqual.sql (dump SQL des inserts Ciqual) en public/seed/ciqual.json,
// consommé par src/db/seed.ts au premier lancement de l'app.
// À relancer si assets/ciqual.sql est mis à jour : node scripts/convert-ciqual.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_PATH = join(__dirname, '../assets/ciqual.sql');
const OUT_PATH = join(__dirname, '../public/seed/ciqual.json');

const COLUMNS = [
  'id', 'name', 'brand', 'barcode', 'category', 'calories_100g', 'proteins_100g',
  'carbs_100g', 'sugars_100g', 'fat_100g', 'saturated_fat_100g', 'fiber_100g',
  'salt_100g', 'glycemic_index', 'nutri_score', 'off_id', 'is_custom', 'source',
  'user_id', 'created_at',
];

/** Tokenize une liste de valeurs SQL (VALUES(...)) en respectant les quotes et '' échappé. */
function parseValueTuple(tuple) {
  const values = [];
  let i = 0;
  const n = tuple.length;
  while (i < n) {
    while (i < n && (tuple[i] === ' ' || tuple[i] === ',')) i++;
    if (i >= n) break;

    if (tuple[i] === "'") {
      i++;
      let str = '';
      while (i < n) {
        if (tuple[i] === "'" && tuple[i + 1] === "'") {
          str += "'";
          i += 2;
        } else if (tuple[i] === "'") {
          i++;
          break;
        } else {
          str += tuple[i];
          i++;
        }
      }
      values.push(str);
    } else {
      let raw = '';
      while (i < n && tuple[i] !== ',') {
        raw += tuple[i];
        i++;
      }
      raw = raw.trim();
      values.push(raw === 'NULL' ? null : Number(raw));
    }
  }
  return values;
}

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
    isCustom,
    source: 'CIQUAL',
    createdAt: new Date(row.created_at.replace(' ', 'T') + 'Z').toISOString(),
  };
}

const sql = readFileSync(SQL_PATH, 'utf-8');
const lines = sql.split('\n').filter((l) => l.startsWith('INSERT'));

const ingredients = lines.map((line) => {
  const start = line.indexOf('VALUES (') + 'VALUES ('.length;
  const end = line.lastIndexOf(');');
  const tuple = line.slice(start, end);
  const values = parseValueTuple(tuple);
  const row = Object.fromEntries(COLUMNS.map((col, idx) => [col, values[idx]]));
  return toIngredient(row);
});

writeFileSync(OUT_PATH, JSON.stringify(ingredients));
console.log(`${ingredients.length} ingrédients écrits dans ${OUT_PATH}`);
