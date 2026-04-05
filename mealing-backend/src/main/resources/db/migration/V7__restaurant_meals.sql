-- Bibliothèque de plats types restaurant (issus Ciqual / estimations)
CREATE TABLE dish_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    category            VARCHAR(50),
    restaurant_type     VARCHAR(50),
    calories_small      INTEGER,
    calories_normal     INTEGER NOT NULL,
    calories_large      INTEGER,
    proteins_normal     DECIMAL(7,2),
    carbs_normal        DECIMAL(7,2),
    fat_normal          DECIMAL(7,2),
    source              VARCHAR(100) DEFAULT 'estimation'
);

CREATE INDEX idx_dish_templates_name ON dish_templates(name);
CREATE INDEX idx_dish_templates_category ON dish_templates(category);

-- Repas restaurant
CREATE TABLE restaurant_meals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
    restaurant_name         VARCHAR(255),
    restaurant_type         VARCHAR(50),
    dish_name               VARCHAR(255) NOT NULL,
    dish_notes              TEXT,
    estimation_method       VARCHAR(20) NOT NULL DEFAULT 'FREE',

    -- Méthode FREE : saisie directe
    calories_free           DECIMAL(8,2),
    proteins_free           DECIMAL(7,2),
    carbs_free              DECIMAL(7,2),
    fat_free                DECIMAL(7,2),

    -- Méthode GUIDED : plat type
    dish_template_id        UUID REFERENCES dish_templates(id),
    portion_size            VARCHAR(10) DEFAULT 'NORMAL',

    -- Total calculé (toutes méthodes)
    total_calories          DECIMAL(8,2),
    total_proteins          DECIMAL(7,2),
    total_carbs             DECIMAL(7,2),
    total_fat               DECIMAL(7,2),

    is_deviation            BOOLEAN DEFAULT FALSE,
    original_slot_id        UUID REFERENCES meal_slots(id),
    created_at              TIMESTAMP DEFAULT NOW()
);

-- Ingrédients reconstitués (méthode RECONSTRUCTED)
CREATE TABLE restaurant_meal_ingredients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_meal_id  UUID REFERENCES restaurant_meals(id) ON DELETE CASCADE,
    ingredient_id       UUID REFERENCES ingredients(id),
    quantity_g          DECIMAL(8,2),
    unit_label          VARCHAR(50),
    is_estimated        BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_restaurant_meals_user ON restaurant_meals(user_id);

-- Ajout colonnes restaurant sur meal_slots
ALTER TABLE meal_slots
    ADD COLUMN restaurant_meal_id UUID REFERENCES restaurant_meals(id);

-- Seeds plats types (~80 plats courants)
INSERT INTO dish_templates (name, category, restaurant_type, calories_small, calories_normal, calories_large, proteins_normal, carbs_normal, fat_normal, source) VALUES
-- Viandes
('Steak-frites', 'MEAT', 'FRENCH', 650, 850, 1050, 45.0, 65.0, 38.0, 'estimation'),
('Entrecôte grillée', 'MEAT', 'FRENCH', 400, 550, 700, 52.0, 0.0, 32.0, 'estimation'),
('Magret de canard', 'MEAT', 'FRENCH', 400, 550, 700, 38.0, 5.0, 38.0, 'estimation'),
('Poulet rôti (demi)', 'MEAT', 'FRENCH', 350, 480, 600, 45.0, 2.0, 28.0, 'estimation'),
('Côtelette de porc', 'MEAT', 'FRENCH', 300, 420, 540, 38.0, 0.0, 22.0, 'estimation'),
('Escalope milanaise', 'MEAT', 'ITALIAN', 450, 600, 750, 40.0, 30.0, 28.0, 'estimation'),
('Osso buco', 'MEAT', 'ITALIAN', 400, 550, 700, 42.0, 8.0, 28.0, 'estimation'),
('Tajine agneau', 'MEAT', 'MOROCCAN', 450, 620, 800, 38.0, 25.0, 32.0, 'estimation'),
('Couscous royal', 'MEAT', 'MOROCCAN', 700, 900, 1100, 50.0, 80.0, 30.0, 'estimation'),
('Gyros / Kebab', 'MEAT', 'GREEK', 500, 700, 900, 35.0, 55.0, 32.0, 'estimation'),
('Poulet tikka masala', 'MEAT', 'INDIAN', 400, 550, 700, 38.0, 20.0, 28.0, 'estimation'),
('Boeuf bourguignon', 'MEAT', 'FRENCH', 400, 550, 700, 42.0, 18.0, 24.0, 'Ciqual'),

