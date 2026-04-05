-- Support import recettes JSON
ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS tags VARCHAR(500),
    ADD COLUMN IF NOT EXISTS nutrition_override JSONB;

ALTER TABLE recipe_ingredients
    ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT TRUE;
