import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export const USER_ID = '00000000-0000-0000-0000-000000000001';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('mealing.db');
  await initSchema(_db);
  await loadCiqualIfNeeded(_db);
  return _db;
}

async function loadCiqualIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  // Vérifie si les données CIQUAL sont déjà chargées
  const count = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM ingredients WHERE source = 'CIQUAL'"
  );
  if ((count?.cnt ?? 0) > 0) return;

  // Charge le fichier SQL bundlé si disponible
  try {
    // Le fichier assets/ciqual.sql doit être généré via tools/export-ciqual-for-mobile.js
    const asset = Asset.fromModule(require('../../assets/ciqual.sql'));
    await asset.downloadAsync();
    if (!asset.localUri) return;

    const sql = await FileSystem.readAsStringAsync(asset.localUri);
    const statements = sql.split(';\n').filter((s) => s.trim().length > 0);

    for (const stmt of statements) {
      try {
        await db.runAsync(stmt + ';');
      } catch {
        // Ignore les erreurs d'insert individuel (doublons, etc.)
      }
    }
    console.log(`CIQUAL chargé : ${statements.length} ingrédients`);
  } catch {
    // Fichier non présent = pas de données CIQUAL (app fonctionne sans)
    console.log('Fichier ciqual.sql non disponible — ingrédients CIQUAL non chargés');
  }
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function now(): string {
  return new Date().toISOString();
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      first_name TEXT,
      birth_date TEXT,
      gender TEXT,
      height_cm REAL,
      weight_kg REAL,
      activity_level TEXT,
      goal TEXT,
      target_calories INTEGER,
      macro_protein_pct INTEGER DEFAULT 30,
      macro_carbs_pct INTEGER DEFAULT 45,
      macro_fat_pct INTEGER DEFAULT 25,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      barcode TEXT,
      category TEXT,
      calories_100g REAL NOT NULL DEFAULT 0,
      proteins_100g REAL,
      carbs_100g REAL,
      sugars_100g REAL,
      fat_100g REAL,
      saturated_fat_100g REAL,
      fiber_100g REAL,
      salt_100g REAL,
      glycemic_index INTEGER,
      nutri_score TEXT,
      off_id TEXT,
      is_custom INTEGER DEFAULT 0,
      source TEXT,
      user_id TEXT,
      created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
    CREATE INDEX IF NOT EXISTS idx_ingredients_source ON ingredients(source);

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      servings INTEGER DEFAULT 1,
      prep_time_min INTEGER,
      cook_time_min INTEGER,
      difficulty TEXT,
      is_healthy INTEGER,
      photo_url TEXT,
      tags TEXT,
      nutrition_override TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      ingredient_id TEXT NOT NULL,
      quantity_g REAL NOT NULL,
      unit_label TEXT,
      is_resolved INTEGER DEFAULT 1,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prepared_meals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      photo_url TEXT,
      barcode TEXT,
      nutri_score TEXT,
      calories_portion REAL DEFAULT 0,
      proteins_g REAL,
      carbs_g REAL,
      fat_g REAL,
      fiber_g REAL,
      portion_label TEXT,
      off_id TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS week_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start TEXT NOT NULL,
      notes TEXT,
      UNIQUE(user_id, week_start)
    );

    CREATE TABLE IF NOT EXISTS meal_slots (
      id TEXT PRIMARY KEY,
      week_plan_id TEXT NOT NULL,
      slot_date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id TEXT,
      free_label TEXT,
      portions REAL DEFAULT 1,
      is_deviation INTEGER DEFAULT 0,
      calories_override INTEGER,
      is_consumed INTEGER DEFAULT 0,
      consumed_at TEXT,
      prepared_meal_id TEXT,
      prepared_meal_portions REAL DEFAULT 1,
      source_type TEXT DEFAULT 'RECIPE',
      FOREIGN KEY (week_plan_id) REFERENCES week_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_extras (
      id TEXT PRIMARY KEY,
      meal_slot_id TEXT NOT NULL,
      label TEXT NOT NULL,
      extra_type TEXT DEFAULT 'OTHER',
      ingredient_id TEXT,
      quantity_g REAL,
      prepared_meal_id TEXT,
      portions REAL,
      calories_free REAL,
      proteins_free REAL,
      carbs_free REAL,
      fat_free REAL,
      added_at TEXT
    );

    CREATE TABLE IF NOT EXISTS restaurant_meals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      restaurant_name TEXT,
      restaurant_type TEXT,
      dish_name TEXT NOT NULL,
      dish_notes TEXT,
      estimation_method TEXT DEFAULT 'FREE',
      calories_free REAL,
      proteins_free REAL,
      carbs_free REAL,
      fat_free REAL,
      portion_size TEXT DEFAULT 'NORMAL',
      total_calories REAL,
      total_proteins REAL,
      total_carbs REAL,
      total_fat REAL,
      is_deviation INTEGER DEFAULT 0,
      original_slot_id TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS restaurant_meal_ingredients (
      id TEXT PRIMARY KEY,
      restaurant_meal_id TEXT NOT NULL,
      ingredient_id TEXT,
      quantity_g REAL,
      unit_label TEXT,
      is_estimated INTEGER DEFAULT 1,
      FOREIGN KEY (restaurant_meal_id) REFERENCES restaurant_meals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      log_date TEXT NOT NULL,
      weight_kg REAL,
      notes TEXT,
      UNIQUE(user_id, log_date)
    );

    CREATE TABLE IF NOT EXISTS deviations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      deviation_date TEXT NOT NULL,
      meal_slot_id TEXT,
      type TEXT NOT NULL,
      label TEXT,
      calories_extra INTEGER NOT NULL,
      compensation_spread INTEGER DEFAULT 2,
      notes TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS shopping_lists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      week_plan_id TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      label TEXT NOT NULL,
      quantity_g REAL,
      unit_label TEXT,
      category TEXT,
      is_checked INTEGER DEFAULT 0,
      is_manual INTEGER DEFAULT 0,
      FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
    );
  `);
}