-- Poissons
('Saumon grillé', 'FISH', 'FRENCH', 280, 380, 480, 40.0, 0.0, 18.0, 'Ciqual'),
('Sole meunière', 'FISH', 'FRENCH', 250, 350, 450, 35.0, 5.0, 16.0, 'estimation'),
('Crevettes sautées', 'FISH', 'FRENCH', 200, 280, 360, 28.0, 5.0, 12.0, 'estimation'),
('Sushi plateau (10 pièces)', 'FISH', 'JAPANESE', 280, 380, 480, 20.0, 55.0, 8.0, 'estimation'),
('Ramen poulet', 'FISH', 'JAPANESE', 450, 600, 750, 30.0, 70.0, 18.0, 'estimation'),
('Fish and chips', 'FISH', 'ENGLISH', 600, 800, 1000, 30.0, 70.0, 40.0, 'estimation'),
('Paella', 'FISH', 'SPANISH', 400, 550, 700, 28.0, 62.0, 14.0, 'estimation'),

-- Pizzas / Pâtes
('Pizza margherita', 'PIZZA', 'ITALIAN', 520, 700, 900, 25.0, 88.0, 22.0, 'estimation'),
('Pizza 4 fromages', 'PIZZA', 'ITALIAN', 600, 800, 1000, 32.0, 85.0, 32.0, 'estimation'),
('Pizza jambon champignons', 'PIZZA', 'ITALIAN', 550, 730, 920, 28.0, 86.0, 24.0, 'estimation'),
('Pasta carbonara', 'PASTA', 'ITALIAN', 550, 720, 900, 28.0, 68.0, 28.0, 'estimation'),
('Pasta bolognaise', 'PASTA', 'ITALIAN', 500, 680, 850, 30.0, 70.0, 22.0, 'estimation'),
('Pasta pesto', 'PASTA', 'ITALIAN', 480, 640, 800, 18.0, 72.0, 22.0, 'estimation'),
('Risotto aux champignons', 'PASTA', 'ITALIAN', 400, 540, 680, 12.0, 72.0, 18.0, 'estimation'),
('Lasagnes bolognaise', 'PASTA', 'ITALIAN', 450, 600, 750, 28.0, 50.0, 28.0, 'estimation'),

-- Burgers / Fast food
('Burger classique', 'BURGER', 'AMERICAN', 500, 650, 800, 32.0, 45.0, 32.0, 'estimation'),
('Burger double', 'BURGER', 'AMERICAN', 650, 850, 1050, 48.0, 48.0, 44.0, 'estimation'),
('Burger végétarien', 'BURGER', 'AMERICAN', 420, 560, 700, 20.0, 52.0, 22.0, 'estimation'),
('Hot dog', 'BURGER', 'AMERICAN', 350, 460, 580, 18.0, 38.0, 24.0, 'estimation'),
('Club sandwich', 'SANDWICH', 'AMERICAN', 400, 530, 660, 28.0, 40.0, 24.0, 'estimation'),

-- Cuisine asiatique
('Pad thaï crevettes', 'NOODLES', 'THAI', 420, 560, 700, 24.0, 68.0, 14.0, 'estimation'),
('Riz cantonais', 'RICE', 'CHINESE', 350, 480, 600, 18.0, 62.0, 14.0, 'estimation'),
('Porc laqué + riz', 'RICE', 'CHINESE', 450, 600, 750, 28.0, 65.0, 18.0, 'estimation'),
('Nems (3 pièces)', 'STARTER', 'VIETNAMESE', 200, 270, 340, 10.0, 28.0, 14.0, 'estimation'),
('Bò bún', 'NOODLES', 'VIETNAMESE', 350, 470, 590, 25.0, 55.0, 12.0, 'estimation'),
('Curry vert poulet + riz', 'RICE', 'THAI', 480, 640, 800, 32.0, 68.0, 18.0, 'estimation'),

