# Design

## Context

`WeekPlanScreen` ouvre `MealPickerModal` (avec `slot`) au clic sur `.meal-entry`, quelle que soit l'entrée. La fiche d'un plat vit entièrement dans `RecipeDetailScreen` (lecture par `useParams`, requête réactive, rendu, boutons modifier / supprimer). Voir proposal.md pour la motivation.

## Goals / Non-Goals

**Goals:**
- Une seule implémentation de l'affichage de la fiche, utilisée par l'écran Plats et par la fenêtre du planning.
- Garder `MealPickerModal` tel quel pour le remplacement.

**Non-Goals:**
- Modifier ou supprimer le plat depuis le planning.
- Changer la fenêtre d'ajout (« + »), ni le comportement des entrées d'écart.

## Decisions

- **Extraire `RecipeDetailView`** (composant dans `src/components/`) : prend `recipeId`, fait la requête réactive et rend titre, description, origine IA, badges, ingrédients, nutrition. `RecipeDetailScreen` l'utilise et garde ses actions (modifier, supprimer, confirmation) ; la fenêtre du planning l'utilise sans actions. *Alternative* : dupliquer le rendu — rejetée, les deux affichages divergeraient. *Alternative* : ouvrir la route `/recipes/:id` — rejetée, quitte le planning.
- **Nouvelle fenêtre `PlanEntryModal`** : onglets « Plat » / « Remplacer » (classe `mode-toggle` déjà utilisée par la fenêtre IA). L'onglet « Remplacer » rend le contenu de `MealPickerModal`. Pour ne pas imbriquer deux cartes de fenêtre, `MealPickerModal` est découpé : son corps devient un composant réutilisable (`MealPickerBody`), `MealPickerModal` l'enveloppe comme avant pour l'ajout et pour l'écart.
- **Routage dans `WeekPlanScreen`** : `editing` avec `recipeId` → `PlanEntryModal` ; sans (écart) → `MealPickerModal` comme aujourd'hui.
- **Nom complet** : la fiche affiche le nom dans un `h1` qui passe à la ligne (pas de `text-overflow`), donc lisible en entier.
- **Fermeture** : Échap et clic sur le fond ferment, comme les autres fenêtres. Les valeurs saisies dans « Remplacer » sont perdues à la fermeture (annulation).

## Risks / Trade-offs

- [Découper `MealPickerModal` peut casser l'ajout et l'écart] → refactor sans changement de comportement, vérifié à la main (ajout, édition d'écart, remplacement).
- [Fiche haute dans une fenêtre] → corps défilant dans la carte, sans défilement de la page.
- [Plat supprimé] → message « introuvable », onglet « Remplacer » toujours accessible.
