# Proposal

## Why

Au planning, la fenêtre de choix présente tous les plats enregistrés à égalité, par ordre alphabétique. Les plats qu'on cuisine sans cesse s'y perdent parmi les autres, et il faut les rechercher à chaque ajout.

Par ailleurs, l'interface parle tantôt de « recette », tantôt de « plat », alors que l'application gère aussi des plats tout prêts qui n'ont rien d'une recette. « Plat » couvre les deux et doit devenir le mot unique à l'écran.

## What Changes

- Sur la liste des plats, chaque plat — maison ou tout prêt — porte un **cœur**. Il est **vide** par défaut, **rempli en rouge** quand le plat est favori. Un clic bascule l'état, sans ouvrir le plat.
- Le favori est enregistré sur le plat et survit au rechargement.
- Dans la fenêtre de choix du planning, les **favoris apparaissent en premier**, par ordre alphabétique, puis les autres plats, par ordre alphabétique. La recherche conserve cet ordre. Chaque plat proposé y porte aussi son cœur, cliquable, pour marquer un favori sans quitter le planning.
- À l'écran, le mot **« recette » devient « plat »** partout : onglet de navigation, titres, champs de recherche, messages, confirmations, bascule de la fenêtre du planning (« Plat / Écart »). Un plat fait maison se dit « plat maison ».

Pas de changement cassant : les plats existants ne sont pas favoris.

## Capabilities

### New Capabilities

- `dish-catalog`: la liste des plats enregistrés — vocabulaire employé à l'écran et marquage des favoris.

### Modified Capabilities

- `meal-planning`: le mode « Recette » de la fenêtre de choix devient le mode « Plat », et les favoris y sont proposés en premier.

## Impact

- `src/db/schema.ts` : un champ booléen optionnel non indexé sur `Recipe`. Aucune migration Dexie.
- `src/db/repositories/recipeRepository.ts` : bascule du favori.
- `src/screens/recipes/RecipeListScreen.tsx` : cœur sur chaque plat.
- `src/components/MealPickerModal.tsx` : tri des favoris en tête, libellés.
- Libellés à l'écran : `AppLayout.tsx`, `RecipeListScreen.tsx`, `RecipeDetailScreen.tsx`, `RecipeFormScreen.tsx`, `MealPickerModal.tsx`.
- `public/icons/common/` : le cœur, en version contour et en version pleine.
- `docs/` : vocabulaire, icônes, modèle de données, journal.
- Hors périmètre : renommer le code (types `Recipe`, dossiers `recipes/`, repository) et les adresses (`/recipes`), qui ne s'affichent pas dans l'application installée ; un cœur sur l'écran de détail ; un tri ou un filtre des favoris dans la liste des plats.