-- Salades et végétarien
('Salade César poulet', 'SALAD', 'AMERICAN', 350, 450, 580, 32.0, 18.0, 22.0, 'estimation'),
('Salade niçoise', 'SALAD', 'FRENCH', 280, 380, 480, 22.0, 20.0, 18.0, 'Ciqual'),
('Salade grecque', 'SALAD', 'GREEK', 250, 340, 430, 12.0, 14.0, 22.0, 'estimation'),
('Quiche lorraine (part)', 'SAVORY_PIE', 'FRENCH', 320, 430, 540, 18.0, 25.0, 28.0, 'Ciqual'),
('Omelette nature', 'EGG', 'FRENCH', 200, 270, 340, 18.0, 2.0, 18.0, 'Ciqual'),
('Omelette fromage', 'EGG', 'FRENCH', 280, 380, 480, 22.0, 2.0, 28.0, 'estimation'),
('Gratin dauphinois (part)', 'VEGGIE', 'FRENCH', 280, 380, 480, 8.0, 32.0, 20.0, 'Ciqual'),
('Ratatouille', 'VEGGIE', 'FRENCH', 120, 160, 200, 4.0, 18.0, 6.0, 'Ciqual'),
('Falafel + houmous', 'VEGGIE', 'MIDDLE_EAST', 380, 510, 640, 18.0, 52.0, 18.0, 'estimation'),

-- Entrées
('Soupe à l''oignon', 'SOUP', 'FRENCH', 150, 200, 260, 8.0, 22.0, 8.0, 'estimation'),
('Velouté de poireaux', 'SOUP', 'FRENCH', 100, 140, 180, 4.0, 14.0, 6.0, 'estimation'),
('Foie gras (toast)', 'STARTER', 'FRENCH', 200, 270, 340, 8.0, 12.0, 20.0, 'Ciqual'),
('Escargots (6)', 'STARTER', 'FRENCH', 120, 160, 200, 12.0, 2.0, 10.0, 'estimation'),
('Carpaccio de boeuf', 'STARTER', 'ITALIAN', 150, 200, 260, 18.0, 2.0, 10.0, 'estimation'),

-- Desserts
('Crème brûlée', 'DESSERT', 'FRENCH', 200, 270, 340, 5.0, 28.0, 14.0, 'Ciqual'),
('Mousse au chocolat', 'DESSERT', 'FRENCH', 220, 300, 380, 6.0, 28.0, 18.0, 'estimation'),
('Tarte tatin (part)', 'DESSERT', 'FRENCH', 280, 380, 480, 4.0, 52.0, 18.0, 'estimation'),
('Tiramisu', 'DESSERT', 'ITALIAN', 250, 340, 430, 6.0, 35.0, 18.0, 'estimation'),
('Panna cotta', 'DESSERT', 'ITALIAN', 180, 240, 300, 4.0, 22.0, 14.0, 'estimation'),
('Glace (2 boules)', 'DESSERT', 'FRENCH', 150, 200, 260, 4.0, 28.0, 8.0, 'estimation'),

-- Boissons
('Bière (33cl)', 'DRINK', NULL, 140, 140, 200, 1.0, 12.0, 0.0, 'Ciqual'),
('Vin rouge (verre 15cl)', 'DRINK', NULL, 120, 120, 170, 0.1, 4.0, 0.0, 'Ciqual'),
('Vin blanc (verre 15cl)', 'DRINK', NULL, 110, 110, 155, 0.1, 3.0, 0.0, 'Ciqual'),
('Coca-Cola (33cl)', 'DRINK', NULL, 139, 139, 139, 0.0, 35.0, 0.0, 'Ciqual'),
('Café (expresso)', 'DRINK', NULL, 5, 5, 5, 0.3, 0.5, 0.1, 'Ciqual'),
('Jus de fruits (25cl)', 'DRINK', NULL, 112, 112, 160, 1.0, 26.0, 0.0, 'estimation');
