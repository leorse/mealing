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

## Avis de l'IA

Comportement spécifié dans la capacité OpenSpec `ai-meal-review`. Tout est dans [services/aiReview.ts](../../src/services/aiReview.ts) ; l'API est décrite dans [1min.app.md](../1min.app.md).

- **Sur clic uniquement** : icône IA d'un jour, ou de l'en-tête pour la semaine. Une seule requête, sans diffusion, même pour sept jours.
- **Transmis** (`buildPrompt`) : les repas des jours demandés (créneau, nom, kcal, écart, ingrédients des plats maison) et l'objectif (calories, macros, but). **Jamais** prénom, date de naissance, sexe, poids, taille.
- **Réponse** (`parseReview`) : un objet JSON `{ days: [{ date, score, comment }], summary? }`. Validation tout ou rien — chaque date demandée une fois, note entière de 0 à 10, commentaire non vide, bilan pour la semaine. Une anomalie rejette tout et rien n'est enregistré.
- **Note toujours par jour**, de 0 à 10 ; le bilan n'existe que pour une demande de semaine.
- **Dépassé** : l'avis garde la `daySignature` de la journée (créneau, nom, calories, écart, plat). Si la signature courante diffère, la teinte s'efface et la fenêtre le signale ; l'avis reste lisible.
- **Échecs** distingués par `AiReviewError.code` : `NO_KEY`, `UNAUTHORIZED`, `RATE_LIMITED`, `NETWORK`, `INVALID_RESPONSE`.

## Saisie à l'unité

Comportement spécifié dans la capacité OpenSpec `ingredient-portions`. Conversions et mise en forme dans [services/portions.ts](../../src/services/portions.ts).

- **Les grammes restent la vérité** : nutrition, planning et liste de courses ne lisent que `quantityG`. Le nombre d'unités (`unitCount`) s'y ajoute pour la saisie et l'affichage.
- **Mode par défaut** dans la fenêtre d'ajout : unités (1) si l'aliment a une unité propre (`hasOwnUnit` : libellé autre que `portion`), sinon grammes (100).
- **Affichage** par `formatQuantity` : « 3 saucisses (390 g) » ou « 390 g ». Pluriel à partir de 2 ; libellé invariable s'il est abrégé, composé, ou finit par s, x, z ; `+x` après `au`.
- **Corriger une unité** (`setPortion`) : les plats comptés en unités gardent leur nombre et prennent le nouveau poids ; ceux saisis en grammes ne bougent pas. `isHealthy` n'est recalculé qu'au prochain enregistrement du plat.
- Les portions fournies avec Ciqual sont des **estimations**, pas des données Ciqual.

## Ingrédient libre

Un ingrédient absent des aliments enregistrés se saisit librement dans la fenêtre d'ajout (nom, grammes, valeurs pour 100 g facultatives). Il devient un **aliment personnel** (`isCustom`, `source: 'CUSTOM'`, catégorie « Autres ») et suit ensuite le parcours de tout aliment : recherche, courses, avis de l'IA.

- **Quatre valeurs seulement** : calories, protéines, glucides, lipides pour 100 g, à 0 par défaut ; un champ vide vaut 0, une valeur négative bloque la validation.
- **Non renseigné** (`lacksNutrition`) : aliment personnel dont les quatre valeurs sont nulles. Il compte pour zéro dans le plat et sa ligne le signale. Un aliment Ciqual à 0 kcal n'est pas concerné.
- **Nom unique** parmi les aliments personnels, casse et accents ignorés : un nom déjà pris bloque la saisie libre et renvoie vers la recherche. Un nom identique à un aliment Ciqual reste permis.
- **Corriger les valeurs** (`IngredientNutritionModal`, depuis la ligne du plat) : écrit l'aliment tout de suite, sans attendre l'enregistrement du plat, donc pour tous les plats qui l'utilisent. `isHealthy` n'est recalculé qu'au prochain enregistrement de chaque plat ; `caloriesOverride` des créneaux déjà planifiés ne bouge pas.
- L'aliment est créé à la validation de la fenêtre : il subsiste si le plat est ensuite abandonné.

## Plat décrit en texte libre

