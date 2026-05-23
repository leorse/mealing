/**
 * Export des ingrédients CIQUAL depuis mealing.db vers un fichier SQL
 * bundlé dans l'APK.
 *
 * Usage : node tools/export-ciqual-for-mobile.js
 *
 * Prérequis : npm install better-sqlite3   (dans le dossier tools/)
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../mealing-backend/mealing.db');
const OUT_PATH = path.join(__dirname, '../mealing-mobile/assets/ciqual.sql');

if (!fs.existsSync(DB_PATH)) {
  console.error(`mealing.db introuvable : ${DB_PATH}`);
  console.error('Lance d\'abord le backend Spring Boot pour créer la DB, puis le CiqualImporter.');
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

const rows = db.prepare(
  "SELECT * FROM ingredients WHERE source = 'CIQUAL' ORDER BY name"
).all();

if (rows.length === 0) {
  console.warn('Aucun ingrédient CIQUAL trouvé. Lance le CiqualImporter d\'abord.');
  process.exit(1);
}

const lines = rows.map((r) => {
  const escape = (v) => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
  return `INSERT OR IGNORE INTO ingredients ` +
    `(id, name, brand, barcode, category, calories_100g, proteins_100g, carbs_100g, ` +
    `sugars_100g, fat_100g, saturated_fat_100g, fiber_100g, salt_100g, glycemic_index, ` +
    `nutri_score, off_id, is_custom, source, user_id, created_at) VALUES ` +
    `(${escape(r.id)}, ${escape(r.name)}, ${escape(r.brand)}, ${escape(r.barcode)}, ` +
    `${escape(r.category)}, ${r.calories_100g ?? 'NULL'}, ${r.proteins_100g ?? 'NULL'}, ` +
    `${r.carbs_100g ?? 'NULL'}, ${r.sugars_100g ?? 'NULL'}, ${r.fat_100g ?? 'NULL'}, ` +
    `${r.saturated_fat_100g ?? 'NULL'}, ${r.fiber_100g ?? 'NULL'}, ${r.salt_100g ?? 'NULL'}, ` +
    `${r.glycemic_index ?? 'NULL'}, ${escape(r.nutri_score)}, ${escape(r.off_id)}, ` +
    `0, 'CIQUAL', NULL, ${escape(r.created_at)});`;
});

fs.writeFileSync(OUT_PATH, lines.join('\n') + '\n', 'utf8');
console.log(`✓ ${rows.length} ingrédients CIQUAL exportés → ${OUT_PATH}`);
db.close();
