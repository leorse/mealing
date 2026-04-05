-- Extras d'un créneau (entrée, dessert, boisson, accompagnement...)
CREATE TABLE meal_extras (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_slot_id        UUID REFERENCES meal_slots(id) ON DELETE CASCADE,
    label               VARCHAR(255) NOT NULL,
    extra_type          VARCHAR(20) NOT NULL DEFAULT 'OTHER',

    -- Option A : ingrédient BDD
    ingredient_id       UUID REFERENCES ingredients(id),
    quantity_g          DECIMAL(8,2),

    -- Option B : plat préparé
    prepared_meal_id    UUID REFERENCES prepared_meals(id),
    portions            DECIMAL(4,2),

    -- Option C : saisie libre
    calories_free       DECIMAL(8,2),
    proteins_free       DECIMAL(7,2),
    carbs_free          DECIMAL(7,2),
    fat_free            DECIMAL(7,2),

    added_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_extras_slot ON meal_extras(meal_slot_id);
