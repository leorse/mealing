# Tasks

## 1. Données et calcul

- [x] 1.1 Ajouter la lecture pure `listCustom()` à `src/db/repositories/ingredientRepository.ts` (aliments `isCustom`) ; vérifier que `npm run build` passe
- [x] 1.2 Ajouter à `src/services/nutrition.ts` une fonction pure indiquant qu'un aliment personnel n'a aucune valeur renseignée (calories, protéines, glucides, lipides nuls ou absents) ; vérifier qu'elle renvoie faux pour un aliment Ciqual à 0 kcal
- [x] 1.3 Mettre à jour `docs/architecture/data-model.md` (`listCustom`, usage de `create` / `update` pour les aliments personnels) et `docs/architecture/domain-rules.md` (valeurs à zéro par défaut, règle de signalement) ; relire que la description correspond au code

## 2. Champs de valeurs nutritionnelles

- [x] 2.1 Créer un composant partagé des quatre champs pour 100 g (calories, protéines, glucides, lipides), avec les mêmes libellés que le plat tout prêt, minimum 0, champ vide = 0 ; vérifier qu'il s'affiche en clair et en sombre
- [x] 2.2 Créer `src/components/IngredientNutritionModal.tsx` (classes `modal-overlay`, `modal-card`, `modal-button`) : champs pré-remplis, « Annuler » / « Enregistrer », Échap pour fermer, validation indisponible sur valeur négative ; à la validation, `ingredientRepository.update` puis rappel de l'appelant avec l'aliment mis à jour
- [x] 2.3 Mettre à jour `docs/design/components.md` avec les deux composants ; relire que les noms de classes cités existent

## 3. Fenêtre de sélection

- [x] 3.1 Lancer `graft callers IngredientPickerModal`, puis dans `src/components/IngredientPickerModal.tsx` renommer l'état `mode` en `quantityMode` et introduire `entryMode: 'SEARCH' | 'FREE'`, remis à `SEARCH` avec des champs à l'état initial à chaque ouverture ; vérifier que la recherche se comporte comme avant
- [x] 3.2 Ajouter la bascule « Rechercher » / « Saisie libre » (classe `mode-toggle`) et le formulaire libre : nom, quantité en grammes pré-remplie à 100, quatre valeurs à 0, note d'avertissement ; vérifier que la recherche, la bascule g/unité et l'éditeur d'unité sont masqués en saisie libre
- [x] 3.3 Charger les aliments personnels à l'ouverture (`listCustom`) et bloquer un nom déjà pris, comparé avec la normalisation de `services/ingredientSearch` : note explicative et « Ajouter » désactivé ; vérifier en ressaisissant « sumac » quand « Sumac » existe
- [x] 3.4 Conditionner « Ajouter » en saisie libre (nom non vide après rognage, quantité > 0, aucune valeur négative) et, à la validation, appeler `create` puis `onConfirm` ; vérifier que « Pesto maison » 50 g à 400 kcal arrive dans le plat et qu'« Annuler » ne crée aucun aliment
- [x] 3.5 Dans l'état vide de la recherche, ajouter l'action « Saisir « … » librement » qui passe en saisie libre avec le texte cherché ; vérifier avec une recherche sans résultat
- [x] 3.6 Afficher la note « personnel » sur les résultats `isCustom` ; vérifier en cherchant « pesto » dans un autre plat

## 4. Écran de saisie du plat

- [x] 4.1 Dans `src/screens/recipes/RecipeFormScreen.tsx`, ajouter sur les lignes d'aliments `isCustom` le bouton `edit.svg` (`aria-label` et `title`) ouvrant `IngredientNutritionModal`, et brancher son retour sur `refreshIngredient` ; vérifier qu'une ligne Ciqual n'a pas le bouton
- [x] 4.2 Afficher « valeurs nutritionnelles non renseignées » sur les lignes concernées ; vérifier que la note disparaît dès qu'une valeur est saisie par la correction
- [x] 4.3 Ajouter au besoin les classes dans `src/index.css` (réutiliser `quantity-note`, `picker-result-note`, `mode-toggle`, `icon-button` d'abord ; couleurs système uniquement) ; vérifier le rendu en clair et en sombre

## 5. Intégration

- [x] 5.1 Parcours complet : créer un plat avec 100 g d'un aliment Ciqual, « Sumac » sans valeurs et « Pesto maison » à 400 kcal pour 100 g, enregistrer, rouvrir ; vérifier les lignes conservées et le total (Ciqual + pesto, sumac à zéro)
- [x] 5.2 Corriger les calories de « Pesto maison » depuis ce plat, puis ouvrir un second plat qui l'utilise ; vérifier que ses valeurs suivent la correction
- [x] 5.3 Marquer le plat pour les courses dans le planning ; vérifier que les ingrédients libres figurent dans la liste avec leur quantité
- [x] 5.4 Ajouter une ligne à `docs/log.md`, puis lancer `npm run lint` et `npm run build` ; vérifier qu'ils se terminent sans erreur
