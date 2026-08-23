# Mealing — Spécifications Techniques & Fonctionnelles

> Version 2.0 — Août 2026
> Application de planification des repas et suivi nutritionnel
> **Refonte PWA — local-first, sans backend, hébergée sur Cloudflare**

---

## Table des matières

1. [Vision du produit](#1-vision-du-produit)
2. [Périmètre fonctionnel](#2-périmètre-fonctionnel)
3. [Architecture technique](#3-architecture-technique)
4. [Frontend — Application React (PWA)](#4-frontend--application-react-pwa)
5. [Stockage local — IndexedDB (Dexie.js)](#5-stockage-local--indexeddb-dexiejs)
6. [Couche d'accès aux données (Repositories)](#6-couche-daccès-aux-données-repositories)
7. [Intégration Open Food Facts](#7-intégration-open-food-facts)
8. [Module nutritionnel](#8-module-nutritionnel)
9. [Module graphiques & analytics](#9-module-graphiques--analytics)
10. [Export PDF](#10-export-pdf)
11. [Sauvegarde, export/import & confidentialité](#11-sauvegarde-exportimport--confidentialité)
12. [PWA — installation, offline & mises à jour](#12-pwa--installation-offline--mises-à-jour)
13. [Déploiement — Cloudflare Pages](#13-déploiement--cloudflare-pages)
14. [Roadmap & phases de développement](#14-roadmap--phases-de-développement)

---

## 1. Vision du produit

**Mealing** est une **PWA (Progressive Web App)** installable sur mobile et desktop, permettant à l'utilisateur de :

- Planifier ses repas à la semaine
- Générer automatiquement sa liste de courses
- Suivre ses apports nutritionnels (calories, macros)
- Gérer les écarts alimentaires (prévus ou imprévus)
- Visualiser ses tendances via des graphiques
- Exporter ses bilans nutritionnels en PDF

### Contraintes & orientations

| Critère | Valeur |
|---|---|
| Plateforme cible | Web (PWA installable — Android, iOS, desktop) |
| Backend applicatif | ❌ Aucun — application 100% local-first |
| Stockage des données | IndexedDB, exclusivement sur l'appareil |
| Pas de fonctionnalité de partage | ✅ Hors scope |
| Export PDF | ✅ In scope — généré côté client |
| Graphiques (jour / semaine / mois) | ✅ In scope |
| Multi-utilisateur | Non — application mono-profil locale |
| Multi-appareil / sync cloud | Non (v1) — export/import JSON manuel en attendant |
| Authentification | ❌ Aucune — les données ne quittent jamais l'appareil |
| Connexion internet | Requise uniquement pour l'import Open Food Facts ; reste 100% offline le reste du temps |
| Hébergement | Cloudflare Pages (site statique) |

### Changement de paradigme vs. v1

La v1 (Spring Boot + PostgreSQL + React Native) reposait sur un backend central avec authentification JWT et une base de données serveur. Cette refonte supprime entièrement cette couche :

- **Pas de serveur applicatif** → pas de coût d'infra, pas de maintenance backend, pas de latence réseau sur les opérations courantes.
- **Les données restent sur l'appareil** → confidentialité par construction, fonctionnement offline natif (le mode "offline-friendly" de la v1 devient le mode par défaut).
- **Contrepartie assumée** : pas de synchronisation multi-appareils automatique. Compensée par un export/import JSON manuel (voir §11).

---

## 2. Périmètre fonctionnel

*(Fonctionnellement identique à la v1 — seule la couche technique change. Le détail ci-dessous est repris à l'identique, les tables/entités citées correspondent maintenant à des stores IndexedDB, voir §5.)*

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
- Import depuis **Open Food Facts API** (open source, gratuit, appelée directement depuis le navigateur) par recherche textuelle ou scan de code-barres EAN
- Possibilité d'ajouter un aliment manuellement
- Catégories : Légumes, Fruits, Viandes & poissons, Produits laitiers, Féculents, Matières grasses, Boissons, Épicerie, Autres

### 2.3 Gestion des recettes

- Création de recettes : nom, photo optionnelle, nb de portions, temps de préparation
- Ajout d'ingrédients avec quantité en grammes ou unités (ex : 1 œuf = 60 g)
- Calcul automatique des valeurs nutritionnelles totales et par portion
- Tag de difficulté : facile / moyen / élaboré
- Tag healthy automatique si la recette respecte des critères configurables (ex : < 500 kcal/portion, Nutri-Score ≥ B)
- Historique des recettes utilisées
- Photo stockée en `Blob` directement dans IndexedDB (pas d'upload serveur)

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
- Export de la liste en texte ou PDF (génération client, voir §10)

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
├── src/
│   ├── app/                  # Bootstrap, routing, layout racine
│   ├── screens/               # Écrans principaux (voir §4.1)
│   ├── components/            # Composants réutilisables
│   ├── db/                    # Schéma Dexie + repositories (voir §5, §6)
│   │   ├── schema.ts
│   │   ├── repositories/
│   │   └── migrations/
│   ├── services/
│   │   ├── openFoodFacts.ts   # Client fetch OFF (appel direct navigateur)
│   │   ├── nutrition.ts       # BMR/TDEE/macros/compensation
│   │   ├── pdfExport.ts       # Génération PDF client (jsPDF/pdf-lib)
│   │   └── backup.ts          # Export/Import JSON
│   ├── store/                 # Zustand (état UI, pas les données métier)
│   ├── hooks/                 # Custom hooks (dont hooks Dexie live queries)
│   └── utils/                 # Helpers, formatters
├── public/
│   ├── manifest.webmanifest
│   └── icons/
├── vite.config.ts             # vite-plugin-pwa (Service Worker, manifest)
└── wrangler.toml               # Config déploiement Cloudflare Pages
```

### Décisions d'architecture

| Composant | Choix | Justification |
|---|---|---|
| Backend applicatif | **Aucun** | Toute la logique tourne dans le navigateur ; simplicité, confidentialité, zéro coût serveur |
| Stockage | **IndexedDB** via Dexie.js | Persistant, volumineux, transactionnel, supporte les Blobs (photos) |
| Hébergement | **Cloudflare Pages** | Site statique, CDN mondial, déploiement Git, HTTPS gratuit |
| Frontend | **React 18 + Vite** | Écosystème riche, build rapide, tooling PWA mature (`vite-plugin-pwa`) |
| Routing | **React Router v6** | Standard de facto, supporte les routes imbriquées façon "écrans" |
| State UI | **Zustand** | Léger, simple ; réservé à l'état d'interface (onglet actif, filtres...), pas aux données métier |
| Données métier | **Dexie React Hooks** (`useLiveQuery`) | Lecture réactive directe depuis IndexedDB, pas de duplication d'état |
| Graphiques | **Recharts** | Équivalent web de Victory Native, bonne intégration React |
| PDF | **pdf-lib** (ou jsPDF) | Génération 100% client, fonctionne offline |
| Scan code-barres | **BarcodeDetector API** + fallback **ZXing-js/Quagga** | API native quand disponible (Chrome/Edge/Android), fallback JS pour Safari/iOS |
| PWA / offline | **Workbox** (via `vite-plugin-pwa`) | Service Worker, cache des assets statiques, installabilité |
| Open Food Facts | **fetch direct navigateur** | L'API OFF autorise CORS ; pas besoin de proxy serveur |

---

## 4. Frontend — Application React (PWA)

### 4.1 Structure des écrans

```
screens/
├── onboarding/
│   └── ProfileSetupScreen.tsx    # données physiques + objectifs (premier lancement)
│
├── home/
│   └── HomeScreen.tsx            # résumé jour + accès rapides
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
│   └── BarcodeScanScreen.tsx     # BarcodeDetector API / ZXing
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
│   └── ExportScreen.tsx          # export PDF + export/import JSON (backup)
│
└── settings/
    └── SettingsScreen.tsx
```

### 4.2 Navigation (React Router v6)

```
AppRouter
├── "/"                    → HomeScreen
├── "/onboarding"          → ProfileSetupScreen (redirection si aucun profil local)
├── "/planning"            → WeekPlanScreen
├── "/planning/:date"      → DayDetailScreen
├── "/recipes"             → RecipeListScreen
├── "/recipes/:id"         → RecipeDetailScreen
├── "/ingredients"         → IngredientSearchScreen
├── "/ingredients/scan"    → BarcodeScanScreen
├── "/shopping"            → ShoppingListScreen
├── "/nutrition"           → DashboardScreen
├── "/analytics"           → AnalyticsScreen
├── "/export"              → ExportScreen
└── "/settings"            → SettingsScreen

BottomNav (mobile) : Accueil · Planning · Courses · Suivi · Paramètres
```

### 4.3 State management

L'état se répartit en deux couches distinctes :

- **Données métier (persistantes)** : jamais dans Zustand. Lues et écrites directement via les repositories Dexie (§6), avec `useLiveQuery` de `dexie-react-hooks` pour la réactivité — l'UI se met à jour automatiquement dès qu'une transaction IndexedDB change une donnée.
- **État UI (éphémère)** : onglet actif, filtres de recherche, semaine sélectionnée à l'écran, état des modales.

```typescript
// store/useUiStore.ts
interface UiStore {
  selectedDate: Date;
  ingredientSearchQuery: string;
  setSelectedDate: (date: Date) => void;
  setIngredientSearchQuery: (q: string) => void;
}

// hooks/useWeekPlan.ts — exemple de lecture réactive des données métier
export function useWeekPlan(weekStart: string) {
  return useLiveQuery(
    () => weekPlanRepository.getByWeekStart(weekStart),
    [weekStart]
  );
}
```

### 4.4 Bibliothèques principales

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "dexie": "^4.x",
    "dexie-react-hooks": "^1.x",
    "zustand": "^4.x",
    "recharts": "^2.x",
    "pdf-lib": "^1.x",
    "@zxing/browser": "^0.x",
    "date-fns": "^3.x",
    "framer-motion": "^11.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "vite-plugin-pwa": "^0.x",
    "typescript": "^5.x"
  }
}
```

---

## 5. Stockage local — IndexedDB (Dexie.js)

### 5.1 Schéma des stores

```typescript
// db/schema.ts
import Dexie, { type Table } from 'dexie';

export interface UserProfile {
  id?: number;                 // toujours 1 — profil unique local
  firstName: string;
  birthDate: string;           // ISO date
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm: number;
  weightKg: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  goal: 'LOSE' | 'MAINTAIN' | 'GAIN';
  targetCalories: number | null;   // null = calculé automatiquement
  macroProteinPct: number;
  macroCarbsPct: number;
  macroFatPct: number;
  compensationSpread: number;      // nb de jours pour compenser un écart
  updatedAt: string;
}

export interface Ingredient {
  id?: string;                 // uuid généré client
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  calories100g: number;
  proteins100g?: number;
  carbs100g?: number;
  sugars100g?: number;
  fat100g?: number;
  saturatedFat100g?: number;
  fiber100g?: number;
  salt100g?: number;
  glycemicIndex?: number;
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  allergens?: string[];
  offId?: string;               // Open Food Facts ID
  isCustom: boolean;
  createdAt: string;
}

export interface Recipe {
  id?: string;
  name: string;
  description?: string;
  servings: number;
  prepTimeMin?: number;
  cookTimeMin?: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isHealthy?: boolean;
  photoBlob?: Blob;             // photo stockée directement en IndexedDB
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id?: string;
  recipeId: string;
  ingredientId: string;
  quantityG: number;
  unitLabel?: string;           // "2 œufs", "1 c.à.s."
}

export interface WeekPlan {
  id?: string;
  weekStart: string;            // lundi de la semaine, ISO date
  notes?: string;
}

export interface MealSlot {
  id?: string;
  weekPlanId: string;
  slotDate: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  recipeId?: string;
  freeLabel?: string;
  portions: number;
  isDeviation: boolean;
  caloriesOverride?: number;
  isConsumed: boolean;
  consumedAt?: string;
}

export interface DailyLog {
  id?: string;
  logDate: string;
  totalCalories?: number;
  totalProteins?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFiber?: number;
  weightKg?: number;
  notes?: string;
}

export interface Deviation {
  id?: string;
  deviationDate: string;
  mealSlotId?: string;
  type: 'PLANNED' | 'UNPLANNED';
  label: string;
  caloriesExtra: number;
  compensationSpread: number;
  notes?: string;
  createdAt: string;
}

export interface ShoppingList {
  id?: string;
  weekPlanId?: string;
  name?: string;
  createdAt: string;
}

export interface ShoppingItem {
  id?: string;
  shoppingListId: string;
  ingredientId?: string;
  label: string;
  quantityG?: number;
  unitLabel?: string;
  category?: string;
  isChecked: boolean;
  isManual: boolean;
}

class MealingDB extends Dexie {
  userProfile!: Table<UserProfile, number>;
  ingredients!: Table<Ingredient, string>;
  recipes!: Table<Recipe, string>;
  recipeIngredients!: Table<RecipeIngredient, string>;
  weekPlans!: Table<WeekPlan, string>;
  mealSlots!: Table<MealSlot, string>;
  dailyLogs!: Table<DailyLog, string>;
  deviations!: Table<Deviation, string>;
  shoppingLists!: Table<ShoppingList, string>;
  shoppingItems!: Table<ShoppingItem, string>;

  constructor() {
    super('mealing');
    this.version(1).stores({
      userProfile: '++id',
      ingredients: 'id, name, barcode, category, isCustom',
      recipes: 'id, name, difficulty, isHealthy',
      recipeIngredients: 'id, recipeId, ingredientId',
      weekPlans: 'id, weekStart',
      mealSlots: 'id, weekPlanId, slotDate, [slotDate+mealType]',
      dailyLogs: 'id, logDate',
      deviations: 'id, deviationDate',
      shoppingLists: 'id, weekPlanId',
      shoppingItems: 'id, shoppingListId, category, isChecked',
    });
  }
}

export const db = new MealingDB();
```

### 5.2 Notes de conception

- Les `UUID` sont générés côté client (`crypto.randomUUID()`), ce qui élimine le besoin de round-trip serveur pour obtenir un id.
- La recherche textuelle full-text (GIN français en v1) est remplacée par un filtrage `startsWith`/`includes` en mémoire sur l'index `name` — largement suffisant pour un volume de données local (quelques milliers d'ingrédients maximum).
- Les migrations de schéma se gèrent via les versions Dexie (`this.version(2).stores({...}).upgrade(...)`), équivalent local de Flyway.
- Toutes les tables `TEXT[]` PostgreSQL (allergens, tags) deviennent simplement des tableaux JS sérialisés nativement par IndexedDB — pas de perte de fonctionnalité.

---

## 6. Couche d'accès aux données (Repositories)

Chaque module expose un repository TypeScript qui encapsule les requêtes Dexie — c'est l'équivalent direct des contrôleurs REST de la v1, mais appelé en local, sans réseau ni sérialisation JSON.

### 6.1 Repository Ingrédients

| Fonction | Description |
|---|---|
| `search(query: string)` | Recherche textuelle locale (nom, marque) |
| `getByBarcode(ean: string)` | Recherche par code-barres en base locale |
| `getById(id: string)` | Détail d'un ingrédient |
| `create(data)` | Créer un ingrédient custom (`isCustom: true`) |
| `update(id, data)` | Modifier |
| `delete(id)` | Supprimer (custom uniquement) |
| `importFromOFF(query: string)` | Recherche Open Food Facts (réseau), sans sauvegarde |
| `importFromOFFBarcode(ean: string)` | Import + sauvegarde locale automatique par code-barres |

### 6.2 Repository Recettes

| Fonction | Description |
|---|---|
| `list()` / `getById(id)` | Liste / détail |
| `create(data)` / `update(id, data)` / `delete(id)` | CRUD |
| `getNutrition(id)` | Valeurs nutritionnelles calculées (§8.4) |

### 6.3 Repository Planning

| Fonction | Description |
|---|---|
| `getWeek(weekStart: string)` | Planning de la semaine (crée si absent) |
| `addSlot(weekPlanId, slot)` / `updateSlot(slotId, data)` / `deleteSlot(slotId)` | Gestion des créneaux |
| `copyWeek(fromWeekStart, toWeekStart)` | Copier vers une autre semaine |
| `markConsumed(slotId)` | Marquer comme consommé |

### 6.4 Repository Liste de courses

| Fonction | Description |
|---|---|
| `generate(weekPlanId)` | Génère/regénère la liste depuis le planning (dédoublonnage + agrégation) |
| `addItem(listId, item)` | Ajouter un item manuel |
| `toggleCheck(itemId)` | Cocher/décocher |
| `deleteItem(itemId)` | Supprimer |

### 6.5 Repository Nutrition & Écarts

| Fonction | Description |
|---|---|
| `getLog(date: string)` / `updateLog(date, data)` | Log journalier |
| `getStats(from, to)` | Stats sur une période |
| `addDeviation(data)` | Déclarer un écart |
| `listDeviations()` | Historique |
| `getActiveCompensationPlan()` | Plan de compensation actif (§8.6) |

### 6.6 Repository Analytics

| Fonction | Description |
|---|---|
| `getDaily(date)` | Données graphiques journalières |
| `getWeekly(week)` | Données graphiques hebdomadaires |
| `getMonthly(month)` | Données graphiques mensuelles |
| `getTrends(period)` | Tendances poids + calories |

Toutes ces fonctions sont **synchrones/asynchrones locales** (Dexie retourne des `Promise`), sans transport HTTP, sans auth, sans gestion d'erreurs réseau — uniquement des erreurs de transaction IndexedDB (rares).

---

## 7. Intégration Open Food Facts

Appelée **directement depuis le navigateur**, l'API Open Food Facts autorisant CORS. Plus besoin de proxy serveur.

```typescript
// services/openFoodFacts.ts
const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export async function searchByName(query: string): Promise<IngredientDTO[]> {
  const url = new URL(`${OFF_BASE_URL}/search`);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('fields', 'product_name,nutriments,nutriscore_grade,allergens,code');
  url.searchParams.set('page_size', '20');

  const res = await fetch(url);
  if (!res.ok) throw new Error('Open Food Facts indisponible');
  const data = await res.json();
  return mapOFFProductsToIngredients(data.products);
}

export async function searchByBarcode(ean: string): Promise<IngredientDTO | null> {
  const res = await fetch(`${OFF_BASE_URL}/product/${ean}`);
  if (res.status === 404) return null;
  const data = await res.json();
  return data.product ? mapOFFProductToIngredient(data.product) : null;
}
```

### Flux de scan de code-barres

```
1. BarcodeScanScreen ouvre la caméra (getUserMedia)
   → BarcodeDetector natif si disponible (Chrome/Edge/Android)
   → sinon fallback @zxing/browser

2. EAN détecté → ingredientRepository.getByBarcode(ean)
   → trouvé en local → utiliser directement
   → absent → ingredientRepository.importFromOFFBarcode(ean)
      → appel réseau OFF
      → sauvegarde automatique locale
      → 404 OFF → proposer saisie manuelle
```

Champs mappés (identique à la v1) :

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

---

## 8. Module nutritionnel

*(Logique de calcul strictement identique à la v1 — indépendante de la stack technique.)*

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

Ces fonctions vivent dans `services/nutrition.ts`, pures et testables unitairement (aucune dépendance IO).

---

## 9. Module graphiques & analytics

### 9.1 Graphiques disponibles

*(Identique à la v1 — seule la librairie de rendu change.)*

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
- **Comparatif semaines** : bar chart des moyennes caloriques par semaine

#### Tendances générales
- **Moyenne mobile 7 jours** : calories lissées
- **Fréquence des écarts** : histogramme mensuel
- **Progression macros** : radar chart (protéines, glucides, lipides, fibres vs objectifs)

### 9.2 Implémentation Recharts

```tsx
// Exemple graphique calories semaine
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, ReferenceLine, Cell } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const WeeklyCaloriesChart = ({ data, target }: { data: DailyStat[]; target: number }) => (
  <ComposedChart width={340} height={220} data={data}>
    <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'EEE', { locale: fr })} />
    <YAxis />
    <Bar dataKey="calories">
      {data.map((d, i) => (
        <Cell
          key={i}
          fill={
            d.calories > target ? '#E74C3C' :
            d.calories > target * 0.9 ? '#F39C12' : '#2ECC71'
          }
        />
      ))}
    </Bar>
    <ReferenceLine y={target} stroke="#3498DB" strokeDasharray="4 4" />
  </ComposedChart>
);
```

### 9.3 Données calculées par le repository Analytics

```typescript
// analyticsRepository.getWeekly('2026-08-17')
{
  weekStart: '2026-08-17',
  dailyStats: [
    {
      date: '2026-08-17',
      calories: 1820,
      proteins: 95,
      carbs: 220,
      fat: 62,
      fiber: 28,
      target: 1900,
      isDeviation: false,
      isHealthyDay: true,
    },
    // ...
  ],
  weekSummary: {
    avgCalories: 1875,
    totalCalories: 13125,
    daysInTarget: 5,
    deviationsCount: 1,
    avgProteins: 98,
    avgCarbs: 225,
    avgFat: 65,
  },
}
```

Calculé en agrégeant `dailyLogs` + `mealSlots` via des requêtes Dexie (`.where('logDate').between(...)`), en mémoire, quasi instantané pour un volume de données local.

---

## 10. Export PDF

### 10.1 Contenu des PDFs générés

*(Identique à la v1.)*

#### Bilan semaine (PDF)
1. En-tête Mealing + semaine concernée + profil utilisateur
2. Résumé : total calories, moyenne/jour, jours dans l'objectif
3. Tableau jour par jour : repas planifiés, calories, macros
4. Graphique calories semaine (converti en image PNG via `recharts` + `canvas` avant insertion)
5. Graphique macros
6. Section écarts : tableau des écarts + compensation appliquée
7. Pied de page : date de génération

#### Liste de courses (PDF)
1. En-tête : semaine concernée
2. Liste groupée par rayon/catégorie avec quantités
3. Case à cocher pour chaque item (format imprimable)

### 10.2 Génération côté client (pdf-lib)

```typescript
// services/pdfExport.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateWeeklyReport(weekStart: string): Promise<Blob> {
  const data = await analyticsRepository.getWeekly(weekStart);
  const chartImage = await renderChartToPng(data.dailyStats); // via canvas offscreen

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText(`Bilan semaine du ${weekStart}`, { x: 40, y: 800, size: 18, font });
  page.drawText(`Moyenne : ${data.weekSummary.avgCalories} kcal/jour`, { x: 40, y: 770, size: 12, font });

  const png = await pdfDoc.embedPng(chartImage);
  page.drawImage(png, { x: 40, y: 500, width: 500, height: 250 });

  // ... tableau jour par jour, écarts, pied de page

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}
```

### 10.3 Téléchargement / partage sur mobile

```typescript
export async function exportAndShare(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    // Web Share API — ouvre le sélecteur natif Android/iOS (partage, impression, sauvegarde)
    await navigator.share({ files: [file], title: filename });
  } else {
    // Fallback desktop : téléchargement direct
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

Aucune dépendance native, aucun appel réseau — le PDF est généré et partagé entièrement offline.

---

## 11. Sauvegarde, export/import & confidentialité

### 11.1 Absence d'authentification

Comme les données ne quittent jamais l'appareil, il n'y a **aucun compte, mot de passe ni token**. Optionnellement, un verrou d'accès local (code PIN ou biométrie via `WebAuthn`) peut être ajouté en Phase 5 pour protéger l'accès à l'app sur un appareil partagé — sans lien avec un quelconque backend.

### 11.2 Export / Import JSON (backup manuel)

En l'absence de synchronisation cloud, l'utilisateur doit pouvoir sauvegarder et restaurer ses données manuellement.

```typescript
// services/backup.ts
export async function exportAllData(): Promise<Blob> {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    userProfile: await db.userProfile.toArray(),
    ingredients: await db.ingredients.toArray(),
    recipes: await db.recipes.toArray(),        // note : photoBlob exclu, exporté à part si besoin
    recipeIngredients: await db.recipeIngredients.toArray(),
    weekPlans: await db.weekPlans.toArray(),
    mealSlots: await db.mealSlots.toArray(),
    dailyLogs: await db.dailyLogs.toArray(),
    deviations: await db.deviations.toArray(),
    shoppingLists: await db.shoppingLists.toArray(),
    shoppingItems: await db.shoppingItems.toArray(),
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export async function importAllData(file: File): Promise<void> {
  const payload = JSON.parse(await file.text());
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      const rows = payload[table.name];
      if (rows) await table.bulkPut(rows);
    }
  });
}
```

- Accessible depuis `ExportScreen` → bouton "Exporter mes données" (télécharge un `.json`) et "Importer une sauvegarde" (input file).
- Recommandation affichée à l'utilisateur : exporter régulièrement, notamment avant de changer de téléphone ou de vider le cache du navigateur.
- Évolution possible (hors v1) : synchronisation optionnelle via un compte cloud (Cloudflare D1/R2 + Worker), activable sans remettre en cause le fonctionnement local-first par défaut.

### 11.3 Confidentialité

- Aucune donnée personnelle ou nutritionnelle ne transite par un serveur Mealing (il n'y en a pas).
- Seuls les appels à Open Food Facts (recherche de produit) sortent de l'appareil — aucune donnée utilisateur n'y est envoyée, uniquement des termes de recherche/codes-barres.
- HTTPS assuré nativement par Cloudflare Pages.

---

## 12. PWA — installation, offline & mises à jour

### 12.1 Manifest

```json
// public/manifest.webmanifest
{
  "name": "Mealing",
  "short_name": "Mealing",
  "description": "Planification de repas et suivi nutritionnel",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2ECC71",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 12.2 Service Worker (vite-plugin-pwa / Workbox)

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // fourni via public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'off-api-cache', expiration: { maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
});
```

- **App shell** (JS/CSS/HTML) mis en cache au premier chargement → l'application démarre offline dès la deuxième ouverture.
- **Données** : déjà 100% locales via IndexedDB, aucun cache réseau nécessaire pour le fonctionnement métier.
- **Mises à jour** : `autoUpdate` recharge la nouvelle version en arrière-plan et l'active au prochain démarrage, sans action utilisateur.
- **Installabilité** : bannière "Ajouter à l'écran d'accueil" proposée automatiquement par le navigateur (Chrome/Edge Android, Safari iOS via partage).

---

## 13. Déploiement — Cloudflare Pages

```yaml
# Build settings Cloudflare Pages
Build command: npm run build
Build output directory: dist
Root directory: /
```

- Déploiement automatique à chaque push sur `main` (preview deployments sur les autres branches/PR).
- CDN mondial, HTTPS automatique, aucune configuration serveur.
- Domaine personnalisé attachable directement depuis le dashboard Cloudflare.
- Pas de variables d'environnement secrètes nécessaires (pas de backend, pas de clé API — OFF est publique).

```toml
# wrangler.toml (optionnel, pour déploiement via CLI)
name = "mealing"
compatibility_date = "2026-08-01"

[env.production]
pages_build_output_dir = "dist"
```

---

## 14. Roadmap & phases de développement

### Phase 1 — Fondations (2-3 semaines)
- [ ] Setup Vite + React + TypeScript + vite-plugin-pwa
- [ ] Schéma Dexie complet (§5) + repositories de base (§6)
- [ ] Écran onboarding / profil + calcul TDEE (§8.1-8.3)
- [ ] Import seed d'aliments courants (50-100 aliments, bundle statique)
- [ ] Intégration Open Food Facts (recherche + scan)
- [ ] Déploiement initial sur Cloudflare Pages

### Phase 2 — Recettes & Planning (3-4 semaines)
- [ ] CRUD ingrédients (recherche, scan CB, custom)
- [ ] CRUD recettes avec calcul nutritionnel + photo (Blob)
- [ ] Planning hebdomadaire (repository + écran calendrier)
- [ ] Écran ajout recette à un créneau

### Phase 3 — Courses & Suivi (2 semaines)
- [ ] Génération liste de courses
- [ ] Écran liste de courses (cochage interactif)
- [ ] Log journalier (marquer repas consommés)
- [ ] Dashboard jour (anneau calories, macros)
- [ ] Gestion des écarts (prévu + imprévu) + compensation

### Phase 4 — Analytics & Export (2 semaines)
- [ ] Repository analytics (jour / semaine / mois)
- [ ] Écrans graphiques (Recharts) — semaine, mois, tendances
- [ ] Génération PDF client (pdf-lib) — bilan semaine + liste de courses
- [ ] Web Share API pour export/partage

### Phase 5 — PWA, Finitions & UX (2 semaines)
- [ ] Peaufinage manifest/icônes/installabilité
- [ ] Stratégies de cache Workbox (app shell + OFF API)
- [ ] Export/Import JSON (backup) — §11.2
- [ ] Verrou d'accès optionnel (PIN/WebAuthn)
- [ ] Paramètres (thème, objectifs, allergènes)
- [ ] Tests (Vitest + Testing Library)
- [ ] Audit Lighthouse PWA (installabilité, performance, offline)

---

*Document généré pour le projet Mealing — Tous droits réservés*
