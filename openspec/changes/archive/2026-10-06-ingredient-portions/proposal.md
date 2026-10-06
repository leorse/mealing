# Proposal

## Why

Un plat maison ne se compose aujourd'hui qu'en grammes. Or on cuisine « 3 saucisses », « 2 œufs » ou « 1 cuillère à soupe d'huile », pas « 390 g de saucisse » : il faut peser ou calculer de tête à chaque ingrédient.

Les 3 281 aliments Ciqual portent désormais une portion estimée (« 1 saucisse = 130 g »), mais aucun écran ne s'en sert, et une application déjà installée ne les a même pas reçues.

## What Changes

- Dans la fenêtre d'ajout d'ingrédient, une fois l'aliment choisi, la quantité se saisit **en grammes ou en unités** (« saucisse », « œuf », « c. à soupe »…). L'équivalent en grammes est affiché en permanence.
- Un aliment qui a une unité propre est proposé **en unités par défaut** ; un aliment qui n'a qu'une « portion » générique, ou aucune portion, reste en grammes par défaut.
- Dans la liste d'ingrédients du plat, chaque ligne garde son mode : « 3 saucisses (390 g) » se corrige en nombre, « 60 g » se corrige en grammes.
- L'unité d'un aliment — son **nom et son poids** — se corrige depuis la fenêtre d'ajout. La correction est retenue pour cet aliment et sert à toutes les saisies suivantes. Un aliment sans portion (aliment personnel, import) peut en recevoir une de la même façon.
- Corriger le poids d'une unité **met à jour les plats** qui comptent cet aliment en unités : « 3 saucisses » reste « 3 saucisses », au nouveau poids. Les plats saisis en grammes ne bougent pas.
- Le détail d'un plat affiche les ingrédients comme ils ont été saisis, avec leur équivalent en grammes.
- Les portions estimées sont **apportées aux installations existantes** au lancement, sans écraser une portion déjà corrigée.

Pas de changement cassant : les plats existants restent en grammes, à l'identique.

## Capabilities

### New Capabilities

- `ingredient-portions`: l'unité usuelle d'un aliment et son poids — d'où ils viennent, comment ils se corrigent, comment ils s'affichent, et ce qu'une correction change aux plats.

### Modified Capabilities

- `recipe-authoring`: la quantité d'un ingrédient se saisit et se corrige en grammes ou en unités, au lieu des grammes seuls.

## Impact

- `src/db/schema.ts` : un champ optionnel non indexé sur `RecipeIngredient` (nombre d'unités). `Ingredient.portionG` / `portionLabel` existent déjà. Aucune migration Dexie.
- `src/db/seed.ts` : mise à niveau des portions sur une base déjà chargée.
- `src/db/repositories/ingredientRepository.ts` : enregistrement d'une portion, avec recalcul des plats concernés ; `recipeRepository.ts` : le nombre d'unités voyage avec la ligne d'ingrédient.
- `src/services/portions.ts` (nouveau) : conversion unités ↔ grammes, accord et mise en forme d'une quantité.
- `src/components/IngredientPickerModal.tsx`, `src/screens/recipes/RecipeFormScreen.tsx`, `RecipeDetailScreen.tsx` : saisie, correction et affichage.
- `src/index.css` : mise en page de la zone de quantité ; la bascule existante est réutilisée.
- `docs/` : modèle de données, règles métier, composants, journal.
- Hors périmètre : afficher des unités dans la liste de courses (elle reste en grammes), plusieurs unités pour un même aliment, les portions des produits Open Food Facts, un écran de gestion des aliments.
