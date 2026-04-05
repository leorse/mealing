-- Plats préparés (surgelés, traiteur, cantine...)
CREATE TABLE prepared_meals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    brand               VARCHAR(255),
    photo_url           VARCHAR(500),
    barcode             VARCHAR(50),
    nutri_score         CHAR(1),
    calories_portion    DECIMAL(8,2) NOT NULL DEFAULT 0,
    proteins_g          DECIMAL(7,2),
    carbs_g             DECIMAL(7,2),
    fat_g               DECIMAL(7,2),
    fiber_g             DECIMAL(7,2),
    portion_label       VARCHAR(100),
    off_id              VARCHAR(100),
    is_favorite         BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prepared_meals_user ON prepared_meals(user_id);
CREATE INDEX idx_prepared_meals_barcode ON prepared_meals(barcode);

-- Ajout colonnes sur meal_slots pour plats préparés
ALTER TABLE meal_slots
    ADD COLUMN prepared_meal_id UUID REFERENCES prepared_meals(id),
    ADD COLUMN prepared_meal_portions DECIMAL(4,2) DEFAULT 1,
    ADD COLUMN source_type VARCHAR(20) DEFAULT 'RECIPE';
