# Mealing — Spécifications Techniques & Fonctionnelles

> Version 1.0 — Avril 2026  
> Application de planification des repas et suivi nutritionnel

---

## Table des matières

1. [Vision du produit](#1-vision-du-produit)
2. [Périmètre fonctionnel](#2-périmètre-fonctionnel)
3. [Architecture technique](#3-architecture-technique)
4. [Backend — Spring Boot](#4-backend--spring-boot)
5. [Frontend — React Native (Android)](#5-frontend--react-native-android)
6. [Base de données](#6-base-de-données)
7. [API REST](#7-api-rest)
8. [Module nutritionnel](#8-module-nutritionnel)
9. [Module graphiques & analytics](#9-module-graphiques--analytics)
10. [Export PDF](#10-export-pdf)
11. [Sécurité & authentification](#11-sécurité--authentification)
12. [Roadmap & phases de développement](#12-roadmap--phases-de-développement)

---

## 1. Vision du produit

**Mealing** est une application mobile Android permettant à l'utilisateur de :

- Planifier ses repas à la semaine
- Générer automatiquement sa liste de courses
- Suivre ses apports nutritionnels (calories, macros)
- Gérer les écarts alimentaires (prévus ou imprévus)
- Visualiser ses tendances via des graphiques
- Exporter ses bilans nutritionnels en PDF

### Contraintes & orientations

| Critère | Valeur |
|---|---|
| Plateforme cible | Android (React Native) |
| Pas de fonctionnalité de partage | ✅ Hors scope |
| Export PDF | ✅ In scope |
| Graphiques (jour / semaine / mois) | ✅ In scope |
| Multi-utilisateur | Non — application mono-compte locale |
| Connexion internet | Requise pour import Open Food Facts ; reste offline-friendly |

---

## 2. Périmètre fonctionnel

### 2.1 Gestion du profil utilisateur

- Saisie des données personnelles : prénom, âge, sexe, taille, poids
- Calcul automatique du BMR (Mifflin-St Jeor) et du TDEE selon le niveau d'activité physique
- Définition de l'objectif : perte / maintien / prise de masse
- Objectif calorique journalier calculé ou saisi manuellement
- Répartition macro personnalisable (protéines / glucides / lipides en %)

### 2.2 Base de données d'ingrédients

- Stockage local d'aliments avec valeurs nutritionnelles pour 100 g :
  - Calories (kcal)
  - Protéines (g)
  - Glucides (g) dont sucres
  - Lipides (g) dont acides gras saturés
  - Fibres (g)
  - Sel (g)
  - Indice glycémique (IG) — quand disponible
  - Nutri-Score (A à E) — quand disponible
  - Allergènes (liste normalisée UE)
- Import depuis **Open Food Facts API** (open source, gratuit) par recherche textuelle ou scan de code-barres EAN
- Possibilité d'ajouter un aliment manuellement
- Catégories : Légumes, Fruits, Viandes & poissons, Produits laitiers, Féculents, Matières grasses, Boissons, Épicerie, Autres

### 2.3 Gestion des recettes

- Création de recettes : nom, photo optionnelle, nb de portions, temps de préparation
- Ajout d'ingrédients avec quantité en grammes ou unités (ex : 1 œuf = 60 g)
- Calcul automatique des valeurs nutritionnelles totales et par portion
- Tag de difficulté : facile / moyen / élaboré
- Tag healthy automatique si la recette respecte des critères configurables (ex : < 500 kcal/portion, Nutri-Score ≥ B)
- Historique des recettes utilisées

### 2.4 Planning hebdomadaire

- Vue calendrier de la semaine en cours (lundi → dimanche)
- 4 créneaux par jour : Petit-déjeuner, Déjeuner, Dîner, Collation
- Ajout d'un repas : sélection d'une recette existante ou saisie libre
- Affichage du total calorique du jour en temps réel
- Indicateur visuel par jour : vert (dans l'objectif ±10%), orange (léger écart), rouge (dépassement)
- Navigation entre les semaines (historique + planification future)
- Copier/coller une semaine vers une autre semaine

### 2.5 Liste de courses

- Génération automatique depuis le planning de la semaine sélectionnée
- Regroupement des ingrédients par catégorie (rayon)
- Dédoublonnage et agrégation des quantités (ex : tomates : 400 g + 200 g = 600 g)
- Ajout manuel d'articles hors recette
- Cochage au fur et à mesure (interface liste de courses interactive)
- Gestion d'un "inventaire frigo" pour déduire ce qui est déjà disponible (optionnel)
- Export de la liste en texte ou PDF

### 2.6 Suivi nutritionnel & gestion des écarts

#### Écart prévu
- Marquage d'un repas comme "écart prévu" (restaurant, fête…)
- Estimation manuelle des calories de l'écart
- Le système répartit la compensation sur les autres repas de la semaine (réduction proportionnelle des objectifs journaliers)
- Notification/suggestion : "Pour compenser, vise 1 650 kcal demain et après-demain"

#### Écart imprévu (saisie a posteriori)
- Saisie d'un repas non planifié après consommation
- Choix rapide parmi des repas types (pizza, burger, kebab, dessert riche…) avec kcal estimées
- Ou saisie libre en kcal
- Calcul du surplus sur la journée
- Affichage de la dette calorique et suggestions de compensation sur J+1 / J+2
- Historique des écarts avec type et surplus

### 2.7 Journalisation alimentaire

- Validation quotidienne des repas (repas planifié → consommé ou modifié)
- Différence planning vs. réel tracée
- Saisie du poids du jour (optionnel) pour suivre l'évolution

---

## 3. Architecture technique

```
mealing/
├── mealing-backend/          # Spring Boot API
│   ├── src/main/java/
│   │   └── com/mealing/
│   │       ├── auth/         # JWT, sécurité
│   │       ├── user/         # Profil, objectifs
│   │       ├── ingredient/   # BDD aliments + import OFF
│   │       ├── recipe/       # Recettes
│   │       ├── mealplan/     # Planning semaine
│   │       ├── shoppinglist/ # Liste de courses
│   │       ├── nutrition/    # Calculs, historique
│   │       ├── export/       # Génération PDF
│   │       └── config/       # CORS, security, OpenAPI
│   └── src/main/resources/
│       ├── application.yml
│       └── data/             # Seeds initiales (aliments courants)
│
├── mealing-mobile/           # React Native (Android)
│   ├── src/
│   │   ├── api/              # Appels REST (Axios)
│   │   ├── screens/          # Écrans principaux
│   │   ├── components/       # Composants réutilisables
│   │   ├── navigation/       # React Navigation
│   │   ├── store/            # Zustand (state management)
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Helpers, formatters
│   └── android/
│
└── docker-compose.yml        # PostgreSQL + backend + pgAdmin
```

### Décisions d'architecture

| Composant | Choix | Justification |
|---|---|---|
| Backend | Spring Boot 3.x | Robuste, ecosystème riche, JPA natif |
| BDD | PostgreSQL 15 | Requêtes analytiques, JSON natif, open source |
| ORM | Spring Data JPA / Hibernate | Standard Spring, migrations Flyway |
| Auth | JWT (Bearer token) | Stateless, mobile-friendly |
| API doc | SpringDoc OpenAPI 3 (Swagger UI) | Documentation auto-générée |
| Mobile | React Native 0.73+ | Android ciblé, JS/TS, accès caméra natif |
| State | Zustand | Léger, simple, pas de boilerplate Redux |
| HTTP client | Axios | Intercepteurs JWT, gestion d'erreurs centralisée |
| Graphiques | Victory Native ou Recharts | Composants charts React Native |
| PDF mobile | react-native-print ou expo-print | Rendu HTML → PDF natif Android |
| Scan CB | react-native-vision-camera + MLKit | Scan EAN rapide offline |
| Navigation | React Navigation v6 | Standard de facto React Native |

---

## 4. Backend — Spring Boot

### 4.1 Dépendances Maven principales

```xml
<!-- Spring -->
<dependency>spring-boot-starter-web</dependency>
<dependency>spring-boot-starter-data-jpa</dependency>
<dependency>spring-boot-starter-security</dependency>
<dependency>spring-boot-starter-validation</dependency>

<!-- Base de données -->
<dependency>postgresql</dependency>
<dependency>flyway-core</dependency>

<!-- Auth -->
<dependency>jjwt-api</dependency>
<dependency>jjwt-impl</dependency>

<!-- PDF -->
<dependency>openhtmltopdf-pdfbox</dependency>
<dependency>thymeleaf</dependency>  <!-- templates HTML → PDF -->

<!-- HTTP client (Open Food Facts) -->
<dependency>spring-boot-starter-webflux</dependency>  <!-- WebClient -->

<!-- Outils -->
<dependency>lombok</dependency>
<dependency>mapstruct</dependency>
<dependency>springdoc-openapi-starter-webmvc-ui</dependency>
```

### 4.2 Configuration application.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mealing
    username: ${DB_USER:mealing}
    password: ${DB_PASSWORD:mealing}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration

mealing:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 86400000  # 24h
  nutrition:
    default-tdee-multiplier: 1.55  # activité modérée
  open-food-facts:
    base-url: https://world.openfoodfacts.org/api/v2
    timeout: 5000

server:
  port: 8080
```

### 4.3 Structure des packages

```
com.mealing/
├── auth/
│   ├── AuthController.java
│   ├── AuthService.java
│   ├── JwtService.java
│   └── dto/ (LoginRequest, RegisterRequest, AuthResponse)
│
├── user/
│   ├── UserController.java
│   ├── UserService.java
│   ├── UserEntity.java
│   ├── UserProfile.java         # objectifs, données physiques
│   └── dto/
│
├── ingredient/
│   ├── IngredientController.java
│   ├── IngredientService.java
│   ├── IngredientEntity.java
│   ├── OpenFoodFactsClient.java  # WebClient
│   └── dto/
│
├── recipe/
│   ├── RecipeController.java
│   ├── RecipeService.java
│   ├── RecipeEntity.java
│   ├── RecipeIngredient.java     # table pivot avec quantité
│   └── dto/
│
├── mealplan/
│   ├── MealPlanController.java
│   ├── MealPlanService.java
│   ├── WeekPlan.java             # agrège les MealSlot
│   ├── MealSlot.java             # créneau jour + type repas
│   └── dto/
│
├── shoppinglist/
│   ├── ShoppingListController.java
│   ├── ShoppingListService.java
│   ├── ShoppingItem.java
│   └── dto/
│
├── nutrition/
│   ├── NutritionController.java
│   ├── NutritionService.java
│   ├── DailyLog.java             # log journalier réel
│   ├── Deviation.java            # écarts alimentaires
│   └── dto/
│
└── export/
    ├── ExportController.java
    ├── PdfExportService.java
    └── templates/               # Thymeleaf HTML templates
```

---

## 5. Frontend — React Native (Android)

### 5.1 Structure des écrans

```
screens/
├── auth/
│   ├── LoginScreen.tsx
│   └── RegisterScreen.tsx
│
├── onboarding/
│   └── ProfileSetupScreen.tsx   # données physiques + objectifs
│
├── home/
│   └── HomeScreen.tsx           # résumé jour + accès rapides
│
├── planning/
│   ├── WeekPlanScreen.tsx        # vue calendrier semaine
│   ├── DayDetailScreen.tsx       # détail d'un jour
│   └── AddMealScreen.tsx         # ajout d'un repas à un créneau
│
├── recipes/
│   ├── RecipeListScreen.tsx
│   ├── RecipeDetailScreen.tsx
│   └── RecipeFormScreen.tsx      # création / édition
│
├── ingredients/
│   ├── IngredientSearchScreen.tsx
│   ├── IngredientDetailScreen.tsx
│   └── BarcodeScanScreen.tsx
│
├── shopping/
│   └── ShoppingListScreen.tsx
│
├── nutrition/
│   ├── DashboardScreen.tsx       # graphiques principaux
│   ├── DailyLogScreen.tsx        # saisie journalière
│   └── DeviationScreen.tsx       # gestion des écarts
│
├── analytics/
│   └── AnalyticsScreen.tsx       # graphiques jour/semaine/mois
│
├── export/
│   └── ExportScreen.tsx
│
└── settings/
    └── SettingsScreen.tsx
```

### 5.2 Navigation (React Navigation v6)

```
RootNavigator
├── AuthStack (non authentifié)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ProfileSetupScreen
│
└── MainTabs (authentifié — Bottom Tab Navigator)
    ├── Tab: Accueil         → HomeScreen
    ├── Tab: Planning        → WeekPlanScreen (Stack)
    ├── Tab: Courses         → ShoppingListScreen
    ├── Tab: Suivi           → DashboardScreen (Stack)
    └── Tab: Paramètres      → SettingsScreen
```

### 5.3 State management (Zustand)

```typescript
// stores/useUserStore.ts
interface UserStore {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;
}

// stores/usePlanStore.ts
interface PlanStore {
  currentWeek: WeekPlan | null;
  selectedDate: Date;
  fetchWeek: (weekStart: string) => Promise<void>;
  addMeal: (slot: MealSlot) => Promise<void>;
}

// stores/useNutritionStore.ts
interface NutritionStore {
  dailyLogs: Record<string, DailyLog>;
  todayStats: NutritionStats | null;
  fetchDailyLog: (date: string) => Promise<void>;
  addDeviation: (deviation: Deviation) => Promise<void>;
}
```

### 5.4 Bibliothèques React Native

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@react-navigation/stack": "^6.x",
    "axios": "^1.x",
    "zustand": "^4.x",
    "react-native-vision-camera": "^3.x",
    "vision-camera-code-scanner": "^x",
    "victory-native": "^36.x",
    "react-native-svg": "^14.x",
    "react-native-print": "^0.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "react-native-paper": "^5.x",
    "react-native-calendars": "^1.x",
    "date-fns": "^3.x",
    "react-native-reanimated": "^3.x",
    "react-native-gesture-handler": "^2.x"
  }
}
```

---

## 6. Base de données

### 6.1 Schéma relationnel

```sql
-- Utilisateur
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,          -- bcrypt
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Profil physique & objectifs
CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name          VARCHAR(100),
    birth_date          DATE,
    gender              VARCHAR(10),              -- MALE / FEMALE / OTHER
    height_cm           DECIMAL(5,1),
    weight_kg           DECIMAL(5,2),
    activity_level      VARCHAR(20),              -- SEDENTARY / LIGHT / MODERATE / ACTIVE / VERY_ACTIVE
    goal                VARCHAR(20),              -- LOSE / MAINTAIN / GAIN
    target_calories     INTEGER,                  -- null = calculé automatiquement
    macro_protein_pct   INTEGER DEFAULT 30,
    macro_carbs_pct     INTEGER DEFAULT 45,
    macro_fat_pct       INTEGER DEFAULT 25,
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Ingrédients / Aliments
CREATE TABLE ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    brand           VARCHAR(255),
    barcode         VARCHAR(50),
    category        VARCHAR(50),
    calories_100g   DECIMAL(7,2) NOT NULL,
    proteins_100g   DECIMAL(7,2),
    carbs_100g      DECIMAL(7,2),
    sugars_100g     DECIMAL(7,2),
    fat_100g        DECIMAL(7,2),
    saturated_fat_100g DECIMAL(7,2),
    fiber_100g      DECIMAL(7,2),
    salt_100g       DECIMAL(7,2),
    glycemic_index  INTEGER,
    nutri_score     CHAR(1),                      -- A B C D E
    allergens       TEXT[],                       -- array PostgreSQL
    off_id          VARCHAR(100),                 -- Open Food Facts ID
    is_custom       BOOLEAN DEFAULT FALSE,
    user_id         UUID REFERENCES users(id),    -- null = aliment partagé / seed
    created_at      TIMESTAMP DEFAULT NOW()
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
    difficulty      VARCHAR(10),                  -- EASY / MEDIUM / HARD
    is_healthy      BOOLEAN,
    photo_url       VARCHAR(500),
    tags            TEXT[],
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Pivot recette ↔ ingrédient
CREATE TABLE recipe_ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id   UUID REFERENCES ingredients(id),
    quantity_g      DECIMAL(8,2) NOT NULL,
    unit_label      VARCHAR(50)                   -- "2 œufs", "1 c.à.s."
);

-- Plan de repas (semaine)
CREATE TABLE week_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start      DATE NOT NULL,                -- lundi de la semaine
    notes           TEXT,
    UNIQUE(user_id, week_start)
);

-- Créneau repas
CREATE TABLE meal_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_plan_id    UUID REFERENCES week_plans(id) ON DELETE CASCADE,
    slot_date       DATE NOT NULL,
    meal_type       VARCHAR(20) NOT NULL,          -- BREAKFAST / LUNCH / DINNER / SNACK
    recipe_id       UUID REFERENCES recipes(id),  -- null si saisie libre
    free_label      VARCHAR(255),                 -- si pas de recette
    portions        DECIMAL(4,2) DEFAULT 1,
    is_deviation    BOOLEAN DEFAULT FALSE,
    calories_override INTEGER,                    -- override si écart libre
    is_consumed     BOOLEAN DEFAULT FALSE,
    consumed_at     TIMESTAMP
);

-- Log journalier réel (ce qui a vraiment été mangé)
CREATE TABLE daily_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL,
    total_calories  DECIMAL(8,2),
    total_proteins  DECIMAL(8,2),
    total_carbs     DECIMAL(8,2),
    total_fat       DECIMAL(8,2),
    total_fiber     DECIMAL(8,2),
    weight_kg       DECIMAL(5,2),                 -- poids du jour (optionnel)
    notes           TEXT,
    UNIQUE(user_id, log_date)
);

-- Écarts alimentaires
CREATE TABLE deviations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    deviation_date  DATE NOT NULL,
    meal_slot_id    UUID REFERENCES meal_slots(id),
    type            VARCHAR(10) NOT NULL,          -- PLANNED / UNPLANNED
    label           VARCHAR(255),                  -- "Pizza royale", "Anniversaire"
    calories_extra  INTEGER NOT NULL,
    compensation_spread INTEGER DEFAULT 2,         -- nb de jours pour compenser
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
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
```

### 6.2 Index recommandés

```sql
CREATE INDEX idx_meal_slots_week_plan ON meal_slots(week_plan_id);
CREATE INDEX idx_meal_slots_date ON meal_slots(slot_date);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX idx_deviations_user_date ON deviations(user_id, deviation_date);
CREATE INDEX idx_ingredients_barcode ON ingredients(barcode);
CREATE INDEX idx_ingredients_name ON ingredients USING gin(to_tsvector('french', name));
```

---

## 7. API REST

### 7.1 Endpoints Auth

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion → JWT |
| GET | `/api/auth/me` | Profil courant |

### 7.2 Endpoints User/Profile

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Récupérer le profil |
| PUT | `/api/profile` | Mettre à jour le profil |
| GET | `/api/profile/objectives` | Objectifs calculés (TDEE, macros) |

### 7.3 Endpoints Ingrédients

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/ingredients?q=tomate` | Recherche textuelle |
| GET | `/api/ingredients/barcode/{ean}` | Recherche par code-barres |
| GET | `/api/ingredients/{id}` | Détail d'un ingrédient |
| POST | `/api/ingredients` | Créer ingrédient custom |
| PUT | `/api/ingredients/{id}` | Modifier |
| DELETE | `/api/ingredients/{id}` | Supprimer (custom only) |
| GET | `/api/ingredients/import/off?q={query}` | Import depuis Open Food Facts |
| GET | `/api/ingredients/import/barcode/{ean}` | Import par code-barres Open Food Facts |

#### 7.3.1 Détail d'un ingrédient — Réponse

```json
// GET /api/ingredients/{id}
{
  "id": "uuid",
  "name": "Tomate",
  "brand": null,
  "barcode": null,
  "category": "Légumes",
  "calories100g": 18.00,
  "proteins100g": 0.90,
  "carbs100g": 3.50,
  "sugars100g": 3.20,
  "fat100g": 0.20,
  "saturatedFat100g": null,
  "fiber100g": 1.20,
  "salt100g": 0.01,
  "glycemicIndex": null,
  "nutriScore": "A",
  "offId": null,
  "isCustom": false,
  "createdAt": "2026-04-01T10:00:00"
}
```

#### 7.3.2 Recherche textuelle — Paramètres & Réponse

```
GET /api/ingredients?q=poulet
Authorization: Bearer <token>
```

Retourne un tableau d'ingrédients correspondant à la recherche (base locale + ingrédients custom de l'utilisateur), triés par nom.

```json
[
  {
    "id": "uuid",
    "name": "Poulet (blanc)",
    "category": "Viandes & Poissons",
    "calories100g": 165.00,
    "proteins100g": 31.00,
    "carbs100g": 0.00,
    "fat100g": 3.60,
    "nutriScore": "B",
    "isCustom": false
  }
]
```

#### 7.3.3 Recherche par code-barres — Flux complet

```
1. Scan EAN dans l'app → GET /api/ingredients/barcode/{ean}
   → 200 : ingrédient trouvé en base locale → utiliser directement
   → 404 : pas en base

2. Si 404 → GET /api/ingredients/import/barcode/{ean}
   → Appel Open Food Facts API
   → Sauvegarde automatique en base
   → 200 : retourne l'ingrédient importé
   → 404 : produit inconnu d'Open Food Facts
```

#### 7.3.4 Créer un ingrédient custom — Corps de requête

```json
// POST /api/ingredients
{
  "name": "Mon granola maison",
  "category": "Épicerie",
  "calories100g": 420,
  "proteins100g": 9.5,
  "carbs100g": 58.0,
  "sugars100g": 18.0,
  "fat100g": 16.0,
  "saturatedFat100g": 3.2,
  "fiber100g": 5.5,
  "salt100g": 0.08
}
```

L'ingrédient est automatiquement associé à l'utilisateur (`isCustom: true`, `userId` extrait du JWT).

#### 7.3.5 Import Open Food Facts — Comportement

```
GET /api/ingredients/import/off?q=nutella
```

- Interroge l'API Open Food Facts (`/search?search_terms=nutella&page_size=20`)
- Retourne jusqu'à 20 résultats **sans** les sauvegarder en base
- Le frontend affiche les résultats et l'utilisateur choisit quoi importer
- Pour sauvegarder un résultat : `POST /api/ingredients` avec les données de l'ingrédient sélectionné

Champs mappés depuis Open Food Facts :

| Champ OFF | Champ local |
|---|---|
| `energy-kcal_100g` | `calories100g` |
| `proteins_100g` | `proteins100g` |
| `carbohydrates_100g` | `carbs100g` |
| `sugars_100g` | `sugars100g` |
| `fat_100g` | `fat100g` |
| `saturated-fat_100g` | `saturatedFat100g` |
| `fiber_100g` | `fiber100g` |
| `salt_100g` | `salt100g` |
| `nutriscore_grade` | `nutriScore` |
| `code` | `barcode` + `offId` |

### 7.4 Endpoints Recettes

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/recipes` | Liste des recettes |
| GET | `/api/recipes/{id}` | Détail |
| POST | `/api/recipes` | Créer |
| PUT | `/api/recipes/{id}` | Modifier |
| DELETE | `/api/recipes/{id}` | Supprimer |
| GET | `/api/recipes/{id}/nutrition` | Valeurs nutritionnelles calculées |

### 7.5 Endpoints Planning

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/plans?week=2026-03-30` | Planning de la semaine |
| POST | `/api/plans` | Créer un planning |
| POST | `/api/plans/{id}/slots` | Ajouter un créneau repas |
| PUT | `/api/plans/slots/{slotId}` | Modifier un créneau |
| DELETE | `/api/plans/slots/{slotId}` | Supprimer un créneau |
| POST | `/api/plans/{id}/copy` | Copier vers une autre semaine |
| PUT | `/api/plans/slots/{slotId}/consume` | Marquer comme consommé |

### 7.6 Endpoints Liste de courses

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/shopping?weekPlanId={id}` | Générer / récupérer liste |
| POST | `/api/shopping/{id}/items` | Ajouter item manuel |
| PUT | `/api/shopping/items/{itemId}/check` | Cocher/décocher item |
| DELETE | `/api/shopping/items/{itemId}` | Supprimer item |
| GET | `/api/shopping/{id}/export` | Export texte de la liste |

### 7.7 Endpoints Nutrition & Écarts

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/nutrition/log?date=2026-04-01` | Log journalier |
| PUT | `/api/nutrition/log/{date}` | Mettre à jour le log |
| GET | `/api/nutrition/stats?from=&to=` | Stats sur une période |
| POST | `/api/nutrition/deviations` | Déclarer un écart |
| GET | `/api/nutrition/deviations` | Historique des écarts |
| GET | `/api/nutrition/deviations/compensation` | Plan de compensation actif |

### 7.8 Endpoints Analytics

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/daily?date=` | Données graphiques journalières |
| GET | `/api/analytics/weekly?week=` | Données graphiques hebdomadaires |
| GET | `/api/analytics/monthly?month=` | Données graphiques mensuelles |
| GET | `/api/analytics/trends?period=` | Tendances poids + calories |

### 7.9 Endpoints Export

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/export/weekly-report?week=` | PDF bilan semaine |
| GET | `/api/export/monthly-report?month=` | PDF bilan mensuel |
| GET | `/api/export/shopping-list?weekPlanId=` | PDF liste de courses |

---

## 8. Module nutritionnel

### 8.1 Calcul du BMR (Mifflin-St Jeor)

```
Homme : BMR = (10 × poids_kg) + (6.25 × taille_cm) - (5 × âge) + 5
Femme : BMR = (10 × poids_kg) + (6.25 × taille_cm) - (5 × âge) - 161
```

### 8.2 Calcul du TDEE (Total Daily Energy Expenditure)

| Niveau d'activité | Multiplicateur |
|---|---|
| Sédentaire (bureau, peu de sport) | BMR × 1.2 |
| Légèrement actif (1-3 jours/semaine) | BMR × 1.375 |
| Modérément actif (3-5 jours/semaine) | BMR × 1.55 |
| Très actif (6-7 jours/semaine) | BMR × 1.725 |
| Extrêmement actif (sport intense + travail physique) | BMR × 1.9 |

### 8.3 Ajustement selon l'objectif

| Objectif | Ajustement |
|---|---|
| Perte de poids | TDEE - 20% (déficit modéré) |
| Maintien | TDEE |
| Prise de masse | TDEE + 15% |

### 8.4 Calcul nutritionnel d'une recette

```
Pour chaque ingrédient i avec quantité q_i (grammes) :
  calories_i = (ingredients[i].calories_100g / 100) × q_i

total_calories_recette = Σ calories_i
calories_par_portion = total_calories_recette / nb_portions
```

Idem pour chaque macro (protéines, glucides, lipides, fibres).

### 8.5 Critères "healthy"

Une recette est taguée **healthy** si elle remplit au moins 3 des 5 critères suivants (configurables) :

1. Calories par portion ≤ 600 kcal
2. Lipides saturés ≤ 5 g / portion
3. Fibres ≥ 3 g / portion
4. Sucres ≤ 10 g / portion
5. Nutri-Score de l'ingrédient principal ≥ B

### 8.6 Logique de compensation des écarts

```
surplus = calories_ecart - calories_objectif_jour_J
nb_jours_compensation = user.compensation_spread  (défaut: 2)
reduction_par_jour = surplus / nb_jours_compensation

Pour chaque jour J+1 à J+n :
  objectif_ajuste[J+n] = objectif_de_base - reduction_par_jour
  (avec plancher : objectif_ajuste ≥ BMR)
```

---

## 9. Module graphiques & analytics

### 9.1 Graphiques disponibles

#### Vue journalière
- **Anneau de calories** : consommé vs objectif (couleur selon seuil)
- **Barres macros** : protéines / glucides / lipides (g et % de l'objectif)
- **Timeline repas** : heures de consommation sur la journée
- **Score healthy** : nb de repas healthy du jour sur total

#### Vue hebdomadaire
- **Histogramme calories** : bar chart 7 jours, ligne objectif superposée
- **Répartition macros** : stacked bar chart par jour
- **Jours dans l'objectif** : compteur avec indicateur couleur
- **Récapitulatif écarts** : badges sur les jours concernés

#### Vue mensuelle
- **Tendance calories** : courbe lissée sur 30 jours
- **Évolution du poids** : courbe poids si données saisies
- **Heatmap** : calendrier mensuel coloré selon le niveau de respect de l'objectif
- **Comparatif semaines** : bar chart des moyennes caloriquest par semaine

#### Tendances générales
- **Moyenne mobile 7 jours** : calories lissées
- **Fréquence des écarts** : histogramme mensuel
- **Progression macros** : radarChart (protéines, glucides, lipides, fibres vs objectifs)

### 9.2 Implémentation Victory Native

```typescript
// Exemple graphique calories semaine
import { VictoryBar, VictoryLine, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';

const WeeklyCaloriesChart = ({ data, target }) => (
  <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
    <VictoryAxis tickFormat={(d) => format(new Date(d), 'EEE', { locale: fr })} />
    <VictoryAxis dependentAxis />
    <VictoryBar
      data={data}
      x="date"
      y="calories"
      style={{ data: { fill: ({ datum }) =>
        datum.calories > target ? '#E74C3C' :
        datum.calories > target * 0.9 ? '#F39C12' : '#2ECC71'
      }}}
    />
    <VictoryLine
      y={() => target}
      style={{ data: { stroke: '#3498DB', strokeDasharray: '4,4' } }}
    />
  </VictoryChart>
);
```

### 9.3 Données renvoyées par l'API analytics

```json
// GET /api/analytics/weekly?week=2026-03-30
{
  "weekStart": "2026-03-30",
  "dailyStats": [
    {
      "date": "2026-03-30",
      "calories": 1820,
      "proteins": 95,
      "carbs": 220,
      "fat": 62,
      "fiber": 28,
      "target": 1900,
      "isDeviation": false,
      "isHealthyDay": true
    }
  ],
  "weekSummary": {
    "avgCalories": 1875,
    "totalCalories": 13125,
    "daysInTarget": 5,
    "deviationsCount": 1,
    "avgProteins": 98,
    "avgCarbs": 225,
    "avgFat": 65
  }
}
```

---

## 10. Export PDF

### 10.1 Contenu des PDFs générés

#### Bilan semaine (PDF)
1. En-tête Mealing + semaine concernée + profil utilisateur
2. Résumé : total calories, moyenne/jour, jours dans l'objectif
3. Tableau jour par jour : repas planifiés, calories, macros
4. Graphique calories semaine (image SVG exportée)
5. Graphique macros (image SVG exportée)
6. Section écarts : tableau des écarts + compensation appliquée
7. Pied de page : date de génération

#### Liste de courses (PDF)
1. En-tête : semaine concernée
2. Liste groupée par rayon/catégorie avec quantités
3. Case à cocher pour chaque item (format imprimable)

### 10.2 Génération backend (Spring Boot + OpenHTMLToPDF)

```java
@Service
public class PdfExportService {

    @Autowired
    private TemplateEngine templateEngine;  // Thymeleaf

    public byte[] generateWeeklyReport(String userId, LocalDate weekStart) {
        // 1. Récupérer les données
        WeeklyReportData data = nutritionService.getWeeklyReportData(userId, weekStart);

        // 2. Rendre le template HTML Thymeleaf
        Context context = new Context();
        context.setVariable("data", data);
        String html = templateEngine.process("weekly-report", context);

        // 3. Convertir HTML → PDF
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        }
    }
}
```

### 10.3 Affichage / partage PDF sur Android (React Native)

```typescript
import RNPrint from 'react-native-print';
import { Platform, Share } from 'react-native';

const exportWeeklyReport = async (weekStart: string) => {
  const response = await api.get(`/export/weekly-report?week=${weekStart}`, {
    responseType: 'blob'
  });
  const base64 = await blobToBase64(response.data);
  const filePath = `${RNFS.CachesDirectoryPath}/mealing-report-${weekStart}.pdf`;
  await RNFS.writeFile(filePath, base64, 'base64');

  // Ouvrir avec la visionneuse PDF Android ou partager
  await RNPrint.print({ filePath });
};
```

---

## 11. Sécurité & authentification

### 11.1 Flux d'authentification JWT

```
1. POST /api/auth/login → { email, password }
2. Backend vérifie password (BCrypt)
3. Génère JWT signé (HS256) avec { userId, email, exp: +24h }
4. Retourne { token, user }
5. Mobile stocke le token dans AsyncStorage (chiffré)
6. Chaque requête : Authorization: Bearer <token>
7. Spring Security filtre JWT avant chaque requête protégée
```

### 11.2 Configuration Spring Security

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

### 11.3 Sécurité des données

- Tous les endpoints filtrent par `userId` extrait du JWT (isolation des données)
- Pas de données partagées entre utilisateurs
- Mots de passe hashés avec BCrypt (strength 12)
- Token JWT invalide après déconnexion (blacklist en mémoire Redis ou simple expiration)
- HTTPS obligatoire en production

---

## 12. Roadmap & phases de développement

### Phase 1 — Fondations (3-4 semaines)
- [ ] Setup Spring Boot + PostgreSQL + Flyway
- [ ] Authentification JWT (register, login)
- [ ] Profil utilisateur + calcul TDEE
- [ ] Modèle BDD complet + migrations
- [ ] Import seed d'aliments courants (50-100 aliments)
- [ ] Intégration Open Food Facts API
- [ ] Écran login/register React Native
- [ ] Écran profil setup

### Phase 2 — Recettes & Planning (3-4 semaines)
- [ ] CRUD ingrédients (recherche, scan CB, custom)
- [ ] CRUD recettes avec calcul nutritionnel
- [ ] Planning hebdomadaire (backend + API)
- [ ] Écran planning semaine (calendrier)
- [ ] Écran ajout recette à un créneau

### Phase 3 — Courses & Suivi (2-3 semaines)
- [ ] Génération liste de courses
- [ ] Écran liste de courses (cochage interactif)
- [ ] Log journalier (marquer repas consommés)
- [ ] Dashboard jour (anneau calories, macros)
- [ ] Gestion des écarts (prévu + imprévu)
- [ ] Calcul et affichage compensation

### Phase 4 — Analytics & Export (2-3 semaines)
- [ ] API analytics (jour / semaine / mois)
- [ ] Écran graphiques semaine (Victory Native)
- [ ] Écran graphiques mois (tendance, heatmap)
- [ ] Templates PDF Thymeleaf
- [ ] Service génération PDF backend
- [ ] Écran export + partage PDF Android

### Phase 5 — Finitions & UX (2 semaines)
- [ ] Notifications Android (rappels repas, objectif atteint)
- [ ] Mode hors-ligne (cache AsyncStorage)
- [ ] Paramètres (thème, objectifs, allergènes)
- [ ] Tests (JUnit backend, Jest mobile)
- [ ] Dockerisation complète
- [ ] Documentation API Swagger finale

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
JWT_EXPIRATION=86400000

# Mobile (dans .env)
API_BASE_URL=http://10.0.2.2:8080  # émulateur Android → localhost
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
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@mealing.app
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"

volumes:
  postgres_data:
```

### C. Open Food Facts — exemple d'appel

```java
@Service
public class OpenFoodFactsClient {

    private final WebClient webClient;

    public OpenFoodFactsClient(WebClient.Builder builder,
                                @Value("${mealing.open-food-facts.base-url}") String baseUrl) {
        this.webClient = builder.baseUrl(baseUrl).build();
    }

    public Mono<List<IngredientDTO>> searchByName(String query) {
        return webClient.get()
            .uri(u -> u.path("/search")
                .queryParam("search_terms", query)
                .queryParam("fields", "product_name,nutriments,nutriscore_grade,allergens,code")
                .queryParam("page_size", 20)
                .build())
            .retrieve()
            .bodyToMono(OFFSearchResponse.class)
            .map(OFFMapper::toIngredientDTOs);
    }

    public Mono<IngredientDTO> searchByBarcode(String ean) {
        return webClient.get()
            .uri("/product/{ean}", ean)
            .retrieve()
            .bodyToMono(OFFProductResponse.class)
            .map(OFFMapper::toIngredientDTO);
    }
}
```

---

*Document généré pour le projet Mealing — Tous droits réservés*