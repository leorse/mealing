// Copie le moteur WebAssembly d'ONNX dans public/ort/, pour qu'il soit servi par l'application
// et non par un CDN tiers. Variante simple : la variante par défaut de la bibliothèque (asyncify)
// dépasse les 25 Mio par fichier acceptés par Cloudflare.

import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '../node_modules/onnxruntime-web/dist');
const OUT_DIR = join(__dirname, '../public/ort');
const FILES = ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'];

mkdirSync(OUT_DIR, { recursive: true });
for (const file of FILES) copyFileSync(join(SRC_DIR, file), join(OUT_DIR, file));
console.log(`Moteur ONNX copié dans ${OUT_DIR}`);
