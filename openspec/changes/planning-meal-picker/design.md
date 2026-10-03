# Design

## Context

Voir `proposal.md` — Why.

État actuel :

- `MealSlot` porte déjà `recipeId`, `freeLabel`, `portions`, `isDeviation`, `caloriesOverride` (`src/db/schema.ts`). Seuls les trois derniers sont écrits aujourd'hui ; `recipeId` ne l'est jamais.
- `WeekPlanScreen` affiche un créneau via `daySlots.find((s) => s.mealType === type)` : une seule entrée retenue par type de repas, et le bouton d'ajout est remplacé dès qu'elle existe. Les calories viennent de `slot.caloriesOverride ?? 0`.
- `AddMealScreen`, derrière la route `/planning/:date/add`, saisit un nom et des calories et revient sur `/planning`.
- Côté données, `addSlotForWeek` et `updateSlot` couvrent déjà les deux écritures nécessaires. L'index Dexie `[slotDate+mealType]` n'impose aucune unicité : plusieurs entrées par créneau ne demandent aucune migration.
- Les calories par portion ne sont stockées que pour les plats tout prêts (`caloriesPerServing`). Pour une recette maison, elles se recalculent depuis les ingrédients, comme le fait `RecipeDetailScreen` : `getIngredients(id)`, résolution de chaque ingrédient, puis `computeRecipeNutrition` et `perServing`.

## Goals / Non-Goals

**Goals**

- Relier le planning à la bibliothèque de recettes.
- Une fenêtre unique pour l'ajout et la modification.
- Réutiliser la direction artistique de la fenêtre de sélection d'ingrédient, sans en inventer une seconde.

**Non-Goals**

- `DayDetailScreen`, laissé en l'état.
- Le nombre de portions : une entrée vaut une portion. Plusieurs portions se représentent par plusieurs entrées.
- La consommation d'un repas (`isConsumed`), inchangée.

## Decisions

### Les calories sont figées dans le créneau, pas recalculées à l'affichage

À la validation, la valeur du champ calories est écrite dans `caloriesOverride`.

*Pourquoi* : c'est déjà ce que lit `slotCalories()`, la grille reste synchrone, et le planning passé garde la trace de ce qui était prévu. Surtout, l'utilisateur peut corriger la valeur proposée — une valeur recalculée en permanence écraserait sa correction.

*Conséquence assumée* : modifier une recette ne met pas à jour les créneaux déjà posés. C'est voulu, pas un oubli.

*Alternative écartée* : ne stocker que `recipeId` et recalculer au rendu. Cela interdirait la correction manuelle, et obligerait la grille à charger les ingrédients de chaque créneau de la semaine.

### Le libellé est également figé dans le créneau

En mode Recette, `freeLabel` reçoit le nom de la recette, en plus de `recipeId`.

*Pourquoi* : la grille affiche déjà `slot.freeLabel` et reste ainsi synchrone, sans charger les recettes pour rendre une semaine. `recipeId` est conservé pour l'usage ultérieur — liste de courses, lien vers la fiche.

*Conséquence* : renommer une recette ne renomme pas les entrées déjà posées, cohérent avec la décision précédente sur les calories.

### Les deux modes se projettent sur les champs existants

| Mode | `recipeId` | `freeLabel` | `isDeviation` | `caloriesOverride` |
|---|---|---|---|---|
| Recette | id du repas choisi | nom du repas choisi | `false` | valeur du champ |
| Écart | absent | nom saisi | `true` | valeur du champ |

*Pourquoi* : aucun champ nouveau, donc aucune migration. `isDeviation` existait déjà sous forme de case à cocher dans `AddMealScreen` ; le radio en reprend le rôle de façon plus lisible.

### Les calories proposées se calculent au choix de la recette

Au moment où une recette est choisie dans la fenêtre, et non à l'ouverture :

- plat tout prêt → `caloriesPerServing` lu directement ;
- recette maison → chargement des ingrédients puis `computeRecipeNutrition` + `perServing`, comme `RecipeDetailScreen`.

*Pourquoi* : ne calculer que pour l'élément choisi évite de résoudre les ingrédients de toute la bibliothèque à l'ouverture de la fenêtre.

### Une seule fenêtre pour l'ajout et la modification

Le composant reçoit l'entrée à modifier, ou rien pour un ajout, et la validation appelle `updateSlot` ou `addSlotForWeek` selon le cas.

*Pourquoi* : les deux parcours ont les mêmes champs et les mêmes règles de validation ; deux composants divergeraient.

### La direction artistique est reprise, pas réécrite

La fenêtre réutilise `.modal-overlay`, `.modal-card--picker`, `.picker-search`, `.picker-results`, `.picker-result`, `.modal-button--no` / `--yes`, le vert `#2ECC71` et `MaskIcon`.

*Pourquoi* : c'est la demande, et ces classes viennent d'être posées pour la fenêtre d'ingrédient. Seul le sélecteur de mode est nouveau.

*Note* : comme l'exige la capacité `theming`, le sélecteur de mode se construit en couleurs système, sans valeur figée.

### La grille passe de `find` à `filter`

Chaque créneau rend la liste de ses entrées, suivie du bouton d'ajout, toujours présent.

### La suppression se fait par une icône sur l'entrée, sans confirmation

Chaque entrée porte une petite corbeille, à la manière de la liste des ingrédients d'une recette, et `deleteSlot` est appelé directement.

*Pourquoi sans confirmation* : une entrée de planning est une donnée bon marché — trois interactions suffisent à la recréer — et la fenêtre de modification est déjà une surface modale. Empiler une confirmation modale sur une grille qui en ouvre déjà une serait disproportionné.

*À surveiller* : les cases sont petites et la corbeille voisine de la zone qui ouvre la modification. Si les suppressions accidentelles se produisent, la réponse est d'agrandir la cible ou d'ajouter `ConfirmModal`, déjà utilisé ailleurs pour les suppressions.

## Risks / Trade-offs

- **Suppression sans confirmation** → un appui malencontreux retire une entrée sans filet. Jugé acceptable vu le coût de recréation, à revoir si le cas se produit.
- **Valeurs figées** → un créneau peut afficher un nom ou des calories devenus faux après édition de la recette. Contrepartie de la correction manuelle.
- **Densité de la grille** → plusieurs entrées par créneau allongent les colonnes. La grille défile horizontalement et la coquille défile verticalement depuis `fix-app-scroll` ; à surveiller tout de même sur une semaine chargée.
- **Zone cliquable** → une entrée devient cliquable pour la modifier, dans des cases déjà petites. À vérifier au doigt sur mobile.
- **Bibliothèque vide** → sans aucune recette enregistrée, le mode Recette n'a rien à proposer. La fenêtre doit le dire plutôt que d'afficher une liste vide.

## Migration Plan

Aucune migration : aucun champ ajouté, aucun index modifié. Les créneaux existants portent déjà `freeLabel`, `caloriesOverride` et `isDeviation` et s'affichent inchangés. Retour arrière par restauration de l'écran et de la route d'ajout.
