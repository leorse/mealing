-- Aliments de base (valeurs nutritionnelles pour 100g)
INSERT INTO ingredients (name, category, calories_100g, proteins_100g, carbs_100g, sugars_100g, fat_100g, fiber_100g, salt_100g, nutri_score, is_custom) VALUES
-- Légumes
('Tomate', 'Légumes', 18, 0.9, 3.5, 3.2, 0.2, 1.2, 0.01, 'A', false),
('Carotte', 'Légumes', 41, 0.9, 9.6, 4.7, 0.2, 2.8, 0.07, 'A', false),
('Courgette', 'Légumes', 17, 1.2, 3.1, 2.5, 0.3, 1.0, 0.01, 'A', false),
('Brocoli', 'Légumes', 34, 2.8, 7.0, 1.7, 0.4, 2.6, 0.04, 'A', false),
('Épinards', 'Légumes', 23, 2.9, 3.6, 0.4, 0.4, 2.2, 0.08, 'A', false),
('Poivron rouge', 'Légumes', 31, 1.0, 6.0, 4.2, 0.3, 2.1, 0.02, 'A', false),
('Oignon', 'Légumes', 40, 1.1, 9.3, 4.2, 0.1, 1.7, 0.01, 'A', false),
('Ail', 'Légumes', 149, 6.4, 33.1, 1.0, 0.5, 2.1, 0.02, 'A', false),
('Concombre', 'Légumes', 16, 0.7, 3.6, 1.7, 0.1, 0.5, 0.01, 'A', false),
('Salade verte', 'Légumes', 15, 1.4, 2.2, 0.6, 0.2, 1.3, 0.03, 'A', false),

-- Fruits
('Pomme', 'Fruits', 52, 0.3, 13.8, 10.4, 0.2, 2.4, 0.01, 'A', false),
('Banane', 'Fruits', 89, 1.1, 22.8, 12.2, 0.3, 2.6, 0.01, 'B', false),
('Orange', 'Fruits', 47, 0.9, 11.8, 9.4, 0.1, 2.4, 0.01, 'A', false),
('Fraise', 'Fruits', 32, 0.7, 7.7, 4.9, 0.3, 2.0, 0.01, 'A', false),
('Avocat', 'Fruits', 160, 2.0, 8.5, 0.7, 14.7, 6.7, 0.01, 'A', false),

-- Viandes & Poissons
('Poulet (blanc)', 'Viandes & Poissons', 165, 31.0, 0.0, 0.0, 3.6, 0.0, 0.07, 'B', false),
('Boeuf haché 5%', 'Viandes & Poissons', 137, 21.4, 0.0, 0.0, 5.6, 0.0, 0.07, 'B', false),
('Saumon', 'Viandes & Poissons', 208, 20.4, 0.0, 0.0, 13.4, 0.0, 0.05, 'A', false),
('Thon (en conserve eau)', 'Viandes & Poissons', 116, 25.5, 0.0, 0.0, 1.0, 0.0, 0.40, 'B', false),
('Oeuf', 'Viandes & Poissons', 155, 13.0, 1.1, 1.1, 11.0, 0.0, 0.14, 'B', false),
('Crevettes', 'Viandes & Poissons', 99, 20.9, 0.9, 0.0, 1.1, 0.0, 0.55, 'A', false),

-- Produits laitiers
('Lait entier', 'Produits laitiers', 61, 3.2, 4.8, 4.8, 3.3, 0.0, 0.05, 'B', false),
('Yaourt nature', 'Produits laitiers', 59, 3.5, 4.7, 4.7, 3.3, 0.0, 0.08, 'B', false),
('Fromage blanc 0%', 'Produits laitiers', 46, 8.0, 4.0, 4.0, 0.1, 0.0, 0.05, 'A', false),
('Emmental', 'Produits laitiers', 380, 28.8, 0.0, 0.0, 29.0, 0.0, 0.45, 'C', false),
('Mozzarella', 'Produits laitiers', 280, 18.5, 1.9, 1.9, 21.6, 0.0, 0.30, 'C', false),

-- Féculents
('Riz blanc cuit', 'Féculents', 130, 2.7, 28.7, 0.1, 0.3, 0.4, 0.01, 'B', false),
('Pâtes cuites', 'Féculents', 158, 5.8, 30.9, 0.6, 0.9, 1.8, 0.01, 'B', false),
('Pain complet', 'Féculents', 247, 8.5, 46.0, 4.0, 2.9, 7.0, 0.55, 'B', false),
('Pomme de terre', 'Féculents', 77, 2.0, 17.5, 0.8, 0.1, 2.2, 0.01, 'A', false),
('Lentilles cuites', 'Féculents', 116, 9.0, 20.1, 1.8, 0.4, 7.9, 0.01, 'A', false),
('Pois chiches cuits', 'Féculents', 164, 8.9, 27.4, 4.8, 2.6, 7.6, 0.01, 'A', false),
('Flocons d''avoine', 'Féculents', 389, 17.0, 66.3, 1.1, 7.0, 10.6, 0.01, 'A', false),
('Quinoa cuit', 'Féculents', 120, 4.4, 21.3, 0.9, 1.9, 2.8, 0.01, 'A', false),

-- Matières grasses
('Huile d''olive', 'Matières grasses', 884, 0.0, 0.0, 0.0, 100.0, 0.0, 0.01, 'D', false),
('Beurre', 'Matières grasses', 717, 0.6, 0.1, 0.1, 81.1, 0.0, 0.04, 'D', false),
('Huile de coco', 'Matières grasses', 862, 0.0, 0.0, 0.0, 100.0, 0.0, 0.01, 'D', false),

-- Légumineuses & protéines végétales
('Tofu', 'Épicerie', 76, 8.0, 1.9, 0.3, 4.8, 0.3, 0.01, 'A', false),
('Tempeh', 'Épicerie', 192, 19.0, 9.4, 0.0, 10.8, 0.0, 0.01, 'A', false),

-- Épicerie courante
('Farine de blé T55', 'Épicerie', 364, 10.0, 76.3, 0.3, 1.0, 2.7, 0.01, 'C', false),
('Sucre blanc', 'Épicerie', 400, 0.0, 100.0, 100.0, 0.0, 0.0, 0.01, 'E', false),
('Chocolat noir 70%', 'Épicerie', 598, 6.0, 45.9, 28.0, 42.6, 11.9, 0.01, 'C', false),
('Miel', 'Épicerie', 304, 0.3, 82.4, 82.1, 0.0, 0.2, 0.01, 'C', false),

-- Boissons
('Eau minérale', 'Boissons', 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.01, 'A', false),
('Jus d''orange', 'Boissons', 45, 0.7, 10.4, 8.4, 0.2, 0.2, 0.01, 'C', false);
