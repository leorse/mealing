package com.mealing.config;

import com.mealing.ingredient.IngredientEntity;
import com.mealing.ingredient.IngredientRepository;
import com.mealing.restaurant.DishTemplate;
import com.mealing.restaurant.DishTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Insère les données de référence au premier démarrage (table vide).
 * Remplace les migrations Flyway V2/V3/V7 pour SQLite.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final IngredientRepository ingredientRepository;
    private final DishTemplateRepository dishTemplateRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedIngredients();
        seedDishTemplates();
    }

    // -------------------------------------------------------------------------
    // Ingrédients de base
    // -------------------------------------------------------------------------

    private void seedIngredients() {
        if (ingredientRepository.count() > 0) return;
        log.info("[Seeder] Insertion des ingrédients de base...");

        List<IngredientEntity> seeds = List.of(
            // Légumes
            ing("Tomate",              "Légumes",            18,  0.9,  3.5,  3.2,  0.2, 0.0, 1.2, 0.01, "A"),
            ing("Carotte",             "Légumes",            41,  0.9,  9.6,  4.7,  0.2, 0.0, 2.8, 0.07, "A"),
            ing("Courgette",           "Légumes",            17,  1.2,  3.1,  2.5,  0.3, 0.0, 1.0, 0.01, "A"),
            ing("Brocoli",             "Légumes",            34,  2.8,  7.0,  1.7,  0.4, 0.0, 2.6, 0.04, "A"),
            ing("Épinards",            "Légumes",            23,  2.9,  3.6,  0.4,  0.4, 0.0, 2.2, 0.08, "A"),
            ing("Poivron rouge",       "Légumes",            31,  1.0,  6.0,  4.2,  0.3, 0.0, 2.1, 0.02, "A"),
            ing("Oignon",              "Légumes",            40,  1.1,  9.3,  4.2,  0.1, 0.0, 1.7, 0.01, "A"),
            ing("Ail",                 "Légumes",           149,  6.4, 33.1,  1.0,  0.5, 0.0, 2.1, 0.02, "A"),
            ing("Concombre",           "Légumes",            16,  0.7,  3.6,  1.7,  0.1, 0.0, 0.5, 0.01, "A"),
            ing("Salade verte",        "Légumes",            15,  1.4,  2.2,  0.6,  0.2, 0.0, 1.3, 0.03, "A"),
            // Fruits
            ing("Pomme",               "Fruits",             52,  0.3, 13.8, 10.4,  0.2, 0.0, 2.4, 0.01, "A"),
            ing("Banane",              "Fruits",             89,  1.1, 22.8, 12.2,  0.3, 0.0, 2.6, 0.01, "B"),
            ing("Orange",              "Fruits",             47,  0.9, 11.8,  9.4,  0.1, 0.0, 2.4, 0.01, "A"),
            ing("Fraise",              "Fruits",             32,  0.7,  7.7,  4.9,  0.3, 0.0, 2.0, 0.01, "A"),
            ing("Avocat",              "Fruits",            160,  2.0,  8.5,  0.7, 14.7, 0.0, 6.7, 0.01, "A"),
            // Viandes & Poissons
            ing("Poulet (blanc)",      "Viandes & Poissons",165, 31.0,  0.0,  0.0,  3.6, 0.0, 0.0, 0.07, "B"),
            ing("Boeuf haché 5%",      "Viandes & Poissons",137, 21.4,  0.0,  0.0,  5.6, 0.0, 0.0, 0.07, "B"),
            ing("Saumon",              "Viandes & Poissons",208, 20.4,  0.0,  0.0, 13.4, 0.0, 0.0, 0.05, "A"),
            ing("Thon (en conserve)",  "Viandes & Poissons",116, 25.5,  0.0,  0.0,  1.0, 0.0, 0.0, 0.40, "B"),
            ing("Oeuf",                "Viandes & Poissons",155, 13.0,  1.1,  1.1, 11.0, 0.0, 0.0, 0.14, "B"),
            ing("Crevettes",           "Viandes & Poissons", 99, 20.9,  0.9,  0.0,  1.1, 0.0, 0.0, 0.55, "A"),
            // Produits laitiers
            ing("Lait entier",         "Produits laitiers",  61,  3.2,  4.8,  4.8,  3.3, 0.0, 0.0, 0.05, "B"),
            ing("Yaourt nature",       "Produits laitiers",  59,  3.5,  4.7,  4.7,  3.3, 0.0, 0.0, 0.08, "B"),
            ing("Fromage blanc 0%",    "Produits laitiers",  46,  8.0,  4.0,  4.0,  0.1, 0.0, 0.0, 0.05, "A"),
            ing("Emmental",            "Produits laitiers", 380, 28.8,  0.0,  0.0, 29.0, 0.0, 0.0, 0.45, "C"),
            ing("Mozzarella",          "Produits laitiers", 280, 18.5,  1.9,  1.9, 21.6, 0.0, 0.0, 0.30, "C"),
            // Féculents
            ing("Riz blanc cuit",      "Féculents",         130,  2.7, 28.7,  0.1,  0.3, 0.0, 0.4, 0.01, "B"),
            ing("Pâtes cuites",        "Féculents",         158,  5.8, 30.9,  0.6,  0.9, 0.0, 1.8, 0.01, "B"),
            ing("Pain complet",        "Féculents",         247,  8.5, 46.0,  4.0,  2.9, 0.0, 7.0, 0.55, "B"),
            ing("Pomme de terre",      "Féculents",          77,  2.0, 17.5,  0.8,  0.1, 0.0, 2.2, 0.01, "A"),
            ing("Lentilles cuites",    "Féculents",         116,  9.0, 20.1,  1.8,  0.4, 0.0, 7.9, 0.01, "A"),
            ing("Pois chiches cuits",  "Féculents",         164,  8.9, 27.4,  4.8,  2.6, 0.0, 7.6, 0.01, "A"),
            ing("Flocons d'avoine",    "Féculents",         389, 17.0, 66.3,  1.1,  7.0, 0.0,10.6, 0.01, "A"),
            ing("Quinoa cuit",         "Féculents",         120,  4.4, 21.3,  0.9,  1.9, 0.0, 2.8, 0.01, "A"),
            // Matières grasses
            ing("Huile d'olive",       "Matières grasses",  884,  0.0,  0.0,  0.0,100.0, 0.0, 0.0, 0.01, "D"),
            ing("Beurre",              "Matières grasses",  717,  0.6,  0.1,  0.1, 81.1, 0.0, 0.0, 0.04, "D"),
            ing("Huile de coco",       "Matières grasses",  862,  0.0,  0.0,  0.0,100.0, 0.0, 0.0, 0.01, "D"),
            // Épicerie / protéines végétales
            ing("Tofu",                "Épicerie",           76,  8.0,  1.9,  0.3,  4.8, 0.0, 0.3, 0.01, "A"),
            ing("Tempeh",              "Épicerie",          192, 19.0,  9.4,  0.0, 10.8, 0.0, 0.0, 0.01, "A"),
            ing("Farine de blé T55",   "Épicerie",          364, 10.0, 76.3,  0.3,  1.0, 0.0, 2.7, 0.01, "C"),
            ing("Sucre blanc",         "Épicerie",          400,  0.0,100.0,100.0,  0.0, 0.0, 0.0, 0.01, "E"),
            ing("Chocolat noir 70%",   "Épicerie",          598,  6.0, 45.9, 28.0, 42.6, 0.0,11.9, 0.01, "C"),
            ing("Miel",                "Épicerie",          304,  0.3, 82.4, 82.1,  0.0, 0.0, 0.2, 0.01, "C"),
            // Boissons
            ing("Eau minérale",        "Boissons",            0,  0.0,  0.0,  0.0,  0.0, 0.0, 0.0, 0.01, "A"),
            ing("Jus d'orange",        "Boissons",           45,  0.7, 10.4,  8.4,  0.2, 0.0, 0.2, 0.01, "C")
        );

        ingredientRepository.saveAll(seeds);
        log.info("[Seeder] {} ingrédients insérés.", seeds.size());
    }

    private IngredientEntity ing(String name, String category, double cal,
                                  double prot, double carbs, double sugars,
                                  double fat, double satFat, double fiber,
                                  double salt, String nutri) {
        return IngredientEntity.builder()
            .name(name).category(category)
            .calories100g(bd(cal)).proteins100g(bd(prot)).carbs100g(bd(carbs))
            .sugars100g(bd(sugars)).fat100g(bd(fat)).saturatedFat100g(bd(satFat))
            .fiber100g(bd(fiber)).salt100g(bd(salt))
            .nutriScore(nutri).isCustom(false).source("SEED")
            .build();
    }

    // -------------------------------------------------------------------------
    // Gabarits restaurant
    // -------------------------------------------------------------------------

    private void seedDishTemplates() {
        if (dishTemplateRepository.count() > 0) return;
        log.info("[Seeder] Insertion des gabarits restaurant...");

        List<DishTemplate> seeds = List.of(
            // Viandes
            dt("Steak-frites",           "MEAT",    "FRENCH",   650, 850,1050, 45.0, 65.0, 38.0),
            dt("Entrecôte grillée",      "MEAT",    "FRENCH",   400, 550, 700, 52.0,  0.0, 32.0),
            dt("Magret de canard",       "MEAT",    "FRENCH",   400, 550, 700, 38.0,  5.0, 38.0),
            dt("Poulet rôti (demi)",     "MEAT",    "FRENCH",   350, 480, 600, 45.0,  2.0, 28.0),
            dt("Côtelette de porc",      "MEAT",    "FRENCH",   300, 420, 540, 38.0,  0.0, 22.0),
            dt("Escalope milanaise",     "MEAT",    "ITALIAN",  450, 600, 750, 40.0, 30.0, 28.0),
            dt("Osso buco",              "MEAT",    "ITALIAN",  400, 550, 700, 42.0,  8.0, 28.0),
            dt("Tajine agneau",          "MEAT",    "MOROCCAN", 450, 620, 800, 38.0, 25.0, 32.0),
            dt("Couscous royal",         "MEAT",    "MOROCCAN", 700, 900,1100, 50.0, 80.0, 30.0),
            dt("Gyros / Kebab",          "MEAT",    "GREEK",    500, 700, 900, 35.0, 55.0, 32.0),
            dt("Poulet tikka masala",    "MEAT",    "INDIAN",   400, 550, 700, 38.0, 20.0, 28.0),
            dt("Boeuf bourguignon",      "MEAT",    "FRENCH",   400, 550, 700, 42.0, 18.0, 24.0),
            // Poissons
            dt("Saumon grillé",          "FISH",    "FRENCH",   280, 380, 480, 40.0,  0.0, 18.0),
            dt("Sole meunière",          "FISH",    "FRENCH",   250, 350, 450, 35.0,  5.0, 16.0),
            dt("Crevettes sautées",      "FISH",    "FRENCH",   200, 280, 360, 28.0,  5.0, 12.0),
            dt("Sushi plateau (10p)",    "FISH",    "JAPANESE", 280, 380, 480, 20.0, 55.0,  8.0),
            dt("Ramen poulet",           "FISH",    "JAPANESE", 450, 600, 750, 30.0, 70.0, 18.0),
            dt("Fish and chips",         "FISH",    "ENGLISH",  600, 800,1000, 30.0, 70.0, 40.0),
            dt("Paella",                 "FISH",    "SPANISH",  400, 550, 700, 28.0, 62.0, 14.0),
            // Pizzas / Pâtes
            dt("Pizza margherita",       "PIZZA",   "ITALIAN",  520, 700, 900, 25.0, 88.0, 22.0),
            dt("Pizza 4 fromages",       "PIZZA",   "ITALIAN",  600, 800,1000, 32.0, 85.0, 32.0),
            dt("Pizza jambon champignons","PIZZA",  "ITALIAN",  550, 730, 920, 28.0, 86.0, 24.0),
            dt("Pasta carbonara",        "PASTA",   "ITALIAN",  550, 720, 900, 28.0, 68.0, 28.0),
            dt("Pasta bolognaise",       "PASTA",   "ITALIAN",  500, 680, 850, 30.0, 70.0, 22.0),
            dt("Pasta pesto",            "PASTA",   "ITALIAN",  480, 640, 800, 18.0, 72.0, 22.0),
            dt("Risotto champignons",    "PASTA",   "ITALIAN",  400, 540, 680, 12.0, 72.0, 18.0),
            dt("Lasagnes bolognaise",    "PASTA",   "ITALIAN",  450, 600, 750, 28.0, 50.0, 28.0),
            // Burgers / Fast food
            dt("Burger classique",       "BURGER",  "AMERICAN", 500, 650, 800, 32.0, 45.0, 32.0),
            dt("Burger double",          "BURGER",  "AMERICAN", 650, 850,1050, 48.0, 48.0, 44.0),
            dt("Burger végétarien",      "BURGER",  "AMERICAN", 420, 560, 700, 20.0, 52.0, 22.0),
            dt("Hot dog",                "BURGER",  "AMERICAN", 350, 460, 580, 18.0, 38.0, 24.0),
            dt("Club sandwich",          "SANDWICH","AMERICAN", 400, 530, 660, 28.0, 40.0, 24.0),
            // Cuisine asiatique
            dt("Pad thaï crevettes",     "NOODLES", "THAI",     420, 560, 700, 24.0, 68.0, 14.0),
            dt("Riz cantonais",          "RICE",    "CHINESE",  350, 480, 600, 18.0, 62.0, 14.0),
            dt("Porc laqué + riz",       "RICE",    "CHINESE",  450, 600, 750, 28.0, 65.0, 18.0),
            dt("Nems (3 pièces)",        "STARTER", "VIETNAMESE",200,270, 340, 10.0, 28.0, 14.0),
            dt("Bò bún",                 "NOODLES", "VIETNAMESE",350,470, 590, 25.0, 55.0, 12.0),
            dt("Curry vert poulet",      "RICE",    "THAI",     480, 640, 800, 32.0, 68.0, 18.0),
            // Salades & végétarien
            dt("Salade César poulet",    "SALAD",   "AMERICAN", 350, 450, 580, 32.0, 18.0, 22.0),
            dt("Salade niçoise",         "SALAD",   "FRENCH",   280, 380, 480, 22.0, 20.0, 18.0),
            dt("Salade grecque",         "SALAD",   "GREEK",    250, 340, 430, 12.0, 14.0, 22.0),
            dt("Quiche lorraine",        "SAVORY_PIE","FRENCH", 320, 430, 540, 18.0, 25.0, 28.0),
            dt("Omelette nature",        "EGG",     "FRENCH",   200, 270, 340, 18.0,  2.0, 18.0),
            dt("Omelette fromage",       "EGG",     "FRENCH",   280, 380, 480, 22.0,  2.0, 28.0),
            dt("Gratin dauphinois",      "VEGGIE",  "FRENCH",   280, 380, 480,  8.0, 32.0, 20.0),
            dt("Ratatouille",            "VEGGIE",  "FRENCH",   120, 160, 200,  4.0, 18.0,  6.0),
            dt("Falafel + houmous",      "VEGGIE",  "MIDDLE_EAST",380,510,640, 18.0, 52.0, 18.0),
            // Entrées
            dt("Soupe à l'oignon",       "SOUP",    "FRENCH",   150, 200, 260,  8.0, 22.0,  8.0),
            dt("Velouté de poireaux",    "SOUP",    "FRENCH",   100, 140, 180,  4.0, 14.0,  6.0),
            dt("Foie gras (toast)",      "STARTER", "FRENCH",   200, 270, 340,  8.0, 12.0, 20.0),
            dt("Escargots (6)",          "STARTER", "FRENCH",   120, 160, 200, 12.0,  2.0, 10.0),
            dt("Carpaccio de boeuf",     "STARTER", "ITALIAN",  150, 200, 260, 18.0,  2.0, 10.0),
            // Desserts
            dt("Crème brûlée",           "DESSERT", "FRENCH",   200, 270, 340,  5.0, 28.0, 14.0),
            dt("Mousse au chocolat",     "DESSERT", "FRENCH",   220, 300, 380,  6.0, 28.0, 18.0),
            dt("Tarte tatin",            "DESSERT", "FRENCH",   280, 380, 480,  4.0, 52.0, 18.0),
            dt("Tiramisu",               "DESSERT", "ITALIAN",  250, 340, 430,  6.0, 35.0, 18.0),
            dt("Panna cotta",            "DESSERT", "ITALIAN",  180, 240, 300,  4.0, 22.0, 14.0),
            dt("Glace (2 boules)",       "DESSERT", "FRENCH",   150, 200, 260,  4.0, 28.0,  8.0),
            // Boissons
            dt("Bière (33cl)",           "DRINK",   null,       140, 140, 200,  1.0, 12.0,  0.0),
            dt("Vin rouge (15cl)",       "DRINK",   null,       120, 120, 170,  0.1,  4.0,  0.0),
            dt("Vin blanc (15cl)",       "DRINK",   null,       110, 110, 155,  0.1,  3.0,  0.0),
            dt("Coca-Cola (33cl)",       "DRINK",   null,       139, 139, 139,  0.0, 35.0,  0.0),
            dt("Café (expresso)",        "DRINK",   null,         5,   5,   5,  0.3,  0.5,  0.1),
            dt("Jus de fruits (25cl)",   "DRINK",   null,       112, 112, 160,  1.0, 26.0,  0.0)
        );

        dishTemplateRepository.saveAll(seeds);
        log.info("[Seeder] {} gabarits restaurant insérés.", seeds.size());
    }

    private DishTemplate dt(String name, String category, String restaurantType,
                             int small, int normal, int large,
                             double prot, double carbs, double fat) {
        return DishTemplate.builder()
            .name(name).category(category).restaurantType(restaurantType)
            .caloriesSmall(small).caloriesNormal(normal).caloriesLarge(large)
            .proteinsNormal(bd(prot)).carbsNormal(bd(carbs)).fatNormal(bd(fat))
            .source("estimation")
            .build();
    }

    private BigDecimal bd(double v) {
        return BigDecimal.valueOf(v);
    }
}
