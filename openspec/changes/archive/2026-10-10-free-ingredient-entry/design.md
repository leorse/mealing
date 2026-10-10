# Design

## Context

Voir proposal.md pour la motivation. État actuel :

- `IngredientPickerModal` cherche via `ingredientRepository.search` et renvoie un `IngredientChoice` (`ingredient`, `quantityG`, `unitCount?`) à `RecipeFormScreen.addIngredient`.
- Une ligne de plat (`RecipeIngredient`) exige un `ingredientId`. Tout l'aval s'appuie dessus : `computeRecipeNutrition`, `shopping.buildOccurrences` (regroupement et états par identifiant d'ingrédient), `aiReview.loadReviewDays` (nom lu sur l'aliment), `setPortion`.
- `ingredientRepository.create` (aliment `CUSTOM`, `isCustom: true`) et `ingredientRepository.update` existent déjà ; `create` n'a aucun appelant, il n'y a donc aujourd'hui aucun aliment personnel en base.
- `Ingredient.calories100g` est un nombre obligatoire ; `proteins100g`, `carbs100g`, `fat100g` sont optionnels et `sumPer100g` ignore les champs absents.
- Les valeurs d'un plat maison ne sont pas stockées : elles sont recalculées depuis les aliments. Seul `Recipe.isHealthy` est figé à l'enregistrement du plat.
- La fenêtre a déjà un état `mode` (`'G' | 'UNIT'`) pour l'unité de quantité, la classe `mode-toggle` pour une bascule à deux boutons, et un éditeur d'unité qui écrit l'aliment immédiatement puis prévient l'écran par `onIngredientChange` → `RecipeFormScreen.refreshIngredient`.
- Le formulaire de plat tout prêt saisit déjà calories, protéines, glucides et lipides dans des champs à libellé texte.

## Goals / Non-Goals

**Goals:**

- Ajouter un ingrédient par nom + grammes, avec des valeurs nutritionnelles facultatives et corrigeables, sans toucher au reste de la chaîne (calcul, courses, avis IA, sauvegarde).
- Aucun changement du schéma Dexie.

**Non-Goals:**

- Saisir sucres, acides gras saturés, fibres, sel ou Nutri-Score d'un aliment personnel : seules les quatre valeurs déjà saisies pour un plat tout prêt sont proposées.
- Renommer ou supprimer un aliment personnel, ou corriger ses valeurs hors de l'écran de saisie d'un plat (l'écran de gestion des aliments reste une coquille).
- Corriger les valeurs d'un aliment Ciqual ou Open Food Facts.
- Saisir d'emblée une unité en mode libre : l'aliment créé étant un aliment ordinaire, l'éditeur d'unité existant s'applique dès qu'il est retrouvé par la recherche.
- Recherche Open Food Facts depuis cette fenêtre.
- Ingrédient libre sur un plat tout prêt ou directement sur un créneau du planning.

## Decisions

### 1. Un ingrédient libre est un `Ingredient` `CUSTOM`, pas une ligne sans aliment

La saisie libre crée un aliment par `ingredientRepository.create` (`source: 'CUSTOM'`, `isCustom: true`, `category: 'Autres'`, `calories100g`, `proteins100g`, `carbs100g`, `fat100g` issus du formulaire, 0 par défaut) et la ligne de plat le référence par `ingredientId` comme les autres.

*Alternative écartée* : rendre `RecipeIngredient.ingredientId` optionnel et porter nom et valeurs sur la ligne. Elle oblige à traiter le cas « pas d'aliment » dans le formulaire (clés par `ingredient.id`), le calcul, les courses (clé d'article et `shoppingItemStates`), l'avis IA et `setPortion`, et l'ingrédient ne serait pas retrouvé au plat suivant.

### 2. Pas de nouveau champ : « personnel » = `isCustom`, « non renseigné » = quatre valeurs à zéro

L'action de correction et la note « aliment personnel » s'appuient sur `isCustom`. Le signalement « valeurs non renseignées » se calcule : `isCustom` et calories, protéines, glucides, lipides tous nuls ou absents. Une fonction pure dans `services/nutrition.ts` porte ce test.

*Alternative écartée* : un marqueur `nutritionUnknown` stocké. Il faudrait le tenir synchronisé avec les valeurs à chaque correction, pour une information déjà dérivable. Le test par `isCustom` évite le faux positif des aliments Ciqual à 0 kcal (eau, sel).

### 3. Création à la validation de la fenêtre ; un nom personnel déjà pris bloque

