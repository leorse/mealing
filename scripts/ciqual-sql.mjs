// Lecture de assets/ciqual.sql, partagée par convert-ciqual.mjs (seed de l'app)
// et embed-ciqual.mjs (vecteurs de la recherche sémantique).

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const SQL_PATH = join(__dirname, '../assets/ciqual.sql');
export const SEED_DIR = join(__dirname, '../public/seed');
export const INDEX_PATH = join(SEED_DIR, 'ciqual-index.json');
export const VECTORS_PATH = join(SEED_DIR, 'ciqual-vectors.bin');

const COLUMNS = [
  'id', 'name', 'brand', 'barcode', 'category', 'calories_100g', 'proteins_100g',
  'carbs_100g', 'sugars_100g', 'fat_100g', 'saturated_fat_100g', 'fiber_100g',
  'salt_100g', 'glycemic_index', 'nutri_score', 'off_id', 'is_custom', 'source',
  'user_id', 'created_at', 'portion_g', 'portion_label',
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

// Les fins de ligne sont normalisées : un même dépôt extrait en CRLF ou en LF donne la même empreinte.
function readSql() {
  return readFileSync(SQL_PATH, 'utf-8').replace(/\r\n/g, '\n');
}

/** Les lignes de ciqual.sql, une par aliment, sous forme d'objets indexés par nom de colonne. */
export function readCiqualRows() {
  return readSql()
    .split('\n')
    .filter((l) => l.startsWith('INSERT'))
    .map((line) => {
      const start = line.indexOf('VALUES (') + 'VALUES ('.length;
      const end = line.lastIndexOf(');');
      const values = parseValueTuple(line.slice(start, end));
      return Object.fromEntries(COLUMNS.map((col, idx) => [col, values[idx]]));
    });
}

/** Empreinte de la base : c'est elle qui lie les vecteurs livrés à la base dont ils sont issus. */
export function ciqualHash() {
  return createHash('sha256').update(readSql()).digest('hex');
}

/**
 * Vrai si le fichier de vecteurs est là et fait la taille annoncée par le manifeste.
 * Il n'est pas versionné dans git : sur un poste neuf, le manifeste existe mais pas lui.
 */
export function hasVectors(index) {
  return existsSync(VECTORS_PATH) && statSync(VECTORS_PATH).size === index.count * index.dim;
}

/** Le manifeste des vecteurs déjà produit, ou `null` s'il n'y en a pas encore. */
export function readIndex() {
  return existsSync(INDEX_PATH) ? JSON.parse(readFileSync(INDEX_PATH, 'utf-8')) : null;
}
