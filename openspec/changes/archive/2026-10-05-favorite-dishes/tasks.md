# Tasks

> Pas de framework de test : vérification par observation dans `npm run dev`, plus `npm run lint` et `npm run build`.

## 1. Données

- [x] 1.1 Ajouter `isFavorite?: boolean` à `Recipe` dans `src/db/schema.ts`, sans toucher à `db.version(1).stores(...)`, et vérifier que l'application démarre sur une base existante sans erreur Dexie
- [x] 1.2 Ajouter `setFavorite(id, isFavorite)` à `recipeRepository.ts`, sans modifier `updatedAt`, et vérifier que l'enregistrement du formulaire conserve le favori
- [x] 1.3 Documenter le champ et la fonction dans `docs/architecture/data-model.md`

## 2. Icônes

- [x] 2.1 Copier `assets/heart.svg` en `public/icons/common/heart.svg` et créer `heart-filled.svg` au même tracé, rempli ; vérifier que les deux s'affichent à la même taille par `MaskIcon`
- [x] 2.2 Ajouter le cœur à l'inventaire et au tableau « une icône, un sens » de `docs/design/icons.md`

## 3. Liste des plats

- [x] 3.0 Créer `src/components/FavoriteButton.tsx` (cœur contour ou plein rouge, `aria-pressed`, `aria-label` et `title` nommant le plat) et l'ajouter à `docs/design/components.md`
- [x] 3.1 Ajouter le bouton cœur entre le lien et la corbeille de chaque plat : contour en `currentColor` si non favori, plein rouge si favori, `aria-pressed`, `aria-label` et `title` nommant le plat ; vérifier qu'un clic bascule l'état sans ouvrir le plat
- [x] 3.2 Vérifier le cœur sur un plat tout prêt, la persistance après rechargement, et la lisibilité en thème clair et sombre

## 4. Fenêtre du planning

- [x] 4.1 Trier dans `MealPickerModal` la liste filtrée : favoris d'abord, puis par nom ; vérifier l'ordre « Bolognaise, Tajine, Andouillette, Ratatouille » du scénario
- [x] 4.2 Ajouter le cœur cliquable à côté de chaque plat proposé, en bouton frère du résultat ; vérifier qu'un clic bascule le favori sans choisir le plat, que le plat garde sa place, et que l'ordre change à la réouverture
- [x] 4.3 Vérifier que la recherche garde les favoris en tête et qu'un favori marqué dans la fenêtre apparaît rouge dans la liste des plats

## 5. Vocabulaire

- [x] 5.1 Remplacer chaque texte affiché ou annoncé contenant « recette » selon la table de `design.md`, dans `AppLayout.tsx`, `RecipeListScreen.tsx`, `RecipeDetailScreen.tsx`, `RecipeFormScreen.tsx` et `MealPickerModal.tsx`
- [x] 5.2 Vérifier par `graft grep "[Rr]ecette" --in src/` qu'il ne reste plus le mot que dans des commentaires et identifiants
- [x] 5.3 Ajouter à `docs/workflow/conventions.md` la règle de vocabulaire (« plat » à l'écran, `Recipe` dans le code) et mettre à jour le libellé de l'onglet dans `docs/architecture/routing.md`

## 6. Contrôle d'ensemble

- [x] 6.1 Parcourir les scénarios de `specs/dish-catalog/spec.md` et `specs/meal-planning/spec.md`
- [x] 6.2 Exécuter `npm run lint` et `npm run build` sans nouvelle erreur, puis ajouter une ligne à `docs/log.md`
