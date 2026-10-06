# Design

## Context

Voir `proposal.md` — Why. Exigences dans `specs/ingredient-portions/spec.md` et `specs/recipe-authoring/spec.md`.

État actuel :

- `Ingredient` porte déjà `portionG?: number` et `portionLabel?: string` (non indexés). Les 3 281 aliments de `public/seed/ciqual.json` les ont ; 1 400 environ ont le libellé générique `portion`, les autres une unité propre (`saucisse`, `œuf`, `c. à soupe`, `pot`…). Ce sont des estimations, pas des données Ciqual.
- `ensureCiqualSeed` ne charge le fichier qu'une fois (clé `ciqualSeededAt` dans `appMeta`) : une base déjà chargée n'a aucune portion.
- `RecipeIngredient` porte `quantityG` et un `unitLabel?` jamais utilisé. Tous les calculs lisent `quantityG` : `computeRecipeNutrition`, `buildOccurrences` (courses), `caloriesPerServingOf` (planning).
- `IngredientPickerModal` : recherche, sélection, champ « Quantité (g) » à 100, `onConfirm({ ingredient, quantityG })`.
- `RecipeFormScreen` tient un brouillon `{ ingredient, quantityG }[]`, rendu en `.ingredient-row` (nom, champ, « g », corbeille).

## Goals / Non-Goals

**Goals**

- Saisir en unités sans toucher à un seul calcul existant.
- Une correction d'unité cohérente partout, en une écriture.
- Aucune migration Dexie.

**Non-Goals**

- Unités dans la liste de courses, qui additionne des grammes venus de plats différents.
- Plusieurs unités par aliment.
- Recalcul de l'indicateur « healthy » hors enregistrement d'un plat.

## Decisions

### Les grammes restent la vérité, le nombre d'unités s'y ajoute

`RecipeIngredient` reçoit `unitCount?: number`. Présent, la ligne est « en unités » et `quantityG` vaut `unitCount × portionG` au moment de l'écriture. Absent, la ligne est en grammes, comme aujourd'hui.

*Pourquoi garder `quantityG` à jour plutôt que de le calculer à la lecture* : nutrition, courses et planning lisent `quantityG` ; ils n'ont rien à apprendre des unités et ne changent pas. Un plat antérieur, sans `unitCount`, est un plat en grammes sans aucune reprise de données.

*Le nom de l'unité n'est pas copié sur la ligne* : il est lu sur l'aliment à l'affichage. Renommer une unité se voit donc partout sans réécrire les plats. Le champ `unitLabel` existant reste inutilisé.

*Alternative écartée* : ne stocker que le nombre et résoudre les grammes à chaque lecture. Trois calculs à modifier, et une jointure de plus partout.

### Corriger une unité réécrit les lignes concernées, en une transaction

`ingredientRepository.setPortion(id, { portionG, portionLabel })` met à jour l'aliment puis, dans la même transaction, toutes les lignes `recipeIngredients` de cet aliment qui ont un `unitCount` : `quantityG = unitCount × portionG`. La table est indexée sur `ingredientId`.

*Pourquoi* : c'est ce qui rend vraie l'exigence « 3 saucisses reste 3 saucisses ». Les lignes en grammes n'ont pas de `unitCount` et sont ignorées par construction.

*Limite assumée* : `isHealthy` est calculé à l'enregistrement d'un plat et n'est pas recalculé ici — comme lorsqu'on modifie un aliment aujourd'hui. Les valeurs nutritionnelles, elles, sont recalculées à chaque affichage et sont donc justes aussitôt.

### La mise à niveau des portions est un second chargement, borné par sa propre clé

`ensureCiqualPortions()` s'exécute au lancement après `ensureCiqualSeed`, gardée par une clé `ciqualPortionsSeededAt`. Elle relit `ciqual.json` et, pour chaque aliment présent en base, de source `CIQUAL` et sans `portionG`, écrit `portionG` et `portionLabel`.

*Pourquoi « sans `portionG` »* : une portion corrigée par l'utilisateur existe déjà et n'est donc jamais écrasée ; un aliment personnel ou importé n'est pas dans le fichier. Sur une installation neuve, le premier chargement apporte déjà les portions et la mise à niveau ne trouve rien à faire.

