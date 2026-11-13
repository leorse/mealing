# Proposal

## Why

Dans le planning, toucher un plat déjà posé ouvre directement la fenêtre de choix d'un autre plat, comme le « + ». Or le nom y est tronqué : impossible de lire un titre long en entier ni de distinguer deux plats qui commencent par les mêmes mots, et on ne voit pas ce que le plat contient.

## What Changes

- Toucher une entrée du planning qui référence un plat (maison ou tout prêt) ouvre une fenêtre à deux onglets :
  - **« Plat »** (affiché à l'ouverture) : le contenu du plat, avec le même affichage que la fiche d'un plat de l'écran Plats (nom complet, description, badges, ingrédients, valeurs nutritionnelles).
  - **« Remplacer »** : la fenêtre de choix actuelle (changer de plat, calories, mode Écart), inchangée.
- Une entrée d'écart (sans plat) garde le comportement actuel : elle ouvre directement la fenêtre de modification.
- La fiche d'un plat devient un composant partagé entre l'écran Plats et cette fenêtre, pour que les deux affichages ne divergent jamais.

## Capabilities

### New Capabilities

### Modified Capabilities
- `meal-planning`: l'activation d'une entrée de plat ouvre d'abord la fiche du plat, le remplacement passant par un second onglet.

## Impact

- `src/screens/recipes/RecipeDetailScreen.tsx` : extraction du contenu de la fiche dans un composant réutilisable.
- `src/components/` : nouvelle fenêtre d'entrée de planning à deux onglets ; `MealPickerModal.tsx` réutilisé pour l'onglet « Remplacer ».
- `src/screens/planning/WeekPlanScreen.tsx` : l'ouverture d'une entrée choisit la fenêtre selon que l'entrée porte un plat ou un écart.
- `docs/design/components.md`, `docs/log.md` ; aucun changement de schéma.