Comportement spécifié dans la capacité OpenSpec `dish-from-text`. Tout est dans [services/dishFromText.ts](../../src/services/dishFromText.ts) : fonctions pures, sauf `analyze` qui enchaîne le réseau et le worker.

**Par lot, toujours.** `analyze({ texts })` prend une liste de descriptions et rend une liste de `DishResult` de même longueur et de même ordre. L'écran « Décrire un plat » passe une seule description ; une génération de plusieurs plats appellera la même fonction. Deux demandes à 1min.AI en tout, quel que soit le nombre de plats.

| Étape | Fonction | Rôle |
|---|---|---|
| 1 | `buildDecomposePrompt` → `parseDecomposition` | L'IA rend, par plat, un nom et des ingrédients : texte de recherche au vocabulaire Ciqual, état, grammes, provenance de la quantité, confiance, et `parts` pour un aliment composé |
| 2 | `expandComposites` | Un aliment composé devient ses ingrédients simples, au prorata ; la somme vaut son poids |
| 3 | `distinctQueries` → `searchFoods` | Recherche sémantique locale, 10 candidats (`CANDIDATE_COUNT`) par texte de recherche distinct |
| 4 | `buildChoicePrompt` → `parseChoices` | L'IA trie : un identifiant d'aliment par ingrédient, ou `null` |
| 5 | `applyChoices`, `userQuantitiesIntact` | Contrôles et repli |
| 6 | `mergeSameIngredient` | Un aliment ne figure qu'une fois par plat |

- **Les valeurs nutritionnelles viennent de Ciqual, jamais de l'IA** : les consignes l'interdisent, les lecteurs ignorent toute clé inattendue, et le calcul passe par `computeRecipeNutrition`.
- **Quantité de l'utilisateur d'abord** : `source: 'USER'` quand la description donne un poids, un nombre ou une fraction ; sinon `'ESTIMATE'`. Un nombre (`count`) compte la ligne en unités si l'aliment retenu a une unité propre (`hasOwnUnit`), sinon le poids rendu par l'IA sert.
- **Le tri ne touche pas aux quantités** : sa réponse n'en contient pas, `applyChoices` ne lit que le rang et l'identifiant.
- **Contrôle du tri** : l'identifiant doit figurer parmi les candidats de l'ingrédient. Hors liste, inventé, oublié, cité deux fois, ou plat entier absent : la ligne prend le candidat le plus proche et passe « à vérifier » (`needsReview`), comme une ligne de confiance `LOW`. `null` ou aucun candidat : ligne sans aliment, qui ne compte pas et n'est pas enregistrée.
- **Validation à deux niveaux** : une réponse illisible en entier lève une `AiError` ; un plat absent, en double ou à ingrédient invalide passe seul en `FAILED`, les autres continuent. `items` vide → `NO_FOOD`.
- **Échec du tri seul** : `ChoiceStepError` porte un `checkpoint` (décomposition et candidats) ; le repasser à `analyze` ne refait que le tri.
- **Listes de candidats écrites une fois** par texte de recherche distinct dans la demande de tri, même si plusieurs plats s'y réfèrent.
- **Ajustements** : `resizeLine` (petite 0,7 · normale 1 · grande 1,3 de l'estimation initiale, la ligne reste estimée), `setLineWeight` (poids précis : quantité de l'utilisateur, refus si ≤ 0), `replaceLineIngredient` (garde la quantité et sa provenance).
- **Validation de l'écran** : `recipeRepository.create` d'un plat maison d'une portion ; rien n'est écrit avant. `isEstimated` suit la ligne enregistrée et tombe dès que sa quantité est modifiée dans le formulaire.
- **Origine gardée** : la description est enregistrée dans `Recipe.sourceText`. Le plat porte l'icône de l'IA dans la liste et rappelle sa description au détail ; pour tout le reste c'est un plat maison ordinaire.
- **Un clic, une action** : « Analyser » et « Valider » se grisent dès le clic (`once` dans `DishFromTextScreen`) ; un second clic est ignoré.
- **Transmis à l'IA** : la description, puis les ingrédients qui en sont issus et les noms et identifiants des aliments candidats. Jamais le profil ni le planning.
- **Échecs** : `DishErrorCode` = codes de `AiError` + `NO_FOOD`, messages par `dishErrorMessage` ; les échecs de la recherche locale sont des `EmbeddingError`.

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
