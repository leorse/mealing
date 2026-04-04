-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Utilisateurs
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Profil physique & objectifs
CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name          VARCHAR(100),
    birth_date          DATE,
    gender              VARCHAR(10),
    height_cm           DECIMAL(5,1),
    weight_kg           DECIMAL(5,2),
    activity_level      VARCHAR(20),
    goal                VARCHAR(20),
    target_calories     INTEGER,
    macro_protein_pct   INTEGER DEFAULT 30,
    macro_carbs_pct     INTEGER DEFAULT 45,
    macro_fat_pct       INTEGER DEFAULT 25,
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Ingrédients / Aliments
CREATE TABLE ingredients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    brand               VARCHAR(255),
    barcode             VARCHAR(50),
    category            VARCHAR(50),
    calories_100g       DECIMAL(7,2) NOT NULL DEFAULT 0,
    proteins_100g       DECIMAL(7,2),
    carbs_100g          DECIMAL(7,2),
    sugars_100g         DECIMAL(7,2),
    fat_100g            DECIMAL(7,2),
    saturated_fat_100g  DECIMAL(7,2),
    fiber_100g          DECIMAL(7,2),
    salt_100g           DECIMAL(7,2),
    glycemic_index      INTEGER,
    nutri_score         CHAR(1),
    off_id              VARCHAR(100),
    is_custom           BOOLEAN DEFAULT FALSE,
    user_id             UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Recettes
CREATE TABLE recipes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    servings        INTEGER DEFAULT 1,
    prep_time_min   INTEGER,
    cook_time_min   INTEGER,
    difficulty      VARCHAR(10),
    is_healthy      BOOLEAN,
    photo_url       VARCHAR(500),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Pivot recette <-> ingrédient
CREATE TABLE recipe_ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id   UUID REFERENCES ingredients(id),
    quantity_g      DECIMAL(8,2) NOT NULL,
    unit_label      VARCHAR(50)
);

-- Plan de repas (semaine)
CREATE TABLE week_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start      DATE NOT NULL,
    notes           TEXT,
    UNIQUE(user_id, week_start)
);

-- Créneau repas
CREATE TABLE meal_slots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_plan_id        UUID REFERENCES week_plans(id) ON DELETE CASCADE,
    slot_date           DATE NOT NULL,
    meal_type           VARCHAR(20) NOT NULL,
    recipe_id           UUID REFERENCES recipes(id),
    free_label          VARCHAR(255),
    portions            DECIMAL(4,2) DEFAULT 1,
    is_deviation        BOOLEAN DEFAULT FALSE,
    calories_override   INTEGER,
    is_consumed         BOOLEAN DEFAULT FALSE,
    consumed_at         TIMESTAMP
);

-- Log journalier
CREATE TABLE daily_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL,
    total_calories  DECIMAL(8,2),
    total_proteins  DECIMAL(8,2),
    total_carbs     DECIMAL(8,2),
    total_fat       DECIMAL(8,2),
    total_fiber     DECIMAL(8,2),
    weight_kg       DECIMAL(5,2),
    notes           TEXT,
    UNIQUE(user_id, log_date)
);

-- Écarts alimentaires
CREATE TABLE deviations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    deviation_date      DATE NOT NULL,
    meal_slot_id        UUID REFERENCES meal_slots(id),
    type                VARCHAR(10) NOT NULL,
    label               VARCHAR(255),
    calories_extra      INTEGER NOT NULL,
    compensation_spread INTEGER DEFAULT 2,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Liste de courses
CREATE TABLE shopping_lists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    week_plan_id    UUID REFERENCES week_plans(id),
    name            VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shopping_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id    UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
    ingredient_id       UUID REFERENCES ingredients(id),
    label               VARCHAR(255) NOT NULL,
    quantity_g          DECIMAL(8,2),
    unit_label          VARCHAR(50),
    category            VARCHAR(50),
    is_checked          BOOLEAN DEFAULT FALSE,
    is_manual           BOOLEAN DEFAULT FALSE
);
