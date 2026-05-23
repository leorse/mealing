# Mealing — Spécifications Techniques & Fonctionnelles

> Version 2.0 — Avril 2026  
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
13. [Import de recettes — Format JSON](#13-import-de-recettes--format-json)
14. [Plats préparés & saisie rapide](#14-plats-préparés--saisie-rapide)
15. [Ajouts à un repas (extras)](#15-ajouts-à-un-repas-extras)
16. [Repas au restaurant](#16-repas-au-restaurant)

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
| Connexion internet | Non requise pour l'APK (app 100% offline) ; requise pour import Open Food Facts en mode dev web |
| APK autonome | ✅ In scope — Spring Boot remplacé par expo-sqlite dans l'APK |

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

### 3.1 Deux modes de déploiement

| Mode | Plateforme | Backend | Base de données |
|---|---|---|---|
| **Développement PC** | Web (`npx expo start --web`) | Spring Boot sur port 8080 | SQLite via Hibernate |
| **APK Android** | React Native natif | **Aucun** — tout embarqué dans l'APK | SQLite via expo-sqlite |

La détection se fait via `Platform.OS === 'web'` dans chaque fichier `src/api/*.ts`. L'UI (`app/`) est **identique** dans les deux modes.

### 3.2 Structure du projet

```
mealing/
├── mealing-backend/          # Spring Boot (mode dev web uniquement)
│   ├── src/main/java/com/mealing/
│   │   ├── backup/           # Export/import JSON
│   │   ├── ingredient/       # BDD aliments + import CIQUAL/OFF
│   │   ├── recipe/           # Recettes
│   │   ├── mealplan/         # Planning semaine
│   │   ├── nutrition/        # Calculs, historique
│   │   ├── preparedmeal/     # Plats préparés
│   │   ├── restaurant/       # Repas restaurant
│   │   ├── shoppinglist/     # Liste de courses
│   │   ├── mealextra/        # Extras de repas
│   │   ├── user/             # Profil, objectifs
│   │   ├── export/           # PDF
│   │   └── config/           # CORS, security (no auth), UserContext
│   └── src/main/resources/application.yml
│
├── mealing-mobile/           # React Native / Expo SDK 52
│   ├── app/                  # Écrans (Expo Router, inchangés)
│   │   └── (tabs)/           # Navigation par onglets avec icônes SVG
│   ├── assets/
│   │   └── ciqual.sql        # Données CIQUAL pré-exportées (bundlé dans l'APK)
│   └── src/
│       ├── api/              # Façade Platform.OS → HTTP ou SQLite
│       │   └── http/         # Implémentations HTTP (mode web)
│       ├── db/               # Couche SQLite (mode natif)
│       │   ├── database.ts   # Init schéma, chargement CIQUAL, USER_ID
│       │   ├── ingredientsDb.ts
│       │   ├── recipesDb.ts
│       │   ├── mealplanDb.ts
│       │   ├── nutritionDb.ts
│       │   ├── profileDb.ts
│       │   ├── preparedMealsDb.ts
│       │   ├── mealExtrasDb.ts
│       │   ├── restaurantMealsDb.ts
│       │   ├── shoppingDb.ts
│       │   └── backupDb.ts
│       ├── components/       # TabIcon (SVG), etc.
│       └── store/            # Zustand (inchangé)
│
└── tools/
    ├── ciqual-import/        # Import CIQUAL → mealing.db (Spring Boot)
    └── export-ciqual-for-mobile.js  # Extrait ciqual.sql pour l'APK
```

### 3.3 Décisions d'architecture

| Composant | Choix | Justification |
|---|---|---|
| Backend (dev web) | Spring Boot 3.2 / Java 21 | API REST complète, PDF export, CIQUAL importer |
| Backend (APK) | **Supprimé** — SQLite embarqué | App autonome, 0 réseau requis |
| BDD | SQLite (Hibernate en web, expo-sqlite en natif) | Compatible dev ↔ prod sans migration |
| Auth | **Supprimée** — mono-compte local (`USER_ID` fixe) | Application personnelle mono-utilisateur |
| Mobile | React Native / Expo SDK 52 | Android + Web depuis le même code |
| State | Zustand | Inchangé |
| Navigation | Expo Router (file-based) | Onglets avec icônes SVG customs |
| Icônes tabs | SVG inline via react-native-svg | Icônes métier personnalisées |
| Données CIQUAL | Bundlées dans `assets/ciqual.sql` | Disponibles offline dès le premier lancement |
| Export/Import | JSON (web: HTTP ; natif: expo-file-system + expo-sharing) | Sauvegarde portable des données personnelles |

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
- [ ] **Import de recettes via JSON** (endpoint + résolution ingrédients)
- [ ] **Écran de résolution des ingrédients non résolus**
- [ ] **CRUD plats préparés** (scan CB + saisie manuelle)
- [ ] Planning hebdomadaire (backend + API)
- [ ] Écran planning semaine (calendrier)
- [ ] Écran ajout repas à un créneau (recette / plat préparé / libre)

### Phase 3 — Courses & Suivi (2-3 semaines)
- [ ] Génération liste de courses
- [ ] Écran liste de courses (cochage interactif)
- [ ] Log journalier (marquer repas consommés)
- [ ] Dashboard jour (anneau calories, macros)
- [ ] **Ajout d'extras à un créneau** (BDD / plat préparé / saisie libre)
- [ ] **Écran détail créneau** avec total plat + extras
- [ ] **Module repas restaurant** (3 méthodes d'estimation + bibliothèque plats types)
- [ ] **Gestion remplacement de créneau** par repas resto (écart automatique)
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

## 13. Import de recettes — Format JSON

### 13.1 Spécification du format

Le format d'import Mealing est un fichier `.json` avec la structure suivante :

```json
{
  "mealing_recipe": "1.0",
  "name": "Poulet rôti aux herbes",
  "description": "Un classique simple et savoureux.",
  "servings": 4,
  "prep_time_min": 15,
  "cook_time_min": 60,
  "difficulty": "EASY",
  "tags": ["volaille", "four", "classique"],
  "ingredients": [
    {
      "name": "Blanc de poulet",
      "quantity": 600,
      "unit": "g",
      "barcode": null
    },
    {
      "name": "Huile d'olive",
      "quantity": 2,
      "unit": "tbsp"
    },
    {
      "name": "Ail",
      "quantity": 3,
      "unit": "clove"
    },
    {
      "name": "Thym frais",
      "quantity": 5,
      "unit": "g"
    },
    {
      "name": "Sel",
      "quantity": 1,
      "unit": "tsp"
    }
  ],
  "steps": [
    "Préchauffer le four à 200°C.",
    "Mélanger l'huile d'olive, l'ail écrasé, le thym et le sel.",
    "Enduire le poulet du mélange et laisser mariner 10 minutes.",
    "Enfourner 60 minutes en arrosant toutes les 20 minutes."
  ],
  "nutrition_override": null
}
```

### 13.2 Référence des champs

| Champ | Type | Requis | Description |
|---|---|---|---|
| `mealing_recipe` | string | ✅ | Version du format (`"1.0"`) |
| `name` | string | ✅ | Nom de la recette |
| `description` | string | ❌ | Description courte |
| `servings` | integer | ✅ | Nombre de portions |
| `prep_time_min` | integer | ❌ | Temps de préparation en minutes |
| `cook_time_min` | integer | ❌ | Temps de cuisson en minutes |
| `difficulty` | enum | ❌ | `EASY` / `MEDIUM` / `HARD` |
| `tags` | string[] | ❌ | Tags libres |
| `ingredients` | object[] | ✅ | Liste des ingrédients |
| `ingredients[].name` | string | ✅ | Nom de l'ingrédient |
| `ingredients[].quantity` | number | ✅ | Quantité |
| `ingredients[].unit` | enum | ✅ | Unité (voir tableau ci-dessous) |
| `ingredients[].barcode` | string | ❌ | EAN-13 pour match automatique OFF |
| `steps` | string[] | ❌ | Étapes de préparation dans l'ordre |
| `nutrition_override` | object | ❌ | Forcer les valeurs nutritionnelles (voir ci-dessous) |

### 13.3 Unités supportées

| Code | Signification | Équivalent grammes |
|---|---|---|
| `g` | Grammes | 1:1 |
| `kg` | Kilogrammes | × 1000 |
| `ml` | Millilitres | ≈ 1 g (eau) |
| `l` | Litres | ≈ 1000 g |
| `tsp` | Cuillère à café | ≈ 5 g |
| `tbsp` | Cuillère à soupe | ≈ 15 g |
| `cup` | Tasse (250 ml) | ≈ 250 g |
| `clove` | Gousse | ≈ 5 g |
| `piece` | Pièce / unité | dépend de l'ingrédient |
| `pinch` | Pincée | ≈ 0.5 g |
| `slice` | Tranche | dépend de l'ingrédient |

### 13.4 Champ `nutrition_override`

Permet de forcer les valeurs nutritionnelles par portion si elles sont connues (recette issue d'un site, d'un livre…), court-circuitant le calcul automatique par ingrédients :

```json
"nutrition_override": {
  "calories_per_serving": 420,
  "proteins_g": 38,
  "carbs_g": 12,
  "fat_g": 24,
  "fiber_g": 2
}
```

### 13.5 Logique d'import backend

Pour chaque ingrédient du fichier importé, l'algorithme suit cette cascade :

```
1. Match exact (insensible à la casse) sur ingredients.name en BDD locale
   → trouvé : associer directement
   
2. Match flou via recherche full-text PostgreSQL (to_tsvector)
   → trouvé avec score > seuil : proposer à l'utilisateur pour confirmation
   
3. Si barcode présent : recherche Open Food Facts par EAN
   → trouvé : importer l'aliment + associer
   
4. Sinon : recherche Open Food Facts par nom
   → trouvé : importer l'aliment + associer
   
5. Aucun match : créer un ingrédient "non résolu" (is_resolved = false)
   → l'utilisateur peut l'associer manuellement depuis l'app
```

Les ingrédients non résolus sont signalés dans la réponse d'import et affichés dans un écran de résolution dédié.

### 13.6 Endpoint d'import

```
POST /api/recipes/import
Content-Type: multipart/form-data

Champs :
  - file        : fichier .json (obligatoire)
  - overwrite   : boolean — écraser si recette du même nom existe (défaut: false)
```

**Réponse :**

```json
{
  "status": "PARTIAL_SUCCESS",
  "recipe": {
    "id": "uuid-...",
    "name": "Poulet rôti aux herbes",
    "servings": 4
  },
  "resolvedIngredients": 4,
  "unresolvedIngredients": [
    {
      "name": "Thym frais",
      "quantity": 5,
      "unit": "g",
      "tempId": "unresolved-uuid-..."
    }
  ],
  "warnings": ["1 ingrédient non résolu — résolution manuelle requise"]
}
```

### 13.7 Écran de résolution des ingrédients non résolus

Après import, si des ingrédients sont non résolus, l'app affiche un écran listant chaque ingrédient inconnu avec 3 options :

1. **Rechercher dans la BDD** : champ de recherche textuelle ou scan CB
2. **Importer depuis Open Food Facts** : recherche distante
3. **Saisir manuellement** : nom + calories + macros → crée un ingrédient custom

---

## 14. Plats préparés & saisie rapide

### 14.1 Concept

Quand l'utilisateur n'a pas cuisiné de recette (plat surgelé, barquette traiteur, repas de cantine…), il peut ajouter un **plat préparé** à un créneau repas sans passer par une recette avec liste d'ingrédients.

Un plat préparé contient :
- Un nom
- Une photo optionnelle
- Les informations nutritionnelles (saisie manuelle ou scan CB)
- Un Nutri-Score

### 14.2 Modèle de données

```sql
CREATE TABLE prepared_meals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    brand           VARCHAR(255),
    photo_url       VARCHAR(500),
    barcode         VARCHAR(50),
    nutri_score     CHAR(1),                      -- A B C D E
    calories_portion DECIMAL(8,2) NOT NULL,
    proteins_g      DECIMAL(8,2),
    carbs_g         DECIMAL(8,2),
    fat_g           DECIMAL(8,2),
    fiber_g         DECIMAL(8,2),
    portion_label   VARCHAR(100),                 -- ex: "1 barquette (300g)"
    off_id          VARCHAR(100),                 -- Open Food Facts ID si importé
    is_favorite     BOOLEAN DEFAULT FALSE,         -- accès rapide
    created_at      TIMESTAMP DEFAULT NOW()
);
```

La table `meal_slots` est enrichie avec une référence optionnelle :

```sql
ALTER TABLE meal_slots
  ADD COLUMN prepared_meal_id UUID REFERENCES prepared_meals(id),
  ADD COLUMN prepared_meal_portions DECIMAL(4,2) DEFAULT 1;
-- Contrainte : recipe_id XOR prepared_meal_id XOR free_label (au moins un non null)
```

### 14.3 Modes de saisie des calories

#### Mode scan de code-barres
- L'utilisateur scanne l'EAN du produit
- Recherche dans la BDD locale (produits déjà scannés)
- Si absent : appel Open Food Facts → import automatique du produit (nom, macros, Nutri-Score)
- Sélection de la portion (nombre de barquettes / grammes consommés)

#### Mode saisie manuelle
Formulaire minimal :

| Champ | Type | Requis |
|---|---|---|
| Nom du plat | texte | ✅ |
| Photo | image (optionnel) | ❌ |
| Calories | kcal (entier) | ✅ |
| Nutri-Score | A/B/C/D/E | ❌ |
| Protéines | g | ❌ |
| Glucides | g | ❌ |
| Lipides | g | ❌ |
| Label portion | texte libre | ❌ |

### 14.4 Endpoints plats préparés

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/prepared-meals` | Liste des plats préparés de l'utilisateur |
| GET | `/api/prepared-meals/favorites` | Plats marqués favoris (accès rapide) |
| POST | `/api/prepared-meals` | Créer un plat préparé (saisie manuelle) |
| POST | `/api/prepared-meals/from-barcode/{ean}` | Créer depuis Open Food Facts |
| PUT | `/api/prepared-meals/{id}` | Modifier |
| DELETE | `/api/prepared-meals/{id}` | Supprimer |
| PUT | `/api/prepared-meals/{id}/favorite` | Toggle favori |

### 14.5 UX mobile

- Depuis l'écran "Ajouter un repas" à un créneau, l'utilisateur choisit entre :
  - 📖 **Recette** (existante ou nouvelle)
  - 📦 **Plat préparé** (scan CB ou saisie manuelle)
  - ✏️ **Saisie libre** (nom + kcal uniquement, sans persistance)
- Les plats préparés favoris apparaissent en tête de liste pour un accès rapide
- Un historique des 10 derniers plats préparés est affiché

---

## 15. Ajouts à un repas (extras)

### 15.1 Concept

À tout créneau repas (qu'il contienne une recette, un plat préparé ou une saisie libre), l'utilisateur peut ajouter des **extras** : entrée, dessert, apéro, accompagnements, boissons, etc. consommés en plus du plat principal.

Exemples :
- Déjeuner prévu : "Lentilles corail" → extras : yaourt nature + fromage + bière
- Dîner prévu : "Soupe de légumes" → extras : tartines de pain + carré de chocolat
- Repas au restaurant : extras : apéritif + café gourmand

Les extras s'additionnent aux calories du créneau et sont pris en compte dans le total journalier et le suivi nutritionnel.

### 15.2 Modèle de données

```sql
CREATE TABLE meal_extras (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_slot_id        UUID REFERENCES meal_slots(id) ON DELETE CASCADE,
    label               VARCHAR(255) NOT NULL,       -- nom libre ou nom de l'ingrédient
    extra_type          VARCHAR(20),                 -- STARTER / DESSERT / SIDE / DRINK / SNACK / OTHER
    
    -- Option A : lié à un ingrédient BDD
    ingredient_id       UUID REFERENCES ingredients(id),
    quantity_g          DECIMAL(8,2),
    
    -- Option B : lié à un plat préparé
    prepared_meal_id    UUID REFERENCES prepared_meals(id),
    portions            DECIMAL(4,2) DEFAULT 1,
    
    -- Option C : saisie libre (aucune référence BDD)
    calories_free       INTEGER,                     -- kcal saisis manuellement
    proteins_free       DECIMAL(8,2),
    carbs_free          DECIMAL(8,2),
    fat_free            DECIMAL(8,2),
    
    added_at            TIMESTAMP DEFAULT NOW()
    -- Contrainte : au moins un des trois blocs doit être renseigné
);
```

### 15.3 Modes de saisie d'un extra

#### Mode 1 — Recherche BDD d'ingrédients
- Recherche textuelle dans la BDD locale (ex : "yaourt", "fromage", "bière")
- Sélection de l'ingrédient + saisie de la quantité en grammes ou unités
- Les valeurs nutritionnelles sont calculées automatiquement

#### Mode 2 — Plat préparé ou favori
- Si l'extra est lui-même un plat préparé connu (ex : yaourt de marque déjà scanné)
- Sélection depuis la liste des plats préparés / favoris

#### Mode 3 — Saisie libre rapide
- Nom + calories uniquement (et macros optionnelles)
- Aucune persistance BDD — utile pour une bière au bar dont on n'a pas le code-barres
- Idéal pour les extras ponctuels non récurrents

### 15.4 Types d'extras

| Code | Libellé affiché |
|---|---|
| `STARTER` | Entrée |
| `DESSERT` | Dessert |
| `SIDE` | Accompagnement |
| `DRINK` | Boisson |
| `SNACK` | En-cas / apéro |
| `OTHER` | Autre |

### 15.5 Endpoints extras

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/meal-slots/{slotId}/extras` | Lister les extras d'un créneau |
| POST | `/api/meal-slots/{slotId}/extras` | Ajouter un extra |
| PUT | `/api/meal-slots/{slotId}/extras/{extraId}` | Modifier un extra |
| DELETE | `/api/meal-slots/{slotId}/extras/{extraId}` | Supprimer un extra |
| GET | `/api/meal-slots/{slotId}/nutrition-total` | Total nutritionnel = plat + extras |

**Exemple de corps POST :**

```json
// Extra via BDD ingrédient
{
  "label": "Yaourt nature",
  "extra_type": "DESSERT",
  "ingredient_id": "uuid-ingrédient",
  "quantity_g": 125
}

// Extra via plat préparé
{
  "label": "Brie de Meaux",
  "extra_type": "SIDE",
  "prepared_meal_id": "uuid-plat-préparé",
  "portions": 1
}

// Extra saisie libre
{
  "label": "Bière blonde pression",
  "extra_type": "DRINK",
  "calories_free": 180,
  "proteins_free": 1.5,
  "carbs_free": 14,
  "fat_free": 0
}
```

### 15.6 Calcul du total nutritionnel d'un créneau

```
total_slot = nutrition(plat_principal) + Σ nutrition(extras)

Pour chaque extra :
  - Mode BDD : (ingredient.calories_100g / 100) × quantity_g
  - Mode plat préparé : prepared_meal.calories_portion × portions
  - Mode libre : calories_free (et macros_free si renseignées)
```

Le total est exposé par l'endpoint `/nutrition-total` et agrégé dans le `daily_log` du jour.

### 15.7 UX mobile — Écran de détail d'un créneau

```
┌─────────────────────────────────────┐
│  🍽  Déjeuner — Lundi 31 mars        │
├─────────────────────────────────────┤
│  PLAT PRINCIPAL                     │
│  Lentilles corail au curry   480 kcal│
├─────────────────────────────────────┤
│  EXTRAS                             │
│  🥛 Yaourt nature (125g)      72 kcal│
│  🧀 Camembert (30g)          85 kcal│
│  🍺 Bière blonde             180 kcal│
│  [+ Ajouter un extra]               │
├─────────────────────────────────────┤
│  TOTAL                    817 kcal  │
│  Objectif midi            650 kcal  │
│  Écart                   +167 kcal  │
└─────────────────────────────────────┘
```

- Le bouton **[+ Ajouter un extra]** ouvre un bottom sheet avec les 3 modes de saisie
- Chaque extra est swipeable pour suppression rapide
- Un badge rouge indique si le total du créneau dépasse l'objectif
- Option **"Déclarer comme écart"** disponible si le total dépasse significativement l'objectif (> +15%)

### 15.8 Impact sur la liste de courses

Les extras ajoutés **lors de la planification** (extras prévus) alimentent la liste de courses si leur ingrédient est connu en BDD. Les extras saisis **a posteriori** (après consommation) n'impactent pas la liste de courses mais sont comptabilisés dans le suivi nutritionnel.

---

## 16. Repas au restaurant

### 16.1 Concept

Un repas au restaurant peut survenir dans deux contextes dans Mealing :

- **Cas A — Écart imprévu** : un repas était planifié (ex : poulet maison) mais l'utilisateur est finalement allé au resto. Il remplace ou complète le créneau a posteriori.
- **Cas B — Repas planifié au resto** : l'utilisateur sait à l'avance qu'il va au restaurant et l'indique dès la planification (anniversaire, business lunch…).

Dans les deux cas, la saisie du repas resto suit la même logique de détail : nom du restaurant, plat principal reconstitué ou estimé, extras (entrée, dessert, boissons) via le système existant de la section 15.

### 16.2 Modèle de données

Un nouveau type de slot et une table dédiée au contexte restaurant :

```sql
-- Extension de meal_slots : nouveau type de source
-- meal_slot.source_type peut désormais valoir :
--   RECIPE | PREPARED_MEAL | FREE | RESTAURANT

ALTER TABLE meal_slots
  ADD COLUMN restaurant_meal_id UUID REFERENCES restaurant_meals(id);

-- Table des repas restaurant
CREATE TABLE restaurant_meals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Contexte restaurant
    restaurant_name     VARCHAR(255),               -- nom du resto (libre)
    restaurant_type     VARCHAR(50),                -- FRENCH / ITALIAN / JAPANESE / FAST_FOOD / etc.

    -- Plat principal
    dish_name           VARCHAR(255) NOT NULL,       -- "Magret de canard" / "Pizza Regina"
    dish_notes          TEXT,                        -- sauce, cuisson, accompagnement…

    -- Estimation nutritionnelle (l'une ou l'autre méthode, ou les deux combinées)
    estimation_method   VARCHAR(20) NOT NULL,        -- RECONSTRUCTED | FREE | GUIDED | MIXED

    -- Méthode FREE : saisie directe kcal
    calories_free       INTEGER,
    proteins_free       DECIMAL(8,2),
    carbs_free          DECIMAL(8,2),
    fat_free            DECIMAL(8,2),

    -- Méthode GUIDED : plat type sélectionné (fourchette calorique)
    dish_template_id    UUID REFERENCES dish_templates(id),
    portion_size        VARCHAR(10),                 -- SMALL / NORMAL / LARGE

    -- Méthode RECONSTRUCTED : les ingrédients sont dans restaurant_meal_ingredients
    -- (calcul automatique comme une recette ad hoc)

    -- Résultat final calculé (toutes méthodes confondues)
    total_calories      DECIMAL(8,2),
    total_proteins      DECIMAL(8,2),
    total_carbs         DECIMAL(8,2),
    total_fat           DECIMAL(8,2),

    is_deviation        BOOLEAN DEFAULT FALSE,       -- true si remplacement d'un plat planifié
    original_slot_id    UUID REFERENCES meal_slots(id), -- créneau remplacé si écart

    created_at          TIMESTAMP DEFAULT NOW()
);

-- Ingrédients reconstitués du plat resto (méthode RECONSTRUCTED ou MIXED)
CREATE TABLE restaurant_meal_ingredients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_meal_id  UUID REFERENCES restaurant_meals(id) ON DELETE CASCADE,
    ingredient_id       UUID REFERENCES ingredients(id),
    quantity_g          DECIMAL(8,2) NOT NULL,
    unit_label          VARCHAR(50),
    is_estimated        BOOLEAN DEFAULT TRUE         -- quantité estimée (pas pesée)
);

-- Bibliothèque de plats types pour estimation guidée
CREATE TABLE dish_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,       -- "Steak-frites", "Pizza margherita"
    category            VARCHAR(50),                 -- MEAT / FISH / PASTA / PIZZA / etc.
    restaurant_type     VARCHAR(50),
    calories_small      INTEGER,                     -- portion petite
    calories_normal     INTEGER,                     -- portion standard
    calories_large      INTEGER,                     -- portion grande
    proteins_normal     DECIMAL(8,2),
    carbs_normal        DECIMAL(8,2),
    fat_normal          DECIMAL(8,2),
    source              VARCHAR(100)                 -- "ANSES", "Ciqual", "estimation"
);
```

### 16.3 Les trois méthodes d'estimation du plat

#### Méthode 1 — Reconstitution par ingrédients (`RECONSTRUCTED`)

L'utilisateur reconstitue le plat comme une recette ad hoc, sans la sauvegarder dans sa bibliothèque de recettes (bien que l'option de sauvegarde soit proposée à la fin).

Exemple : "Magret de canard, sauce au poivre, haricots verts"
→ Ajouter : magret de canard (200 g) + beurre (10 g) + haricots verts (150 g) + poivre + fond de veau (30 ml)
→ Calcul automatique depuis la BDD ingrédients

Avantage : précis. Inconvénient : prend du temps.

#### Méthode 2 — Estimation guidée (`GUIDED`)

L'utilisateur choisit un **plat type** dans une bibliothèque pré-remplie (~100 plats courants) et ajuste la taille de portion.

```
Plats types exemples :
  Steak-frites (normal)         → ~850 kcal
  Pizza margherita (normale)    → ~700 kcal
  Salade César avec poulet      → ~450 kcal
  Sushi (10 pièces)             → ~380 kcal
  Burger classique              → ~650 kcal
  Couscous royal (normal)       → ~900 kcal
  Magret de canard + légumes    → ~550 kcal
  Pasta carbonara               → ~720 kcal
```

L'utilisateur peut ajuster ±10% manuellement après sélection si la portion semblait plus ou moins généreuse.

#### Méthode 3 — Saisie libre (`FREE`)

L'utilisateur saisit directement les kcal estimés (et les macros s'il le souhaite). Utile pour un resto exotique dont aucun plat ne correspond aux templates.

#### Méthode mixte (`MIXED`)

Reconstitution partielle + complément en saisie libre. Ex : les légumes sont reconstitués précisément, mais la sauce est estimée à 80 kcal libres car sa composition est inconnue.

### 16.4 Flux UX — Saisie d'un repas resto

```
[Créneau repas]
  → [+ Ajouter un repas]
    → Choisir le type : Recette | Plat préparé | 🍽 Restaurant | Saisie libre

[Mode Restaurant]
  ① Nom du restaurant (optionnel)          ex: "Brasserie du Marché"
  ② Type de cuisine (optionnel)            ex: Française / Italienne / Japonaise…
  ③ Nom du plat                            ex: "Entrecôte Café de Paris"

  ④ Comment estimer les calories ?
     ┌─────────────────────────────────────────────┐
     │  🔍 Reconstituer les ingrédients            │
     │     → Rechercher chaque ingrédient en BDD   │
     │                                             │
     │  📋 Choisir un plat type                    │
     │     → Bibliothèque de ~100 plats courants   │
     │                                             │
     │  ✏️  Saisir les calories directement         │
     └─────────────────────────────────────────────┘

  ⑤ Extras (via système section 15)
     → Entrée, dessert, boissons, café…

  ⑥ Résumé total avant validation
     → Option "Sauvegarder ce plat comme recette"
     → Option "Déclarer comme écart" (si remplacement d'un plat planifié)
```

### 16.5 Gestion de l'écart (Cas A — remplacement imprévu)

Quand l'utilisateur remplace un créneau planifié par un repas resto :

1. Le créneau original est marqué `is_consumed = false` + `replaced_by_restaurant = true`
2. Un `restaurant_meal` est créé et lié au créneau via `meal_slot.restaurant_meal_id`
3. Si le total calories resto > calories du plat prévu : le delta est calculé et proposé comme écart à compenser (via le mécanisme de la section 2.6)
4. Si le total calories resto ≤ calories prévues : pas d'écart, juste remplacement neutre

```
Exemple :
  Prévu : Lentilles corail (480 kcal)
  Réel  : Entrecôte + frites + bière (1 050 kcal)
  Delta : +570 kcal → proposé comme écart imprévu à compenser sur J+1/J+2
```

### 16.6 Gestion du repas resto planifié (Cas B)

L'utilisateur peut planifier à l'avance un créneau de type RESTAURANT :
- Il indique juste le nom du resto et le type de cuisine si connu
- Les calories sont estimées (GUIDED ou FREE) au moment de la planification
- Le créneau n'alimente **pas** la liste de courses (aucun ingrédient à acheter)
- Un badge 🍽 distingue visuellement ce créneau dans la vue semaine
- Il peut compléter les détails (plat exact, extras) une fois le repas consommé

### 16.7 Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/restaurant-meals` | Historique des repas resto |
| POST | `/api/restaurant-meals` | Créer un repas resto |
| PUT | `/api/restaurant-meals/{id}` | Modifier (compléter après consommation) |
| DELETE | `/api/restaurant-meals/{id}` | Supprimer |
| POST | `/api/restaurant-meals/{id}/ingredients` | Ajouter un ingrédient reconstitué |
| DELETE | `/api/restaurant-meals/{id}/ingredients/{ingId}` | Retirer un ingrédient |
| GET | `/api/restaurant-meals/{id}/nutrition` | Total nutritionnel calculé |
| GET | `/api/dish-templates?q=pizza&category=` | Rechercher dans les plats types |

### 16.8 Impact sur le reste du système

| Fonctionnalité | Impact |
|---|---|
| **Liste de courses** | Les créneaux RESTAURANT n'y contribuent pas (même si planifiés à l'avance) |
| **Suivi nutritionnel** | `restaurant_meal.total_calories` s'additionne au `daily_log` comme n'importe quel créneau |
| **Extras** | Entièrement compatibles — entrée et dessert du resto se saisissent via `meal_extras` |
| **Écarts** | Si remplacement imprévu, le delta est automatiquement proposé comme écart à compenser |
| **Graphiques** | Les repas resto apparaissent dans les stats comme tout autre repas ; un filtre optionnel permet de les isoler |
| **Export PDF** | Les créneaux RESTAURANT sont identifiés avec 🍽 dans le bilan semaine |
| **Recettes** | Option de sauvegarder le plat reconstitué comme recette pour usage futur |

### 16.9 Bibliothèque de plats types — seed initiale

La table `dish_templates` est pré-remplie au démarrage avec ~100 plats courants issus des données Ciqual (ANSES) et d'estimations standard :

```sql
-- Exemples de seed
INSERT INTO dish_templates (name, category, restaurant_type, calories_small, calories_normal, calories_large) VALUES
('Steak-frites',           'MEAT',   'FRENCH',   650,  850, 1050),
('Magret de canard',       'MEAT',   'FRENCH',   400,  550,  700),
('Pizza margherita',       'PIZZA',  'ITALIAN',  520,  700,  900),
('Pasta carbonara',        'PASTA',  'ITALIAN',  550,  720,  900),
('Sushi (plateau 10 pcs)', 'FISH',   'JAPANESE', 280,  380,  480),
('Burger classique',       'MEAT',   'FAST_FOOD',500,  650,  800),
('Salade César + poulet',  'SALAD',  'FRENCH',   350,  450,  580),
('Couscous royal',         'MEAT',   'MOROCCAN', 700,  900, 1100),
('Tajine d''agneau',       'MEAT',   'MOROCCAN', 500,  680,  850),
('Pad thaï',               'PASTA',  'THAI',     450,  600,  750),
('Moules-frites',          'FISH',   'BELGIAN',  550,  720,  900),
('Risotto aux champignons', 'PASTA', 'ITALIAN',  400,  550,  700),
('Fish & chips',           'FISH',   'BRITISH',  700,  900, 1100),
('Gyros / kebab',          'MEAT',   'TURKISH',  550,  750,  950),
('Plateau de fromages',    'DAIRY',  'FRENCH',   300,  450,  600);
-- ... (~85 autres entrées)
```

---

*Document généré pour le projet Mealing — Version 1.3 — Tous droits réservés*