À l'ouverture, la fenêtre charge une fois les aliments personnels (nouvelle lecture pure `ingredientRepository.listCustom`) et compare le nom saisi normalisé (même normalisation casse/accents que `services/ingredientSearch`) sans relire la base à chaque frappe. En cas de correspondance : note « existe déjà, à choisir par la recherche » et « Ajouter » désactivé. Sinon, « Ajouter » appelle `create` puis `onConfirm`.

*Alternative écartée* : réutiliser silencieusement l'aliment existant. Avec des valeurs dans le formulaire, il faudrait choisir entre ignorer celles saisies ou écraser celles enregistrées — et des zéros par défaut effaceraient des valeurs déjà renseignées.

La comparaison ne porte que sur les aliments personnels : un nom identique à un aliment Ciqual reste permis, l'utilisateur ayant choisi explicitement ce mode. Le cas « déjà dans le plat » est couvert par la même règle.

*Alternative écartée* : ne créer l'aliment qu'à l'enregistrement du plat. Elle impose un brouillon sans identifiant dans `RecipeFormScreen`, alors que toutes ses fonctions indexent par `ingredient.id`. Contrepartie acceptée : voir Risques.

### 4. Correction des valeurs : une petite fenêtre ouverte depuis la ligne

Nouveau composant `IngredientNutritionModal` (structure `modal-overlay` / `modal-card`, boutons `modal-button`) : quatre champs pré-remplis, « Annuler » / « Enregistrer ». À la validation, `ingredientRepository.update(id, valeurs)` puis `refreshIngredient` de l'écran, comme pour l'unité. La ligne d'un aliment `isCustom` porte un `icon-button` avec `edit.svg`, `aria-label` et `title` « Corriger les valeurs nutritionnelles ».

L'écriture est immédiate, indépendante de l'enregistrement du plat : c'est l'aliment qui change, pas le plat — même règle que `setPortion`.

Les quatre champs sont un petit composant partagé entre la saisie libre et cette fenêtre, pour ne pas dupliquer libellés et validation (≥ 0, vide = 0).

*Alternative écartée* : corriger en sélectionnant l'aliment dans la recherche, à la manière de l'éditeur d'unité. Un aliment déjà présent dans le plat n'y est pas sélectionnable, donc pas corrigeable là où on en a besoin.

### 5. Interface de la fenêtre de sélection

- Renommer l'état existant `mode` en `quantityMode` et introduire `entryMode: 'SEARCH' | 'FREE'`.
- Bascule `mode-toggle` « Rechercher » / « Saisie libre » en haut de la carte.
- En `FREE` : champ nom (classe `picker-search`), quantité en grammes (`picker-quantity`), les quatre valeurs pour 100 g, note `quantity-note` d'avertissement. Bascule g/unité et éditeur d'unité masqués.
- État vide de la recherche : un bouton texte « Saisir « … » librement » sous le message existant, qui passe en `FREE` avec le nom pré-rempli.
- Résultats : note `picker-result-note` « personnel » sur les aliments `isCustom`.
- Ligne du formulaire : note `quantity-note` « valeurs nutritionnelles non renseignées ».
- Aucune nouvelle icône ; nouvelles classes CSS seulement si une classe existante ne convient pas, couleurs système uniquement.

### 6. Aval inchangé

Calcul : `nutrition.ts` lit déjà les quatre champs. Courses et sauvegarde : l'aliment est un enregistrement ordinaire de `ingredients`. Avis IA : le nom libre part dans la composition du plat, au même titre que les noms de plats saisis par l'utilisateur, uniquement sur clic — pas de nouvel appel réseau.

## Risks / Trade-offs

- [Le total d'un plat est sous-estimé tant que les valeurs sont à zéro, sans que la fiche du plat ou le planning le montrent] → signalement sur la ligne du formulaire et avertissement dans la fenêtre ; l'étendre à la fiche et au planning est un changement ultérieur.
- [Corriger un aliment modifie les valeurs de tous les plats qui l'utilisent, y compris ceux déjà planifiés] → comportement voulu et spécifié ; les calories retenues sur un créneau (`caloriesOverride`) ne sont pas recalculées.
- [`Recipe.isHealthy` des autres plats n'est pas recalculé après une correction] → il l'est au prochain enregistrement de chaque plat ; écart accepté, sans effet sur les calculs.
- [Aliment personnel orphelin si l'utilisateur valide la fenêtre puis abandonne le plat] → il reste trouvable par la recherche, valeurs comprises.
- [Faute de frappe figée dans le nom, qui bloque ensuite le bon nom s'il est identique à la normalisation près] → pas de renommage dans ce changement ; à traiter avec l'écran de gestion des aliments.
- [`mainIngredient` peut désigner un aliment personnel, donc sans Nutri-Score, pour le critère « healthy »] → comportement déjà prévu (`undefined` = critère non rempli).
