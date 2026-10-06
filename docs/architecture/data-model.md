---
type: Data Model
title: Modèle de données et repositories
description: Tables IndexedDB (Dexie), relations, repositories et règles de migration du schéma.
resource: ../../src/db/schema.ts
tags: [architecture, dexie, indexeddb, repositories]
timestamp: 2026-10-04T00:00:00Z
---
# Modèle de données

Base Dexie `mealing`, **version 1**, définie dans [db/schema.ts](../../src/db/schema.ts). Les interfaces TypeScript du même fichier sont les types du domaine pour toute l'application.

## Tables

| Table | Clé | Index | Rôle |
|---|---|---|---|
| `userProfile` | `++id` (toujours `1`) | — | Profil unique : mensurations, activité, objectif, répartition des macros |
| `ingredients` | `id` (uuid) | `name, barcode, category, isCustom` | Aliments ; `source` : `CIQUAL`, `OFF` ou `CUSTOM` |
| `recipes` | `id` | `name, difficulty, isHealthy` | Plats maison (`kind: 'RECIPE'`) et plats tout prêts (`kind: 'PREPARED'`) |
| `recipeIngredients` | `id` | `recipeId, ingredientId` | Lignes d'une recette : ingrédient + `quantityG` |
| `weekPlans` | `id` | `weekStart` | Une semaine, identifiée par son lundi `AAAA-MM-JJ` |
| `mealSlots` | `id` | `weekPlanId, slotDate, [slotDate+mealType]` | Une entrée du planning |
| `dailyLogs` | `id` | `logDate` | Journal quotidien (pas encore utilisé) |
| `deviations` | `id` | `deviationDate` | Écarts (pas encore utilisé) |
| `shoppingLists` / `shoppingItems` | `id` | `weekPlanId` / `shoppingListId, category, isChecked` | Courses (pas encore utilisé) |
| `appMeta` | `key` | — | Clés techniques (`ciqualSeededAt`) |

## Points à connaître

- **`Ingredient.portionG` / `portionLabel`** (non indexés, optionnels) : poids estimé d'une portion ou d'une unité usuelle (« 1 saucisse = 130 g », « 1 c. à soupe = 10 g »). Renseignés pour les 3 281 aliments Ciqual par les colonnes `portion_g` / `portion_label` de `assets/ciqual.sql` ; ce sont des moyennes indicatives, pas des données Ciqual. Corrigés par `ingredientRepository.setPortion`, qui recalcule en transaction le `quantityG` des lignes de plats comptées en unités.
- **`RecipeIngredient.unitCount`** (non indexé, optionnel) : présent quand la ligne a été saisie en unités. `quantityG` reste la vérité de tous les calculs et vaut alors `unitCount × portionG`. Le nom de l'unité n'est pas copié : il est lu sur l'aliment.
- **Mise à niveau des portions** : `ensureCiqualPortions` (clé `ciqualPortionsSeededAt`) les apporte au lancement aux aliments `CIQUAL` qui n'en ont pas, sans écraser une portion existante.
- **`Recipe.kind`** change tout : `RECIPE` calcule ses valeurs depuis ses ingrédients et porte `prepTimeMin`, `cookTimeMin`, `difficulty`, `isHealthy` ; `PREPARED` n'a pas d'ingrédients et stocke `caloriesPerServing` (obligatoire) et les macros par portion, saisis à la main.
- **`Recipe.isFavorite`** (non indexé, absent = non favori) : basculé par `recipeRepository.setFavorite`, qui ne touche pas `updatedAt`. Hors de `RecipeInput`, il survit à l'enregistrement du formulaire.
- **`MealSlot`** : plusieurs entrées possibles pour un même jour et un même `mealType`. `freeLabel` porte le nom affiché (y compris pour une recette), `caloriesOverride` porte les calories retenues, `isDeviation` distingue un écart d'une recette, `includeInShopping` (non indexé, absent = faux) marque le plat pour les courses, et `shoppingItemStates` (non indexé) porte l'état de ses articles dans la liste : clé = identifiant d'ingrédient (ou de la recette pour un plat tout prêt), valeur `'OFF'` (grisé) ou `'DELETED'` ; un article absent est actif.
- **Identifiants** : `crypto.randomUUID()` généré par le repository, jamais par l'écran.
- **Horodatages** (`createdAt`, `updatedAt`, `consumedAt`) : instants, donc `new Date().toISOString()`. Les **jours civils** (`slotDate`, `weekStart`, `logDate`) suivent la [convention de dates](domain-rules.md#dates).

## Repositories

Un fichier par agrégat dans [db/repositories/](../../src/db/repositories/), fonctions nommées exportées une à une :

| Fichier | Fonctions |
|---|---|
| `userProfileRepository.ts` | `getProfile`, `saveProfile` |
| `ingredientRepository.ts` | `search` (50 résultats max, nom ou marque), `getByBarcode`, `getById`, `getByIds`, `create` (custom), `saveImported` (OFF), `update`, `remove` (custom uniquement) |
| `recipeRepository.ts` | `list`, `getById`, `getByIds`, `getIngredients`, `getIngredientsForRecipes`, `create`, `update`, `remove` |
| `planningRepository.ts` | `getWeek`, `ensureWeek`, `listSlotsForWeek`, `addSlot`, `addSlotForWeek`, `updateSlot`, `deleteSlot`, `markConsumed`, `copyWeek` ; courses : `listShoppingSlots`, `setSlotShopping`, `setShoppingItemStates`, `clearShoppingList` |

Règles :

- Les noms sont génériques (`getById`, `create`) : à l'import, les renommer en cas de collision (`getById as getIngredientById`).
- Une écriture touchant plusieurs tables se fait dans `db.transaction('rw', …)` (voir `recipeRepository.create`).
- **Lecture pure ou écriture, jamais les deux** : `getWeek` ne crée rien et peut servir dans `useLiveQuery` ; `ensureWeek` crée la semaine et est réservé aux écritures. Une écriture dans une requête réactive provoque une boucle.
- Supprimer une recette supprime ses `recipeIngredients` dans la même transaction.
- La pastille de courses se bascule par `setSlotShopping`, jamais par `updateSlot` : elle remet à zéro l'état des articles du plat.
- Les tables `shoppingLists` et `shoppingItems` ne servent pas : la liste de courses est **dérivée** des créneaux marqués (voir [domain-rules.md](domain-rules.md#liste-de-courses)).

## Faire évoluer le schéma

- **Champ optionnel non indexé** : l'ajouter à l'interface suffit, sans nouvelle version. Les anciennes lignes ne l'ont pas ; le lire comme absent (cas de `includeInShopping`).
- **Nouvel index ou nouvelle table** : ajouter `this.version(2).stores({...})` (et `.upgrade()` si des données doivent être converties). Ne jamais modifier la déclaration de la version 1.
- Penser à [services/backup.ts](../../src/services/backup.ts), qui exporte et réimporte toutes les tables par leur nom.

## Sources d'ingrédients

- **Ciqual** : chargé au premier lancement (voir [overview.md](overview.md#démarrage)).
- **Open Food Facts** : `searchByName`, `searchByBarcode` dans [services/openFoodFacts.ts](../../src/services/openFoodFacts.ts) renvoient des `ImportedIngredient` à enregistrer avec `ingredientRepository.saveImported`.
