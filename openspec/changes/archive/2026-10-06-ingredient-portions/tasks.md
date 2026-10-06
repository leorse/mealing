# Tasks

> Pas de framework de test : les fonctions pures se vérifient par script, les écrans par observation dans `npm run dev`. Puis `npm run lint` et `npm run build`.
> Avant de coder : lire `docs/design/recipe-form.md` et `docs/design/components.md`.

## 1. Données

- [x] 1.1 Ajouter `unitCount?: number` à `RecipeIngredient` dans `src/db/schema.ts` et à `RecipeIngredientInput`, sans toucher à `db.version(1).stores(...)` ; vérifier par `npm run build`
- [x] 1.2 Ajouter `ensureCiqualPortions()` à `src/db/seed.ts` (clé `ciqualPortionsSeededAt`, aliments `CIQUAL` sans `portionG` uniquement) et l'appeler au lancement après le chargement initial ; vérifier dans les outils du navigateur qu'une base déjà chargée reçoit les portions et qu'une portion corrigée n'est pas écrasée
- [x] 1.3 Ajouter `setPortion(id, { portionG, portionLabel })` à `ingredientRepository.ts`, avec recalcul en transaction du `quantityG` des lignes à `unitCount` de cet aliment ; vérifier qu'une ligne en grammes n'est pas touchée
- [x] 1.4 Documenter `unitCount`, `setPortion` et la mise à niveau dans `docs/architecture/data-model.md`

## 2. Conversions et affichage

- [x] 2.1 Créer `src/services/portions.ts` (`hasOwnUnit`, `gramsFor`, `pluralizeUnit`, `formatQuantity`) et vérifier par script les cas de la spec : « 3 saucisses (390 g) », « 1 œuf (50 g) », « 2 c. à soupe (20 g) », « 0,5 avocat (70 g) », « 2 morceaux (10 g) », « 390 g »
- [x] 2.2 Décrire les règles (grammes = vérité, mode par défaut, accord, effet d'une correction) dans `docs/architecture/domain-rules.md`

## 3. Fenêtre d'ajout d'ingrédient

- [x] 3.1 Ajouter la bascule « g » / unité, le champ adapté au mode et la ligne d'équivalence ; vérifier le mode et la valeur par défaut pour un aliment à unité propre, à « portion » générique, et sans portion
- [x] 3.2 Convertir la valeur au changement de mode et remettre les valeurs par défaut au changement d'aliment ; vérifier « 3 saucisses → 390 g → 3 saucisses »
- [x] 3.3 Ajouter la zone de correction de l'unité (nom et poids, refus d'un poids nul ou vide et d'un nom vide), branchée sur `setPortion` ; vérifier que la correction est proposée à la sélection suivante
- [x] 3.4 Étendre `onConfirm` à `{ ingredient, quantityG, unitCount? }` et vérifier qu'une demi-unité est acceptée
- [x] 3.5 Ajouter à `src/index.css` la mise en page de la zone de quantité, en couleurs système ; vérifier en thème clair et sombre à largeur mobile, puis compléter `docs/design/components.md`

## 4. Formulaire et détail du plat

- [x] 4.1 Porter `unitCount` dans le brouillon de `RecipeFormScreen`, à l'ajout, au chargement d'un plat et à l'enregistrement ; vérifier qu'un plat à « 3 saucisses » se rouvre en unités
- [x] 4.2 Rendre une ligne en unités (nombre, nom accordé, équivalent en grammes) et recalculer `quantityG` à la correction du nombre ; vérifier que la ligne en grammes est inchangée
- [x] 4.3 Reprendre dans le brouillon un aliment dont l'unité vient d'être corrigée dans la fenêtre ; vérifier que la ligne déjà présente affiche le nouveau poids
- [x] 4.4 Afficher les ingrédients par `formatQuantity` dans `RecipeDetailScreen` ; vérifier un plat mêlant unités et grammes, et un plat antérieur

## 5. Contrôle d'ensemble

- [x] 5.1 Corriger l'unité d'un aliment utilisé par deux plats, l'un en unités, l'autre en grammes ; vérifier que seul le premier change, et que ses valeurs nutritionnelles suivent
- [x] 5.2 Vérifier que le planning et la liste de courses lisent les nouveaux grammes sans modification
- [x] 5.3 Parcourir les scénarios des deux specs, exécuter `npm run lint` et `npm run build` sans nouvelle erreur, puis ajouter une ligne à `docs/log.md`