*Pourquoi une clé à part* : rejouer le chargement initial (`bulkPut`) écraserait les aliments entiers. Une clé dédiée permettra aussi de livrer plus tard un jeu d'estimations revu, sous une nouvelle clé.

### Conversions et mise en forme dans `services/portions.ts`

Fonctions pures :

- `hasOwnUnit(ingredient)` : une portion existe et son libellé n'est pas `portion` — décide du mode par défaut ;
- `gramsFor(unitCount, portionG)` ;
- `pluralizeUnit(label, count)` : invariable si le libellé contient un espace ou un point (« c. à soupe »), ou finit par `s`, `x`, `z` (« noix ») ; `+x` s'il finit par `eau` ou `au` (« morceau ») ; `+s` sinon. Pluriel à partir de 2, selon l'usage français (« 0,5 avocat », « 1,5 avocat », « 2 avocats ») ;
- `formatQuantity({ quantityG, unitCount }, ingredient)` : « 3 saucisses (390 g) » ou « 390 g », nombres au format français.

*Pourquoi* : le formulaire, le détail et la fenêtre affichent la même chose ; une seule fonction évite trois accords divergents.

### La fenêtre d'ajout : une zone de quantité à deux modes

Sous la liste de résultats, une fois un aliment sélectionné :

- une bascule `.mode-toggle` « g » / nom de l'unité, affichée seulement si l'aliment a une portion ;
- le champ de quantité, pas de 0,5 en unités et de 1 en grammes ;
- une ligne d'équivalence « = 390 g » en unités ;
- une ligne « 1 saucisse = 130 g » suivie d'un bouton crayon (`common/edit.svg`) qui déplie deux champs, nom et poids, et un bouton « Enregistrer l'unité ». Pour un aliment sans portion, la même zone s'ouvre par « Définir une unité ».

Changer de mode convertit la valeur affichée (3 saucisses → 390 g ; 390 g → 3 saucisses, arrondi au demi). Sélectionner un autre aliment remet mode et quantité à leurs valeurs par défaut.

`onConfirm` devient `({ ingredient, quantityG, unitCount? })` ; `ingredient` est l'aliment tel qu'il vient d'être corrigé, le cas échéant.

*Pourquoi corriger l'unité ici plutôt que dans un écran d'aliments* : cet écran n'existe pas encore, et c'est au moment de saisir « 3 saucisses » qu'on constate que les siennes ne font pas 130 g.

### La ligne du formulaire suit son mode

Le brouillon devient `{ ingredient, quantityG, unitCount? }`. Une ligne en unités affiche le champ du nombre, le nom accordé, puis « 390 g » en note ; modifier le nombre recalcule `quantityG`. Une ligne en grammes est inchangée. À l'ouverture d'un plat, `unitCount` est relu de la ligne enregistrée.

Si l'unité d'un aliment a été corrigée dans la fenêtre alors qu'il figure déjà dans le brouillon, le brouillon reprend l'aliment corrigé et recalcule sa ligne — sinon l'écran afficherait l'ancien poids jusqu'à l'enregistrement.

## Risks / Trade-offs

- **Estimations fausses pour un produit donné** → c'est le rôle de la correction dans la fenêtre ; l'équivalent en grammes toujours visible permet de s'en apercevoir.
- **Correction d'une unité pendant l'édition d'un plat** : `setPortion` réécrit en base les lignes des plats enregistrés, y compris celui en cours d'édition, avant qu'il soit lui-même enregistré → sans conséquence, l'enregistrement du formulaire remplace toutes ses lignes.
- **`isHealthy` non recalculé** après une correction d'unité → recalculé au prochain enregistrement du plat ; écart temporaire sur un simple badge.
- **Accord au pluriel par règle** → quelques libellés irréguliers pourraient mal s'accorder ; les libellés fournis sont couverts par les trois règles, et un libellé saisi par l'utilisateur lui appartient.
- **Liste de courses toujours en grammes** → « 390 g de saucisse » plutôt que « 3 saucisses ». Assumé pour ce lot ; elle additionne des lignes de plats différents, certaines en grammes.
