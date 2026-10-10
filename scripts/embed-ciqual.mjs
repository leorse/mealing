// Vectorise les aliments de assets/ciqual.sql pour la recherche sémantique sur l'appareil.
// Produit public/seed/ciqual-vectors.bin (int8) et public/seed/ciqual-index.json (manifeste).
// À relancer après toute modification de assets/ciqual.sql : npm run embed:ciqual
// Le premier lancement télécharge le modèle (≈ 120 Mo) depuis Hugging Face.
//
// Le manifeste est versionné dans git, pas le fichier de vecteurs : sur un poste où il manque,
// il est recalculé à l'identique, sans changer de version. La version n'augmente que si la base
// ou les réglages du modèle changent.

import { writeFileSync } from 'node:fs';
import { INDEX_PATH, VECTORS_PATH, ciqualHash, hasVectors, readCiqualRows, readIndex } from './ciqual-sql.mjs';

// Ces quatre valeurs sont recopiées au manifeste : l'appareil vectorise ses requêtes avec les mêmes.
const MODEL = 'Xenova/multilingual-e5-small';
const DTYPE = 'q8';
const PREFIX = 'query: ';
const POOLING = 'mean';

const BATCH_SIZE = 32;

const sourceHash = ciqualHash();
const previous = readIndex();
const sameRecipe =
  previous &&
  previous.sourceHash === sourceHash &&
  previous.model === MODEL &&
  previous.dtype === DTYPE &&
  previous.prefix === PREFIX &&
  previous.pooling === POOLING;

if (sameRecipe && hasVectors(previous)) {
  console.log(`Vecteurs à jour (version ${previous.version}, ${previous.count} aliments) : rien à faire.`);
  process.exit(0);
}
if (sameRecipe) console.log(`Fichier de vecteurs absent : recalcul de la version ${previous.version}.`);

// Chargée seulement s'il y a un calcul à faire : son import seul coûte plus d'une seconde.
const { pipeline } = await import('@huggingface/transformers');

const rows = readCiqualRows();
const texts = rows.map((row) => `${PREFIX}${row.name} (${row.category ?? 'Autres'})`);

console.log(`Chargement du modèle ${MODEL} (${DTYPE})…`);
const extractor = await pipeline('feature-extraction', MODEL, { dtype: DTYPE });

let vectors = null;
let dim = 0;
for (let start = 0; start < texts.length; start += BATCH_SIZE) {
  const output = await extractor(texts.slice(start, start + BATCH_SIZE), { pooling: POOLING, normalize: true });
  if (!vectors) {
    dim = output.dims[1];
    vectors = new Int8Array(texts.length * dim);
  }
  // Vecteurs de norme 1 : chaque composante tient dans [-1, 1], donc dans un octet signé après ×127.
  for (let i = 0; i < output.data.length; i++) {
    vectors[start * dim + i] = Math.max(-127, Math.min(127, Math.round(output.data[i] * 127)));
  }
  process.stdout.write(`\r${Math.min(start + BATCH_SIZE, texts.length)} / ${texts.length}`);
}
process.stdout.write('\n');

const index = {
  version: sameRecipe ? previous.version : (previous?.version ?? 0) + 1,
  sourceHash,
  model: MODEL,
  dtype: DTYPE,
  prefix: PREFIX,
  pooling: POOLING,
  dim,
  count: rows.length,
  ids: rows.map((row) => row.id),
};

writeFileSync(VECTORS_PATH, vectors);
writeFileSync(INDEX_PATH, JSON.stringify(index));
console.log(`Version ${index.version} : ${index.count} vecteurs de dimension ${dim} écrits dans ${VECTORS_PATH}`);
