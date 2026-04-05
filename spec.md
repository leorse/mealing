# Mealing — Spécifications Techniques & Fonctionnelles

> Version 2.0 — Avril 2026  
> Application de planification des repas et suivi nutritionnel

---

## Table des matières

1. [Vision du produit](#1-vision-du-produit)
2. [Périmètre fonctionnel](#2-périmètre-fonctionnel)
3. [Architecture technique](#3-architecture-technique)
4. [Backend — Spring Boot](#4-backend--spring-boot)
5. [Frontend — React Native (Expo)](#5-frontend--react-native-expo)
6. [Base de données](#6-base-de-données)
7. [API REST](#7-api-rest)
8. [Module nutritionnel](#8-module-nutritionnel)
9. [Module graphiques & analytics](#9-module-graphiques--analytics)
10. [Export PDF](#10-export-pdf)
11. [Sécurité & authentification](#11-sécurité--authentification)
12. [Outil OFF Catalog](#12-outil-off-catalog)
13. [Roadmap & état d'avancement](#13-roadmap--état-davancement)

---

## 1. Vision du produit

**Mealing** est une application mobile locale permettant à l'utilisateur de :

- Planifier ses repas à la semaine
- Générer automatiquement sa liste de courses
- Suivre ses apports nutritionnels (calories, macros)
- Gérer les écarts alimentaires (plats préparés, restaurant, extras)
- Visualiser ses tendances via des graphiques
- Exporter ses bilans nutritionnels en PDF

### Contraintes & orientations

| Critère | Valeur |
|---|---|
| Plateforme cible | Android — React Native (Expo) |
| Fonctionnement web | Possible via `npx expo start --web` |
| Multi-utilisateur | Non — application mono-compte locale |
| Open Food Facts | Catalogue SQLite local (`off_catalog.db`) — pas d'API externe |
| Connexion internet | Non requise (hors connexion JWT initiale) |
| Export PDF | In scope |
| Graphiques (jour / semaine / mois) | In scope |

---

## 2. Périmètre fonctionnel

### 2.1 Gestion du profil utilisateur

- Saisie des données personnelles : prénom, âge, sexe, taille, poids
- Calcul automatique du BMR (Mifflin-St Jeor) et du TDEE selon le niveau d'activité physique
- Définition de l'objectif : perte / maintien / prise de masse
- Objectif calorique journalier calculé automatiquement
- Répartition macro personnalisable (protéines / glucides / lipides en %)

### 2.2 Base de données d'ingrédients

- Stockage local d'aliments avec valeurs nutritionnelles pour 100 g :
  - Calories (kcal), Protéines, Glucides dont sucres, Lipides dont saturés, Fibres, Sel
  - Indice glycémique (IG) — quand disponible
  - Nutri-Score (A à E) — quand disponible
- Champ `source` sur chaque ingrédient : `CIQUAL` | `OFF` | `MANUAL` (null = manuel)

#### Sources d'ingrédients

| Source | Description | Recherche |
|---|---|---|
| `CIQUAL` | Base ANSES (~3 000 aliments génériques FR) | Mode "Générique" dans la recherche |
| `OFF` | Open Food Facts — produits de marque | Mode "Marque (OFF)" — nécessite `off_catalog.db` |
| `MANUAL` | Saisi manuellement par l'utilisateur | Inclus dans les deux modes |

#### Recherche d'ingrédients (écran unifié avec toggle)

L'écran de recherche propose deux modes via `SegmentedButtons` :
- **Générique** : recherche dans `/api/ingredients?q=` (base locale = Ciqual + ingrédients manuels). Les résultats affichent un badge "Disponible" — ils sont déjà dans la base, pas besoin de les importer.
- **Marque (OFF)** : recherche dans `/api/off-catalog/search?q=` (catalogue SQLite OFF). Les résultats ont un bouton "Ajouter" pour les importer dans la base locale.

#### Base Ciqual

- Import depuis les paramètres de l'application (connexion internet requise)
- Télécharge le CSV officiel ANSES (~2 Mo) et insère dans la table `ingredients` avec `source = 'CIQUAL'`
- Import asynchrone (arrière-plan), statut visible dans les paramètres
- Ré-importable pour mise à jour (upsert par `off_id = CIQUAL_<code>`)
- Statut dans les paramètres : nombre d'aliments importés + résultat du dernier import

#### Catalogue Open Food Facts local (`off_catalog.db`)

- Fichier SQLite généré par `tools/off-import/` depuis le dump JSONL OFF
- Si absent : mode "Marque" désactivé, seule la base locale est utilisable
- Si présent : recherche textuelle sur nom, nom_fr, marque (LIMIT 30)
- Statut affiché dans les paramètres (présent/absent + nombre de produits)

#### Autres actions
- Import par code-barres EAN depuis le catalogue local
- Création manuelle d'un ingrédient
- Catégories : Légumes, Fruits, Viandes & poissons, Produits laitiers, Féculents, Matières grasses, Boissons, Épicerie, Autres

### 2.3 Gestion des recettes

- CRUD recettes : nom, description, nb de portions, temps de préparation/cuisson, difficulté
- Ajout d'ingrédients avec quantité en grammes ou unités
- Calcul automatique des valeurs nutritionnelles totales et par portion
- Tags (JSONB) et champ `nutritionOverride` pour forcer les macros
- **Import JSON** : endpoint `POST /api/recipes/import` acceptant un JSON structuré
  - Résolution en cascade : correspondance exacte → fuzzy LIKE → barcode catalogue → barcode OFF
  - Retourne `status` (SUCCESS / PARTIAL_SUCCESS / FAILED), `resolvedCount`, liste des ingrédients non résolus
  - Frontend : écran de résolution manuelle pour les ingrédients non trouvés
- Historique des recettes utilisées

### 2.4 Planning hebdomadaire

- Vue calendrier de la semaine en cours (lundi → dimanche)
- 4 créneaux par jour : Petit-déjeuner, Déjeuner, Dîner, Collation
- Ajout d'un repas : recette / plat préparé / repas restaurant / saisie libre
- `source_type` par créneau : `RECIPE` / `PREPARED_MEAL` / `RESTAURANT` / `FREE`
- Affichage du total calorique du jour en temps réel
- Indicateur visuel : vert (±10%), orange (léger écart), rouge (dépassement)
- Navigation entre les semaines (historique + planification future)
- Copier/coller une semaine vers une autre semaine

### 2.5 Liste de courses

- Génération automatique depuis le planning de la semaine sélectionnée
- Regroupement des ingrédients par catégorie (rayon)
- Dédoublonnage et agrégation des quantités
- Ajout manuel d'articles hors recette
- Cochage au fur et à mesure
- Export de la liste en texte ou PDF

### 2.6 Suivi nutritionnel & gestion des écarts

- Validation quotidienne des repas (consommé ou modifié)
- Différence planning vs. réel tracée
- Saisie du poids du jour (optionnel)

#### Écart prévu / imprévu
- Marquage d'un créneau comme écart avec estimation manuelle des calories
- Calcul du surplus et suggestions de compensation sur J+1 / J+2
- Historique des écarts

### 2.7 Plats préparés (Prepared Meals)

- Création d'un plat préparé : nom, marque, calories/portion, macros, nb de portions
- Import depuis le catalogue OFF par code-barres EAN
- Favoris (flag `is_favorite`)
- Association à un créneau du planning (`source_type = PREPARED_MEAL`, nb de portions consommées)
- 8 endpoints CRUD + `POST /from-barcode/{ean}` + `PUT /{id}/favorite`

### 2.8 Extras de repas (Meal Extras)

- Ajout d'extras à un créneau existant (boisson, dessert, sauce…)
- 3 modes :
  - `INGREDIENT` : lié à un ingrédient de la base locale
  - `PREPARED` : lié à un plat préparé
  - `FREE` : saisie libre en kcal
- Calcul du total nutritionnel créneau + extras via `GET /api/meal-slots/{slotId}/nutrition-total`

### 2.9 Repas restaurant (Restaurant Meals)

- Base de gabarits de plats (`dish_templates`) : ~70 plats typiques (français, italien, japonais, chinois, etc.) avec calories estimées
- 3 méthodes de saisie d'un repas restaurant :
  - `FREE` : saisie directe en kcal
  - `GUIDED` : sélection de gabarits depuis la liste (recherche par nom/catégorie)
  - `RECONSTRUCTED` : reconstruction ingrédient par ingrédient
- Recherche de gabarits : `GET /api/dish-templates?q=&category=`
- Calcul du total nutritionnel du repas

---

## 3. Architecture technique

```
mealing/
├── mealing-backend/          # Spring Boot API
│   ├── src/main/java/com/mealing/
│   │   ├── auth/             # JWT, sécurité
│   │   ├── user/             # Profil, objectifs
│   │   ├── ingredient/       # BDD aliments + import OFF catalogue
│   │   ├── recipe/           # Recettes + import JSON
│   │   ├── mealplan/         # Planning semaine
│   │   ├── preparedmeal/     # Plats préparés
│   │   ├── mealextra/        # Extras de repas
│   │   ├── restaurant/       # Gabarits + repas restaurant
│   │   ├── offcatalog/       # Lecture du catalogue SQLite OFF
│   ├── ciqual/           # Import base ANSES Ciqual (CSV)
│   │   ├── shoppinglist/     # Liste de courses
│   │   ├── nutrition/        # Calculs, historique
│   │   ├── export/           # Génération PDF
│   │   └── config/           # CORS, security, OpenAPI, GlobalExceptionHandler
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/     # V1 à V8 Flyway
│
├── mealing-mobile/           # React Native (Expo)
│   ├── app/                  # Expo Router (file-based routing)
│   │   ├── (tabs)/           # Onglets principaux
│   │   ├── auth/
│   │   ├── ingredients/
│   │   ├── recipes/
│   │   ├── meal-slots/
│   │   ├── prepared-meals/
│   │   └── restaurant-meals/
│   └── src/
│       ├── api/              # Clients Axios
│       └── store/            # Zustand stores
│
├── tools/
│   └── off-import/           # Outil Java standalone (fat JAR)
│       ├── pom.xml
│       └── src/main/java/OffImporter.java
│
└── off_catalog.db            # Catalogue OFF SQLite (généré manuellement)
```

### Décisions d'architecture

| Composant | Choix | Justification |
|---|---|---|
| Backend | Spring Boot 3.2.4 / Java 21 | Robuste, ecosystème riche, JPA natif |
| BDD principale | PostgreSQL 15 (Flyway) | Requêtes analytiques, JSON natif |
| BDD catalogue OFF | SQLite (`off_catalog.db`) | Local, lecture seule, ~60M produits |
| ORM | Spring Data JPA / Hibernate | Standard Spring |
| Auth | JWT (Bearer token, HS256) | Stateless, mobile-friendly |
| API doc | SpringDoc OpenAPI 3 (Swagger) | Documentation auto-générée |
| Mobile | React Native 0.73 + Expo SDK 51 | Android ciblé, accès caméra |
| Routing mobile | Expo Router (file-based) | Standard Expo, similaire Next.js |
| State | Zustand | Léger, simple |
| HTTP client | Axios | Intercepteurs JWT |
| Erreurs OFF | GlobalExceptionHandler → `{ error, status, timestamp }` | Propagation propre vers le frontend |

---

## 4. Backend — Spring Boot

### 4.1 Dépendances Maven principales

```xml
<!-- Spring -->
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-validation
spring-boot-starter-webflux      <!-- WebClient (plus utilisé activement) -->
spring-boot-starter-thymeleaf    <!-- templates PDF -->

<!-- Base de données -->
postgresql
flyway-core
sqlite-jdbc (3.45.3.0)           <!-- lecture off_catalog.db -->
<!-- Pas de dépendance supplémentaire pour Ciqual : CSV parsé avec java.net.http + BufferedReader -->

<!-- Auth -->
jjwt-api / jjwt-impl / jjwt-jackson (0.12.5)

<!-- PDF -->
openhtmltopdf-pdfbox (1.0.10)

<!-- Outils -->
lombok (1.18.34)
springdoc-openapi-starter-webmvc-ui (2.3.0)
```

### 4.2 Configuration `application.yml`

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/mealing}
    username: ${DB_USER:mealing}
    password: ${DB_PASSWORD:mealing}
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

mealing:
  jwt:
    secret: ${JWT_SECRET:mealingSecretKey_ChangeInProduction_AtLeast256BitsLong!!}
    expiration: 86400000
  nutrition:
    default-tdee-multiplier: 1.55
  open-food-facts:
    base-url: https://world.openfoodfacts.org/api/v2
    timeout: 5000
  off-catalog:
    path: ${OFF_CATALOG_PATH:off_catalog.db}   # chemin relatif à user.dir ou absolu

server:
  port: 8080
```

### 4.3 Structure des packages

```
com.mealing/
├── auth/
│   ├── AuthController.java
│   ├── AuthService.java
│   └── JwtService.java
│
├── user/
│   ├── UserController.java (profil)
│   ├── UserService.java
│   └── UserEntity.java / UserProfile.java
│
├── ingredient/
│   ├── IngredientController.java
│   ├── IngredientService.java
│   ├── IngredientEntity.java
│   ├── IngredientRepository.java
│   └── OpenFoodFactsClient.java   # WebClient (backup barcode)
│
├── recipe/
│   ├── RecipeController.java
│   ├── RecipeService.java
│   ├── RecipeEntity.java          # + tags (jsonb), nutritionOverride
│   ├── RecipeIngredient.java      # + isResolved
│   ├── RecipeRepository.java
│   ├── RecipeIngredientRepository.java
│   ├── RecipeImportService.java   # résolution cascade
│   └── dto/
│       ├── RecipeImportRequest.java
│       └── RecipeImportResponse.java
│
├── mealplan/
│   ├── MealPlanController.java
│   ├── MealPlanService.java       # + getSlotById(), getSlotNutrition()
│   ├── WeekPlan.java
│   └── MealSlot.java              # + preparedMeal, preparedMealPortions, sourceType
│
├── preparedmeal/
│   ├── PreparedMealController.java   # 8 endpoints
│   ├── PreparedMealService.java
│   ├── PreparedMeal.java
│   └── PreparedMealRepository.java
│
├── mealextra/
│   ├── MealExtraController.java   # + GET /nutrition-total
│   ├── MealExtraService.java
│   ├── MealExtra.java             # extraType: INGREDIENT / PREPARED / FREE
│   └── MealExtraRepository.java
│
├── restaurant/
│   ├── RestaurantMealController.java
│   ├── RestaurantMealService.java  # computeTotal() FREE/GUIDED/RECONSTRUCTED
│   ├── DishTemplate.java           # ~70 gabarits seedés en V7
│   ├── RestaurantMeal.java
│   └── RestaurantMealIngredient.java
│
├── offcatalog/
│   ├── OffCatalogController.java   # GET /status, GET /search?q=
│   └── OffCatalogService.java      # @PostConstruct init, search()
│
├── ciqual/
│   ├── CiqualController.java       # GET /status, POST /import
│   └── CiqualService.java          # téléchargement CSV ANSES, parsing, upsert batch
│
├── shoppinglist/
│   ├── ShoppingListController.java
│   └── ShoppingListService.java
│
├── nutrition/
│   └── NutritionController.java / NutritionService.java
│
├── export/
│   └── PdfExportService.java
│
└── config/
    ├── SecurityConfig.java
    ├── CorsConfig.java
    └── GlobalExceptionHandler.java  # @RestControllerAdvice → { error, status, timestamp }
```

### 4.4 Migrations Flyway

| Version | Contenu |
|---|---|
| V1 | Tables de base : users, user_profiles, ingredients, recipes, recipe_ingredients, week_plans, meal_slots, shopping_lists, shopping_items, daily_logs, deviations |
| V2 | Seeds ingrédients courants |
| V3 | ... |
| V4 | ... |
| V5 | `prepared_meals` + alter `meal_slots` (prepared_meal_id, prepared_meal_portions, source_type) |
| V6 | `meal_extras` (id, meal_slot_id, extra_type, ingredient_id, prepared_meal_id, calories_free, label, quantity_g) |
| V7 | `dish_templates` + `restaurant_meals` + `restaurant_meal_ingredients` + ~70 seeds de plats |
| V8 | Alter `recipes` : add `tags`, `nutrition_override` ; alter `recipe_ingredients` : add `is_resolved` |
| V9 | Alter `ingredients` : add `source VARCHAR(20)` ; backfill `CIQUAL` pour les seeds, `OFF` pour les imports OFF |

---

## 5. Frontend — React Native (Expo)

### 5.1 Structure des écrans (Expo Router)

```
app/
├── auth/
│   ├── login.tsx
│   └── register.tsx
│
├── (tabs)/                        # Bottom Tab Navigator
│   ├── _layout.tsx                # 5 onglets
│   ├── index.tsx                  # Accueil / Planning semaine
│   ├── suivi.tsx                  # Suivi nutritionnel
│   ├── courses.tsx                # Liste de courses
│   ├── ingredients.tsx            # Gestion ingrédients (FAB: OFF search / manuel)
│   ├── prepared.tsx               # → redirect prepared-meals/
│   └── settings.tsx               # Paramètres + statut catalogue OFF
│
├── ingredients/
│   ├── off-search.tsx             # Recherche dans le catalogue OFF local
│   ├── new.tsx                    # Créer ingrédient manuellement
│   └── [id].tsx                   # Détail / édition ingrédient
│
├── recipes/
│   ├── index.tsx                  # Liste recettes
│   ├── new.tsx                    # Créer recette
│   ├── [id].tsx                   # Détail recette
│   ├── [id]/edit.tsx              # Éditer recette
│   └── import.tsx                 # Import JSON + résolution ingrédients
│
├── meal-slots/
│   ├── _layout.tsx
│   └── [id].tsx                   # Détail créneau + extras + AddExtraModal
│
├── prepared-meals/
│   ├── _layout.tsx
│   ├── index.tsx                  # Liste plats préparés
│   ├── new.tsx                    # Créer plat préparé
│   └── [id].tsx                   # Détail / édition
│
└── restaurant-meals/
    ├── _layout.tsx
    ├── new.tsx                    # 4 étapes : info → méthode → détails → résumé
    └── [id].tsx                   # Détail repas restaurant
```

### 5.2 Navigation — Onglets principaux

```
MainTabs (Bottom Tab Navigator)
├── Accueil      (🏠)  → Planning semaine
├── Suivi        (📊)  → Dashboard nutritionnel
├── Courses      (🛒)  → Liste de courses
├── Ingrédients  (🥦)  → Gestion base ingrédients
├── Plats        (📦)  → Plats préparés
└── Paramètres   (⚙️)  → Profil + statut catalogue OFF
```

### 5.3 State management (Zustand)

```typescript
// store/useAuthStore.ts
interface AuthStore {
  token: string | null;
  email: string | null;
  login: (email, password) => Promise<void>;
  logout: () => void;
}

// store/useIngredientStore.ts
interface IngredientStore {
  ingredients: Ingredient[];
  lastAdded: Ingredient | null;      // useFocusEffect auto-select pattern
  fetchAll: () => Promise<void>;
  addToLocal: (ing: Ingredient) => Promise<void>;
}
```

### 5.4 Clients API (`src/api/`)

| Fichier | Description |
|---|---|
| `client.ts` | Axios instance avec intercepteur JWT |
| `ingredients.ts` | CRUD ingrédients + `recipeImportApi` |
| `offCatalog.ts` | `status()`, `search(q)` → catalogue SQLite |
| `profile.ts` | Profil utilisateur + objectifs |
| `recipes.ts` | CRUD recettes |
| `mealPlan.ts` | Planning semaine |
| `preparedMeals.ts` | CRUD plats préparés |
| `mealExtras.ts` | Extras de créneaux |
| `restaurantMeals.ts` | Repas restaurant + gabarits |
| `shopping.ts` | Liste de courses |
| `nutrition.ts` | Logs journaliers, écarts |

---

## 6. Base de données

### 6.1 PostgreSQL — Schéma principal

```sql
-- Utilisateur
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- bcrypt
    created_at TIMESTAMP DEFAULT NOW()
);

-- Profil physique & objectifs
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10),           -- MALE / FEMALE / OTHER
    height_cm DECIMAL(5,1),
    weight_kg DECIMAL(5,2),
    activity_level VARCHAR(20),   -- SEDENTARY / LIGHT / MODERATE / ACTIVE / VERY_ACTIVE
    goal VARCHAR(20),             -- LOSE / MAINTAIN / GAIN
    target_calories INTEGER,
    macro_protein_pct INTEGER DEFAULT 30,
    macro_carbs_pct INTEGER DEFAULT 45,
    macro_fat_pct INTEGER DEFAULT 25,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ingrédients
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    barcode VARCHAR(50),
    category VARCHAR(50),
    calories_100g DECIMAL(7,2) NOT NULL,
    proteins_100g DECIMAL(7,2),
    carbs_100g DECIMAL(7,2),
    sugars_100g DECIMAL(7,2),
    fat_100g DECIMAL(7,2),
    saturated_fat_100g DECIMAL(7,2),
    fiber_100g DECIMAL(7,2),
    salt_100g DECIMAL(7,2),
    glycemic_index INTEGER,
    nutri_score CHAR(1),
    off_id VARCHAR(100),
    is_custom BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recettes
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    servings INTEGER DEFAULT 1,
    prep_time_min INTEGER,
    cook_time_min INTEGER,
    difficulty VARCHAR(10),       -- EASY / MEDIUM / HARD
    is_healthy BOOLEAN,
    photo_url VARCHAR(500),
    tags JSONB,                   -- ajouté V8
    nutrition_override JSONB,     -- ajouté V8 (forcer macros)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pivot recette ↔ ingrédient
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    quantity_g DECIMAL(8,2) NOT NULL,
    unit_label VARCHAR(50),
    is_resolved BOOLEAN DEFAULT TRUE   -- ajouté V8 (import JSON)
);

-- Plan de repas
CREATE TABLE week_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    notes TEXT,
    UNIQUE(user_id, week_start)
);

-- Créneau repas
CREATE TABLE meal_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_plan_id UUID REFERENCES week_plans(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL,    -- BREAKFAST / LUNCH / DINNER / SNACK
    recipe_id UUID REFERENCES recipes(id),
    free_label VARCHAR(255),
    portions DECIMAL(4,2) DEFAULT 1,
    is_deviation BOOLEAN DEFAULT FALSE,
    calories_override INTEGER,
    is_consumed BOOLEAN DEFAULT FALSE,
    consumed_at TIMESTAMP,
    -- ajoutés V5 :
    prepared_meal_id UUID REFERENCES prepared_meals(id),
    prepared_meal_portions DECIMAL(4,2) DEFAULT 1,
    source_type VARCHAR(20) DEFAULT 'RECIPE'  -- RECIPE / PREPARED_MEAL / RESTAURANT / FREE
);

-- Plats préparés (V5)
CREATE TABLE prepared_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    barcode VARCHAR(50),
    calories_per_portion DECIMAL(7,2),
    proteins_per_portion DECIMAL(7,2),
    carbs_per_portion DECIMAL(7,2),
    fat_per_portion DECIMAL(7,2),
    fiber_per_portion DECIMAL(7,2),
    servings_per_package INTEGER DEFAULT 1,
    nutri_score CHAR(1),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Extras de repas (V6)
CREATE TABLE meal_extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_slot_id UUID REFERENCES meal_slots(id) ON DELETE CASCADE,
    extra_type VARCHAR(20) NOT NULL DEFAULT 'OTHER',  -- INGREDIENT / PREPARED / FREE
    ingredient_id UUID REFERENCES ingredients(id),
    prepared_meal_id UUID REFERENCES prepared_meals(id),
    label VARCHAR(255),
    quantity_g DECIMAL(8,2),
    calories_free DECIMAL(7,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Gabarits de plats restaurant (V7)
CREATE TABLE dish_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),         -- Pizza, Burger, Sushi, etc.
    cuisine VARCHAR(50),           -- FRENCH / ITALIAN / JAPANESE / CHINESE / OTHER
    calories_estimate INTEGER,
    proteins_estimate DECIMAL(6,2),
    carbs_estimate DECIMAL(6,2),
    fat_estimate DECIMAL(6,2),
    source VARCHAR(50) DEFAULT 'CIQUAL'
);

-- Repas restaurant (V7)
CREATE TABLE restaurant_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_slot_id UUID REFERENCES meal_slots(id),
    name VARCHAR(255),
    restaurant_name VARCHAR(255),
    method VARCHAR(20),            -- FREE / GUIDED / RECONSTRUCTED
    total_calories DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ingrédients d'un repas restaurant reconstruit (V7)
CREATE TABLE restaurant_meal_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_meal_id UUID REFERENCES restaurant_meals(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    dish_template_id UUID REFERENCES dish_templates(id),
    quantity_g DECIMAL(8,2),
    label VARCHAR(255)
);

-- Log journalier
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    total_calories DECIMAL(8,2),
    total_proteins DECIMAL(8,2),
    total_carbs DECIMAL(8,2),
    total_fat DECIMAL(8,2),
    total_fiber DECIMAL(8,2),
    weight_kg DECIMAL(5,2),
    notes TEXT,
    UNIQUE(user_id, log_date)
);

-- Écarts alimentaires
CREATE TABLE deviations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deviation_date DATE NOT NULL,
    meal_slot_id UUID REFERENCES meal_slots(id),
    type VARCHAR(10) NOT NULL,     -- PLANNED / UNPLANNED
    label VARCHAR(255),
    calories_extra INTEGER NOT NULL,
    compensation_spread INTEGER DEFAULT 2,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Liste de courses
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_plan_id UUID REFERENCES week_plans(id),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    label VARCHAR(255) NOT NULL,
    quantity_g DECIMAL(8,2),
    unit_label VARCHAR(50),
    category VARCHAR(50),
    is_checked BOOLEAN DEFAULT FALSE,
    is_manual BOOLEAN DEFAULT FALSE
);
```

### 6.2 SQLite — Catalogue Open Food Facts (`off_catalog.db`)

```sql
CREATE TABLE products (
    barcode TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_fr TEXT,
    brand TEXT,
    calories_100g REAL,
    proteins_100g REAL,
    carbs_100g REAL,
    sugars_100g REAL,
    fat_100g REAL,
    saturated_fat_100g REAL,
    fiber_100g REAL,
    salt_100g REAL,
    nutri_score TEXT
);

CREATE INDEX idx_products_name ON products(name COLLATE NOCASE);
CREATE INDEX idx_products_name_fr ON products(name_fr COLLATE NOCASE);
CREATE INDEX idx_products_brand ON products(brand COLLATE NOCASE);
```

Généré par `tools/off-import/` depuis le dump JSONL OFF (~11 GB compressé).  
Critères de filtrage : `bestName()` non null ET `calories_100g > 0`.

---

## 7. API REST

### 7.1 Auth

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion → JWT |
| GET | `/api/auth/me` | Profil courant |

### 7.2 Profil utilisateur

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Récupérer le profil |
| PUT | `/api/profile` | Mettre à jour |
| GET | `/api/profile/objectives` | Objectifs calculés (BMR, TDEE, macros) |

### 7.3 Ingrédients

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/ingredients?q=` | Recherche textuelle (base locale) |
| GET | `/api/ingredients/{id}` | Détail |
| GET | `/api/ingredients/barcode/{ean}` | Recherche par code-barres |
| POST | `/api/ingredients` | Créer ingrédient custom |
| PUT | `/api/ingredients/{id}` | Modifier |
| DELETE | `/api/ingredients/{id}` | Supprimer (custom only) |
| GET | `/api/ingredients/import/barcode/{ean}` | Import par barcode (catalogue OFF puis API OFF en fallback) |

### 7.4 Catalogue OFF (local)

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/off-catalog/status` | `{ available, productCount, path }` |
| GET | `/api/off-catalog/search?q=` | Recherche dans `off_catalog.db` (LIMIT 30) |

Retourne des objets `IngredientEntity` directement utilisables dans l'app.  
Si `off_catalog.db` est absent : `available: false`, `search` retourne `[]`.

### 7.5 Ciqual

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/ciqual/status` | `{ count, importing, lastResult }` |
| POST | `/api/ciqual/import` | Déclenche l'import en arrière-plan (202 Accepted) |

L'import est **asynchrone** (thread virtuel Java 21). Le client poll `/status` pour suivre la progression.  
Erreur 409 si un import est déjà en cours.

### 7.7 Recettes

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/recipes` | Liste |
| GET | `/api/recipes/{id}` | Détail |
| POST | `/api/recipes` | Créer |
| PUT | `/api/recipes/{id}` | Modifier |
| DELETE | `/api/recipes/{id}` | Supprimer |
| GET | `/api/recipes/{id}/nutrition` | Valeurs nutritionnelles calculées |
| POST | `/api/recipes/import` | Import JSON (multipart `file` + `overwrite`) |

#### Import JSON — Corps de requête

```json
{
  "name": "Poulet rôti aux légumes",
  "servings": 4,
  "tags": ["healthy", "protéiné"],
  "ingredients": [
    { "name": "Poulet (blanc)", "quantityG": 400 },
    { "name": "Tomate", "barcode": "3017620422003", "quantityG": 200 }
  ]
}
```

#### Import JSON — Réponse

```json
{
  "status": "PARTIAL_SUCCESS",
  "recipeId": "uuid",
  "recipeName": "Poulet rôti aux légumes",
  "servings": 4,
  "resolvedCount": 1,
  "unresolvedIngredients": [
    { "tempId": "tmp-1", "name": "Poulet (blanc)", "quantity": "400", "unit": "g" }
  ],
  "warnings": []
}
```

### 7.8 Planning

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/plans?week=2026-04-07` | Planning de la semaine |
| POST | `/api/plans` | Créer un planning |
| POST | `/api/plans/{id}/slots` | Ajouter un créneau |
| PUT | `/api/plans/slots/{slotId}` | Modifier un créneau |
| DELETE | `/api/plans/slots/{slotId}` | Supprimer un créneau |
| GET | `/api/plans/slots/{slotId}` | Détail d'un créneau |
| GET | `/api/plans/slots/{slotId}/nutrition` | Nutrition du créneau |
| PUT | `/api/plans/slots/{slotId}/consume` | Marquer comme consommé |
| POST | `/api/plans/{id}/copy` | Copier vers une autre semaine |

### 7.9 Plats préparés

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/prepared-meals` | Liste |
| GET | `/api/prepared-meals/{id}` | Détail |
| POST | `/api/prepared-meals` | Créer |
| PUT | `/api/prepared-meals/{id}` | Modifier |
| DELETE | `/api/prepared-meals/{id}` | Supprimer |
| POST | `/api/prepared-meals/from-barcode/{ean}` | Import depuis catalogue OFF |
| PUT | `/api/prepared-meals/{id}/favorite` | Toggle favori |
| GET | `/api/prepared-meals/favorites` | Liste des favoris |

### 7.10 Extras de repas

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/meal-slots/{slotId}/extras` | Liste des extras |
| POST | `/api/meal-slots/{slotId}/extras` | Ajouter un extra |
| PUT | `/api/meal-slots/{slotId}/extras/{extraId}` | Modifier |
| DELETE | `/api/meal-slots/{slotId}/extras/{extraId}` | Supprimer |
| GET | `/api/meal-slots/{slotId}/nutrition-total` | Total créneau + extras |

### 7.11 Repas restaurant

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/dish-templates?q=&category=` | Recherche de gabarits |
| GET | `/api/restaurant-meals` | Liste |
| POST | `/api/restaurant-meals` | Créer |
| GET | `/api/restaurant-meals/{id}` | Détail |
| PUT | `/api/restaurant-meals/{id}` | Modifier |
| DELETE | `/api/restaurant-meals/{id}` | Supprimer |

### 7.12 Liste de courses

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/shopping?weekPlanId={id}` | Générer / récupérer liste |
| POST | `/api/shopping/{id}/items` | Ajouter item manuel |
| PUT | `/api/shopping/items/{itemId}/check` | Cocher/décocher |
| DELETE | `/api/shopping/items/{itemId}` | Supprimer item |

### 7.13 Nutrition & Écarts

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/nutrition/log?date=` | Log journalier |
| PUT | `/api/nutrition/log/{date}` | Mettre à jour |
| GET | `/api/nutrition/stats?from=&to=` | Stats sur une période |
| POST | `/api/nutrition/deviations` | Déclarer un écart |
| GET | `/api/nutrition/deviations` | Historique |

### 7.14 Export PDF

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/export/weekly-report?week=` | PDF bilan semaine |
| GET | `/api/export/shopping-list?weekPlanId=` | PDF liste de courses |

### 7.15 Format d'erreur (GlobalExceptionHandler)

Toutes les erreurs retournent un JSON normalisé :

```json
{
  "error": "Message d'erreur lisible",
  "status": 502,
  "timestamp": "2026-04-05T14:32:00"
}
```

---

## 8. Module nutritionnel

### 8.1 Calcul du BMR (Mifflin-St Jeor)

```
Homme : BMR = (10 × poids_kg) + (6.25 × taille_cm) - (5 × âge) + 5
Femme : BMR = (10 × poids_kg) + (6.25 × taille_cm) - (5 × âge) - 161
```

### 8.2 TDEE

| Niveau d'activité | Multiplicateur |
|---|---|
| Sédentaire | BMR × 1.2 |
| Légèrement actif | BMR × 1.375 |
| Modérément actif | BMR × 1.55 |
| Très actif | BMR × 1.725 |
| Extrêmement actif | BMR × 1.9 |

### 8.3 Ajustement objectif

| Objectif | Ajustement |
|---|---|
| Perte de poids | TDEE - 20% |
| Maintien | TDEE |
| Prise de masse | TDEE + 15% |

### 8.4 Calcul nutritionnel d'un créneau

```
slot_calories = recipe_nutrition_per_portion × portions

total_slot = slot_calories
           + Σ extra_calories (INGREDIENT: q/100 × cal100g | PREPARED: cal_portion | FREE: calories_free)
```

---

## 9. Module graphiques & analytics

### 9.1 Graphiques disponibles

#### Vue journalière
- Anneau de calories : consommé vs objectif
- Barres macros : protéines / glucides / lipides
- Score healthy du jour

#### Vue hebdomadaire
- Histogramme calories 7 jours + ligne objectif
- Répartition macros en stacked bar
- Badges écarts sur les jours concernés

#### Vue mensuelle
- Courbe tendance calories lissée
- Évolution du poids si données saisies
- Heatmap calendrier mensuel

---

## 10. Export PDF

### 10.1 Bilan semaine

1. En-tête Mealing + semaine + profil utilisateur
2. Résumé : total calories, moyenne/jour, jours dans l'objectif
3. Tableau jour par jour : repas planifiés, calories, macros
4. Section écarts et compensation appliquée

### 10.2 Liste de courses PDF

1. En-tête : semaine
2. Liste groupée par rayon/catégorie
3. Cases à cocher (format imprimable)

---

## 11. Sécurité & authentification

### 11.1 Flux JWT

```
POST /api/auth/login → { email, password }
→ BCrypt verify
→ JWT HS256 signé (userId, email, exp: +24h)
→ Mobile stocke en AsyncStorage
→ Authorization: Bearer <token> sur chaque requête
→ JwtAuthFilter vérifie avant chaque endpoint protégé
```

### 11.2 Isolation des données

- Tous les endpoints filtrent par `userId` extrait du JWT
- Mots de passe hashés BCrypt (strength 12)
- HTTPS obligatoire en production

---

## 12. Outil OFF Catalog

### 12.1 But

Générer `off_catalog.db` (SQLite) depuis le dump JSONL Open Food Facts (~11 GB compressé).  
Outil Java standalone dans `tools/off-import/`.

### 12.2 Utilisation

```bash
# Télécharger le dump
curl -o openfoodfacts-products.jsonl.gz \
  https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz

# Décompresser
gzip -d openfoodfacts-products.jsonl.gz

# Compiler l'outil
cd tools/off-import
mvn package -q

# Générer le catalogue (placer le résultat à la racine du projet)
java -jar target/off-import.jar openfoodfacts-products.jsonl ../../off_catalog.db
```

### 12.3 Schéma de filtrage

Produit retenu si :
- `bestName()` non null (nom_fr → nom générique → nom_en)
- `energy-kcal_100g > 0`

Insérés par batch de 5000 avec transaction SQLite (WAL mode, synchronous=NORMAL).

### 12.4 Résultat attendu

| Métrique | Valeur approximative |
|---|---|
| Produits retenus | 3–5 millions |
| Taille `off_catalog.db` | 300–600 MB |
| Durée de génération | 15–30 min |

---

## 13. Roadmap & état d'avancement

### Phase 1 — Fondations ✅
- [x] Spring Boot + PostgreSQL + Flyway
- [x] Authentification JWT (register, login, me)
- [x] Profil utilisateur + calcul TDEE/macros
- [x] Modèle BDD (V1-V4) + seeds ingrédients
- [x] Écrans login/register + profil setup

### Phase 2 — Recettes & Planning ✅
- [x] CRUD ingrédients (recherche, barcode, custom)
- [x] CRUD recettes avec calcul nutritionnel
- [x] Planning hebdomadaire complet
- [x] Écran planning + ajout créneau
- [x] Import JSON de recettes

### Phase 3 — Écarts & Extras ✅
- [x] Plats préparés (V5 + 8 endpoints + import barcode)
- [x] Extras de créneaux (V6, 3 modes)
- [x] Repas restaurant (V7, 3 méthodes, ~70 gabarits)
- [x] Calcul nutrition totale créneau + extras
- [x] Onglets Ingrédients et Plats dans la navigation

### Phase 4 — Catalogue OFF local & Ciqual ✅
- [x] Outil Java `off-import` (JSONL → SQLite)
- [x] `OffCatalogService` + `OffCatalogController`
- [x] Statut catalogue OFF dans Paramètres
- [x] Écran recherche unifié avec toggle Générique (Ciqual) / Marque (OFF)
- [x] `CiqualService` + `CiqualController` (import CSV ANSES asynchrone)
- [x] Statut Ciqual dans Paramètres (compteur + bouton import)
- [x] Colonne `source` sur `ingredients` (migration V9)
- [x] Fix navigation retour plats préparés (onglet direct, plus de redirect)

### Phase 5 — Liste de courses & Analytics 🔄
- [ ] Génération liste de courses depuis planning
- [ ] Écran liste de courses (cochage interactif)
- [ ] Log journalier (marquer repas consommés)
- [ ] Dashboard jour (anneau calories, macros)
- [ ] Gestion écarts prévu / imprévu
- [ ] Graphiques semaine / mois

### Phase 6 — Export & Finitions
- [ ] Templates PDF Thymeleaf
- [ ] Service génération PDF
- [ ] Écran export PDF
- [ ] Notifications Android
- [ ] Tests JUnit / Jest
- [ ] Dockerisation complète

---

## Annexes

### A. Variables d'environnement

```env
# Backend
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mealing
DB_USER=mealing
DB_PASSWORD=secret
JWT_SECRET=your-256-bit-secret
OFF_CATALOG_PATH=/chemin/vers/off_catalog.db   # optionnel, défaut: off_catalog.db (user.dir)

# Mobile (dans .env ou app.config.js)
API_BASE_URL=http://10.0.2.2:8080   # émulateur Android → localhost
# ou http://localhost:8080 pour expo web
```

### B. Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mealing
      POSTGRES_USER: mealing
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./mealing-backend
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      DB_USER: mealing
      DB_PASSWORD: secret
      JWT_SECRET: changeme
      OFF_CATALOG_PATH: /data/off_catalog.db
    volumes:
      - ./off_catalog.db:/data/off_catalog.db:ro
    depends_on:
      - postgres

volumes:
  postgres_data:
```
