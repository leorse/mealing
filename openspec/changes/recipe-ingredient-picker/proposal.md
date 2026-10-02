# Proposal

## Why

Sur l'écran de saisie d'une recette, les ingrédients se cherchent dans un champ posé au milieu du formulaire : la liste de suggestions s'insère dans le flux et repousse le reste du contenu à chaque frappe. L'écran bouge sous les doigts pendant la saisie, la liste de résultats n'a pas de hauteur à elle, et elle allonge un formulaire déjà trop haut.

Déplacer le choix d'un ingrédient dans une fenêtre dédiée stabilise l'écran de recette et donne enfin à la liste de résultats une zone de défilement propre.

## What Changes

- L'écran de recette perd son champ de recherche d'ingrédient en ligne et sa liste de suggestions dans le flux.
- La zone « Ingrédients » présente un bouton d'ajout qui ouvre une fenêtre de sélection.
- La fenêtre de sélection contient un champ de recherche, une liste de résultats défilante, un champ de quantité, et une validation explicite (valider / annuler).
- La ligne d'un ingrédient déjà ajouté conserve son champ de quantité modifiable et son bouton de suppression — comportement inchangé.
- Un ingrédient déjà présent dans la recette est signalé comme tel dans la fenêtre au lieu d'être ignoré en silence.
- La fenêtre et la zone d'ingrédients respectent le thème clair/sombre du système : plus de couleurs codées en dur pour les bordures et les séparateurs.

Pas de changement cassant : les recettes existantes, le calcul nutritionnel et la liste de courses ne sont pas affectés.

## Capabilities

### New Capabilities

- `recipe-authoring`: composition d'une recette — ajout, quantification et retrait de ses ingrédients.
- `theming`: respect du thème clair/sombre du système par les surfaces de l'interface.

### Modified Capabilities

<!-- Aucune : le projet n'a pas encore de spec existante. -->

## Impact

- `src/screens/recipes/RecipeFormScreen.tsx` : suppression de la recherche en ligne, ajout du bouton d'ouverture et du raccordement à la fenêtre.
- Nouveau composant de fenêtre de sélection d'ingrédient, dans `src/components/`.
- `src/index.css` : styles de la fenêtre et de la zone d'ingrédients ; remplacement des `#ddd` / `#eee` de cette zone par des couleurs système.
- Inchangés : `src/db/repositories/ingredientRepository.ts` (`search` est réutilisée telle quelle), `src/db/repositories/recipeRepository.ts`, `src/services/nutrition.ts`.
- L'écran sert à la fois la création (`/recipes/new`) et l'édition (`/recipes/:id/edit`) : les deux parcours changent de la même façon.
- Le type « plat tout prêt » ne comporte pas d'ingrédients et n'est pas concerné.
