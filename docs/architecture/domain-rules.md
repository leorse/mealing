---
type: Reference
title: Règles métier
description: Calculs nutritionnels, convention de dates locales et règles de fonctionnement du planning.
resource: ../../src/services/nutrition.ts
tags: [architecture, nutrition, dates, planning]
timestamp: 2026-10-04T00:00:00Z
---
# Règles métier

## Nutrition

Tout est dans [services/nutrition.ts](../../src/services/nutrition.ts), en fonctions pures. Ne pas recopier une formule dans un écran : appeler la fonction.

| Fonction | Règle |
|---|---|
| `computeBMR` | Mifflin-St Jeor : `10·poids + 6,25·taille − 5·âge`, `−161` pour une femme, `+5` sinon |
| `computeTDEE` | BMR × activité (1,2 · 1,375 · 1,55 · 1,725 · 1,9) |
| `computeTargetCalories` | `profile.targetCalories` s'il est renseigné, sinon TDEE ajusté : perte −20 %, maintien 0, prise +15 % |
| `computeMacroTargets` | Pourcentages du profil convertis en grammes (4 kcal/g protéines et glucides, 9 kcal/g lipides) |
| `computeRecipeNutrition` | Somme des `valeur100g / 100 × quantityG` sur les ingrédients |
| `perServing` | Totaux divisés par le nombre de portions (au moins 1) |
| `mainIngredient` | Ingrédient à la plus grosse quantité |
| `isHealthyRecipe` | Vrai si au moins 3 critères sur 5 : ≤ 600 kcal, ≤ 5 g d'acides gras saturés, ≥ 3 g de fibres, ≤ 10 g de sucres (par portion), Nutri-Score A ou B de l'ingrédient principal |
| `computeCompensation` | Répartit un surplus calorique sur `compensationSpread` jours |

`isHealthy` est **calculé à l'enregistrement** d'une recette maison et stocké ; il n'est pas défini pour un plat tout prêt. Les valeurs d'une recette maison ne sont pas stockées : elles sont recalculées à l'affichage.

Affichage : calories arrondies à l'entier dans le planning, valeurs arrondies au dixième dans le détail d'une recette.

## Dates

Convention posée dans [utils/date.ts](../../src/utils/date.ts) : une chaîne `AAAA-MM-JJ` désigne un **jour civil local**, jamais un instant.

| Besoin | Fonction |
|---|---|
| Chaîne → `Date` (à midi local) | `fromIsoDate` |
| `Date` → chaîne | `toIsoDate` |
| Lundi de la semaine | `startOfWeekIso` |
| Décaler de N jours | `addDays` |
| Les 7 jours d'une semaine | `weekDates` |

Interdits pour un jour civil : `toISOString().slice(0, 10)` et `new Date('AAAA-MM-JJ')`, qui passent par UTC et décalent d'un jour autour de minuit. Pour afficher : `format(fromIsoDate(date), 'EEE d', { locale: fr })` avec date-fns.

> `planningRepository.copyWeek` utilise encore l'ancien calcul en UTC. Elle n'est appelée nulle part ; la réécrire avec `addDays` avant de la brancher, et ne pas s'en inspirer.

## Planning

Comportement spécifié dans [openspec/specs/meal-planning/spec.md](../../openspec/specs/meal-planning/spec.md).

- La semaine affichée vit dans `useUiStore.selectedWeekStart` (lundi). Elle n'est créée en base qu'à la première écriture (`addSlotForWeek` → `ensureWeek`).
- Quatre créneaux par jour : `BREAKFAST` Petit-déj, `LUNCH` Déjeuner, `DINNER` Dîner, `SNACK` Collation. Chaque créneau accepte **plusieurs entrées** et garde toujours son bouton d'ajout.
- Une entrée est soit une **recette** (`recipeId`, nom copié dans `freeLabel`), soit un **écart** (`isDeviation`, nom libre). Dans les deux cas les calories sont figées dans `caloriesOverride` au moment du choix (proposées depuis la recette, modifiables) ; `portions` vaut 1.
- Total du jour = somme des `caloriesOverride`. Couleur : vert entre 90 % et 110 % de l'objectif, rouge au-dessus, orange en dessous.
- La pastille caddie (entrées issues d'une recette seulement) bascule `includeInShopping` par `setSlotShopping`. Rien ne part aux courses sans ce clic.
- Les libellés et l'ordre des créneaux sont dans [utils/mealTypes.ts](../../src/utils/mealTypes.ts).
- Suppression par **appui maintenu de 700 ms** (`HoldToDeleteButton`), sans fenêtre de confirmation.

## Liste de courses

Comportement spécifié dans la capacité OpenSpec `shopping-list`. Calcul dans [services/shopping.ts](../../src/services/shopping.ts) (fonctions pures), lecture par [hooks/useShoppingList.ts](../../src/hooks/useShoppingList.ts).

- **Source** : tous les créneaux à pastille verte, **quelle que soit leur date**. La liste n'est liée à aucune semaine et n'est jamais stockée : elle est recalculée à chaque changement du planning ou d'une recette.
- **Quantité** : celle de la ligne de recette (`quantityG`), telle quelle, par plat marqué. Ni les portions de la recette ni celles du créneau n'interviennent. Un plat tout prêt est lui-même l'article, compté à l'unité.
- **Deux vues** de la même structure : `buildOccurrences` (par plat, une occurrence par créneau) et `groupByItem` (par ingrédient, quantités actives additionnées, provenance avec `×N`).
- **Désactiver** (bouton caddie) : état `'OFF'`, l'article reste affiché grisé et ne compte plus ; réversible ; ne touche pas à la pastille du planning.
- **Supprimer** (corbeille) : état `'DELETED'`, l'article disparaît. Supprimer un plat entier, ou son dernier article, éteint la pastille du créneau ; le repas reste planifié.
- **Rallumer une pastille** au planning remet le plat complet : c'est le seul retour d'un article supprimé.
- **Tout supprimer** : éteint toutes les pastilles après confirmation, sans supprimer aucun repas.
- Agir sur un ingrédient depuis sa ligne groupée vise toutes ses occurrences ; depuis le détail déplié ou la vue par plat, une seule.

## Recherche d'ingrédient

Comportement spécifié dans la capacité OpenSpec `ingredient-search`. Classement dans [services/ingredientSearch.ts](../../src/services/ingredientSearch.ts) (fonctions pures), appelé par `ingredientRepository.search`.

- Correspondance sur le nom ou la marque, **sans casse ni accents** (`normalize`).
- Quatre niveaux, puis ordre alphabétique français dans chaque niveau. Pour « pomme » : 1 « Pomme, … » · 2 « Pomme Gala, … » (autre mot) · 3 « Pomme de terre, … » (liaison de, du, des, d', à, au, aux, en) · 4 « Jus de pomme » (ailleurs dans le nom, ou marque).
- Une saisie partielle vaut le mot qu'elle commence : « pom » classe comme « pomme ».
- Tous les aliments correspondants sont classés, **puis** la liste est coupée à 50.

## Recettes

Comportement spécifié dans [openspec/specs/recipe-authoring/spec.md](../../openspec/specs/recipe-authoring/spec.md).

- Le type (recette maison ou plat tout prêt) se choisit à la création et ne change plus ensuite.
- Un ingrédient ne figure qu'une fois par recette ; la fenêtre de sélection le montre grisé « déjà ajouté ».
- La recherche d'ingrédient démarre à 2 caractères ; quantité par défaut 100 g.
- Modifier une recette remplace toutes ses lignes d'ingrédients.
