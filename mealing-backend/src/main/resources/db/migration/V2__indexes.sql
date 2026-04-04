-- Index pour les performances
CREATE INDEX idx_meal_slots_week_plan ON meal_slots(week_plan_id);
CREATE INDEX idx_meal_slots_date ON meal_slots(slot_date);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX idx_deviations_user_date ON deviations(user_id, deviation_date);
CREATE INDEX idx_ingredients_barcode ON ingredients(barcode);
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_week_plans_user_week ON week_plans(user_id, week_start);
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_week_plan ON shopping_lists(week_plan_id);
