# Proposal

## Why

Le planning hebdomadaire ne sait pas se servir des recettes. Ajouter un repas ouvre un écran plein (`/planning/:date/add`) où tout se retape à la main : un nom libre et un nombre de calories. Le champ `recipeId` du créneau existe pourtant dans le schéma depuis le début, et n'est jamais écrit — la bibliothèque de recettes et le planning s'ignorent.

Deuxième limite : un créneau de repas ne retient qu'une seule entrée. Dès qu'un plat est posé, le bouton d'ajout disparaît et il devient impossible de noter, par exemple, un plat **et** un écart sur le même déjeuner.

## What Changes

- L'ajout d'un repas se fait dans une fenêtre, et non plus sur un écran séparé ; la route `/planning/:date/add` disparaît.
- La fenêtre porte un choix **Recette / Écart** :
  - en mode Recette, on choisit une recette ou un plat tout prêt parmi ceux enregistrés, et les calories se remplissent automatiquement ;
  - en mode Écart, la recette est ignorée : nom et calories se saisissent à la main.
- Le champ calories reste modifiable dans les deux modes, et se met à jour tant que la validation n'a pas eu lieu.
- Un créneau de repas peut contenir **plusieurs entrées** ; le bouton d'ajout reste disponible après le premier ajout.
- Cliquer une entrée existante rouvre la fenêtre en modification.
- Chaque entrée porte une action de **suppression** directement dans la grille.
- La fenêtre reprend la direction artistique de l'écran de recette : mêmes surfaces, mêmes boutons, même vert, mêmes icônes.

Pas de changement cassant : les créneaux déjà enregistrés restent valides et s'affichent comme avant.

## Capabilities

### New Capabilities

- `meal-planning`: composition du planning hebdomadaire — ce qu'un créneau de repas contient, d'où viennent ses calories, et comment on l'alimente.

### Modified Capabilities

<!-- Aucune. La fenêtre réutilise les surfaces déjà couvertes par `theming`,
     sans nouvelle exigence de thème. -->

## Impact

- `src/screens/planning/WeekPlanScreen.tsx` : plusieurs entrées par créneau, bouton d'ajout permanent, ouverture de la fenêtre en ajout comme en modification.
- Nouveau composant de fenêtre de choix de repas, dans `src/components/`.
- `src/app/router.tsx` et `src/screens/planning/AddMealScreen.tsx` : la route et l'écran d'ajout sont retirés.
- `src/db/repositories/planningRepository.ts` : `addSlotForWeek` et `updateSlot` existent déjà et suffisent.
- `src/services/nutrition.ts` : réutilisé pour calculer les calories par portion d'une recette maison.
- `src/index.css` : styles réutilisés de la fenêtre de sélection d'ingrédient, complétés pour le choix de mode.
- `deleteSlot` existe déjà dans le dépôt de données et couvre la suppression, initialement écartée puis réintégrée au périmètre.
- Hors périmètre : `DayDetailScreen`, aujourd'hui un simple « À venir ».
