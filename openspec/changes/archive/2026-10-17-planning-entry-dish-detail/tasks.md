# Tasks

## 1. Fiche partagée

- [x] 1.1 Extraire le contenu de `RecipeDetailScreen` dans `RecipeDetailView` (prop `recipeId`) et faire utiliser ce composant par l'écran. Vérifier que la fiche d'un plat maison, d'un plat tout prêt et d'un plat créé par l'IA est identique à avant, et que modifier / supprimer fonctionnent toujours.

## 2. Fenêtre à deux onglets

- [x] 2.1 Découper `MealPickerModal` en un corps réutilisable et son enveloppe, sans changer son comportement. Vérifier l'ajout d'un repas, l'édition d'un écart et le remplacement d'un plat comme avant (`npm run lint`, `npm run build`).
- [x] 2.2 Créer `PlanEntryModal` : onglets « Plat » (par défaut, `RecipeDetailView` en lecture seule) et « Remplacer » (corps du sélecteur pré-rempli) ; plat introuvable géré ; Échap et fond ferment. Vérifier dans l'app qu'un nom long s'affiche en entier et qu'un remplacement met l'entrée à jour sans doublon.
- [x] 2.3 `WeekPlanScreen` : entrée avec plat → `PlanEntryModal`, entrée d'écart → `MealPickerModal` direct. Vérifier les deux cas, en thème clair et sombre, et la mise en page étroite.

## 3. Documentation

- [x] 3.1 Mettre à jour `docs/design/components.md` (`RecipeDetailView`, `PlanEntryModal`) et `docs/log.md`, puis `npm run lint` et `npm run build`.
