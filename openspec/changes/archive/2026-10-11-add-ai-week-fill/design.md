# Design

## Context

Voir [proposal.md](proposal.md) pour la motivation. Ce qui existe et sert de socle :

- **Bouton d'en-tête** : dans [WeekPlanScreen.tsx](../../../src/screens/planning/WeekPlanScreen.tsx), le bouton `.ai-button` de l'en-tête appelle directement `review(filledDates, true)` et est désactivé quand `filledDates` est vide.
- **Analyse par lot** : `analyze({ texts })` de [dishFromText.ts](../../../src/services/dishFromText.ts) prend N descriptions et rend N `DishResult`, avec deux demandes à 1min.AI au total. Un plat inexploitable passe seul en `FAILED`. `ChoiceStepError` porte un `checkpoint` pour ne refaire que le tri.
- **Création d'un plat décrit** : `recipeRepository.create` avec `sourceText`, `isEstimated` sur les lignes, `isHealthyFromItems` (voir `handleValidate` de `DishFromTextScreen`).
- **Entrée de planning** : `addSlotForWeek(weekStart, { slotDate, mealType, recipeId, freeLabel, portions: 1, isDeviation: false, caloriesOverride })`, comme `MealPickerModal.confirm`. Un créneau accepte plusieurs entrées.
- **Objectif transmis à l'IA** : `ReviewGoal` (`targetCalories`, grammes de macros, `goal`), déjà calculé dans `WeekPlanScreen` pour l'avis.
- **Réglages** : `settingsRepository` range clé et modèle dans `appMeta` ; `SECRET_META_KEYS` exclut la clé des sauvegardes.
- **Recherche intelligente** : `getEmbeddingStatus`, `EmbeddingSetup`, `acquireEmbedding`.

## Goals / Non-Goals

**Goals:**

- Réutiliser `analyze` sans le modifier : le remplissage n'est qu'un producteur de descriptions.
- Rien d'écrit avant la fin de l'analyse ; écriture groupée en une transaction.
- Aucune nouvelle version du schéma Dexie.

**Non-Goals:**

- Proposer des plats déjà présents dans le catalogue de l'utilisateur, ou ses favoris.
- Remplir la collation, plusieurs semaines, ou un créneau déjà garni.
- Relire ou ajuster les ingrédients avant l'ajout : le plat créé se corrige ensuite dans le formulaire.
- Modifier une proposition (nom, description) ou en redemander une seule.
- Marquer automatiquement les plats pour les courses.
- Utiliser les préférences culinaires pour l'avis de l'IA.

## Decisions

### D1 — Trois demandes à l'IA, en deux temps

```
Grille validée ──► demande A : proposition      (1 appel)   → liste à relire
Liste validée  ──► analyze(descriptions)        (2 appels)  → plats + créneaux
```

La proposition rend, par créneau, un **nom** et une **description en texte libre avec quantités** (« 150 g de riz basmati cuit, 120 g de blanc de poulet grillé, 100 g de courgettes sautées, une cuillère à soupe d'huile d'olive »). Cette description est exactement l'entrée d'`analyze` : aucun format intermédiaire, et la relecture montre à l'utilisateur ce qui sera chiffré.

*Alternative écartée* : faire rendre directement les ingrédients structurés par la demande A et sauter la décomposition. Cela dupliquerait le contrat de `dish-from-text`, sa validation et ses règles de quantité, pour économiser un appel.

### D2 — Contrat de la demande A

`src/services/weekFill.ts`, fonctions pures `buildFillPrompt` et `parseProposals`.

Transmis : les créneaux retenus numérotés (« 1. mardi — déjeuner »), l'objectif (`ReviewGoal`), **la semaine complète** et les préférences culinaires si elles ne sont pas vides.

La semaine complète est un tableau des sept jours, chacun avec tous ses repas déjà planifiés (créneau, nom, kcal, mention d'écart, collation comprise) — qu'un de ses créneaux soit retenu ou non — son total de calories, et la liste de ses créneaux vides écartés par l'utilisateur, marqués « géré par l'utilisateur, contenu inconnu ». L'IA voit ainsi ce qu'une journée porte déjà et peut alléger ses propositions ; un créneau écarté lui dit de garder de la marge plutôt que de répartir tout l'objectif sur les seuls repas proposés. Les noms et les calories viennent des `MealSlot` (`freeLabel`, `caloriesOverride`), sans lecture des ingrédients : c'est la charge de la journée qui compte ici, pas sa composition. Consignes : un plat par créneau, pour une personne, varié, réaliste à cuisiner, cohérent avec le repas (un petit-déjeuner n'est pas un dîner) ; description d'une phrase listant les ingrédients avec une quantité chacun ; respect strict des préférences ; aucune valeur nutritionnelle.

Les jours sont nommés (« mardi »), pas datés : la date n'apporte rien à l'IA.

```json
{ "meals": [ { "slot": 1, "name": "Poulet, riz et courgettes", "description": "150 g de riz basmati cuit, 120 g de blanc de poulet grillé, 100 g de courgettes sautées, une cuillère à soupe d'huile d'olive" } ] }
```

`parseProposals(text, slotCount)` : enveloppe illisible ou `meals` absent → `AiError('INVALID_RESPONSE')`. Par créneau : exactement une entrée, `name` et `description` non vides, sinon le créneau est rendu « sans proposition ». Numéro inconnu ignoré. Aucune proposition valide → `INVALID_RESPONSE`.

### D3 — Création : `analyze` puis une transaction

```
generate(proposals)
  1. textes distincts des propositions  → analyze({ texts })       (dédoublonnage : même nom + même description)
  2. par résultat OK : lignes avec aliment → RecipeInput + lignes + calories
  3. planningRepository.addGeneratedMeals(weekStart, dishes)        (une transaction)
```

- **Dédoublonnage** : deux propositions de même nom et de même description (casse et espaces ignorés) donnent un seul texte analysé, un seul plat, plusieurs créneaux. Cas typique : le même petit-déjeuner plusieurs jours.
- **Plat** : `kind: 'RECIPE'`, `servings: 1`, `difficulty: 'EASY'`, `name` = nom de la proposition (pas celui de l'analyse), `sourceText` = description, `isHealthy` par `isHealthyFromItems`. Lignes : celles dont `ingredient !== null`, avec `quantityG`, `unitCount`, `isEstimated`. Aucune ligne utilisable → échec de ce plat.
- **Calories de l'entrée** : `Math.round(computeRecipeNutrition(lignes).calories)`, une portion — même valeur que proposerait `MealPickerModal`.
- **Écriture** : nouvelle fonction `planningRepository.addGeneratedMeals(weekStart, dishes)` en `db.transaction('rw', recipes, recipeIngredients, weekPlans, mealSlots)` : `ensureWeek`, création des plats, création des créneaux. Tout ou rien, pour ne jamais laisser des plats orphelins sans créneau. Les identifiants sont générés dans le repository.
- **Échecs par plat** (`DishResult.status === 'FAILED'`, ou aucune ligne utilisable) : les autres sont écrits ; la fenêtre reste ouverte et liste les propositions restées sans plat. Elles restent dans la liste, ce qui permet de relancer la création pour elles seules.
- **Échec d'ensemble** (exception d'`analyze`) : rien n'est écrit, la liste est conservée. Un `ChoiceStepError` garde son `checkpoint` tant que la liste des textes n'a pas changé : la relance ne refait que le tri.

### D4 — Taille du lot

Une grille entière fait 21 plats, soit une centaine d'ingrédients et jusqu'à un millier de candidats dans la demande de tri (voir les risques de `dish-from-text`). Décision : **une seule analyse**, comme prévu par la conception par lot, avec une constante `MAX_DISHES_PER_ANALYSIS = 21` dans `weekFill.ts`. Si l'usage montre des réponses tronquées, baisser cette constante découpe la création en plusieurs analyses successives sans autre changement : `generate` boucle déjà sur des tranches.

*Alternative écartée* : découper d'office par jour (7 analyses, 14 appels) — plus lent et plus coûteux pour un risque non constaté.

### D5 — Fenêtre `WeekAiModal`

`src/components/WeekAiModal.tsx`, `modal-card modal-card--picker`. Onglets par `.mode-toggle` (`Bilan` / `Remplir la semaine`). Props : `weekStart`, `slots`, `goal`, `canReview`, `onRequestReview`, `onClose`.

- **Onglet Bilan** : une phrase d'explication et le bouton « Demander le bilan », qui appelle `onRequestReview()` puis `onClose()`. `WeekPlanScreen.review` n'est pas modifié ; l'animation des icônes reste celle d'aujourd'hui.
- **Onglet Remplir**, quatre états : `GRID` → `PROPOSING` → `PROPOSALS` → `GENERATING`, plus `SETUP` (téléchargement du modèle) entre `GRID` et `PROPOSING`.
- **Grille** : `div.fill-grid` en CSS grid, une colonne d'intitulés de ligne et sept colonnes de jours ; en-têtes « lun 5 ». Chaque case est un `button` avec `aria-pressed`, `aria-label` (« Déjeuner du mardi 6 »), `disabled` si le créneau est garni. Classes : `.fill-cell`, `.selected` (verte, avec une coche), garni = `disabled` avec un point plein. La coche et le point évitent de s'en remettre à la seule couleur.
- **Créneau garni** : au moins un `MealSlot` pour ce `slotDate` et ce `mealType`, plat ou écart.
- **Liste des propositions** : `.picker-results` > `ul.ingredient-list` de `li.dish-line` : jour et repas en `.quantity-note`, nom, description, corbeille `.icon-button`.
- **Avancement** : `<progress className="progress-bar">` indéterminé et libellé d'étape en `role="status"` ; les trois étapes d'`analyze` sont relayées par `onStage`.
- **Verrou** : même `once` que `DishFromTextScreen` (verrou par `ref` + état) sur les deux validations. Il est extrait dans un hook `hooks/useOnce.ts` partagé par les deux écrans.
- **Annulation et fermeture** : `AbortController` par opération ; Échap, « Annuler » et le démontage l'interrompent. L'écriture en base (dernière étape) n'est pas interruptible et ne propose pas l'annulation.
- **Semaine figée** : `weekStart` et `slots` sont lus à l'ouverture et gardés dans l'état de la fenêtre.
- **Fin** : tout a réussi → `onClose()`. Échec partiel → la fenêtre reste sur la liste, réduite aux propositions sans plat, avec un message.

### D6 — Bouton d'en-tête

`onClick` ouvre `WeekAiModal`. `disabled` devient `isBusy` seul (une demande d'avis en cours) : la condition `filledDates.length === 0` passe dans l'onglet Bilan. `aria-label` et `title` deviennent « IA : bilan ou remplissage de la semaine ». L'onglet initial est « Remplir » si `filledDates` est vide.

### D7 — Préférences culinaires

`settingsRepository` : clé `appMeta` `foodPreferences`, fonctions `getFoodPreferences()` et `saveFoodPreferences(text)` (texte vide → suppression de la clé). Hors de `SECRET_META_KEYS` : ce n'est pas un secret, et l'utilisateur s'attend à le retrouver après une restauration.

`SettingsScreen` : nouveau `fieldset.ingredient-picker` « Préférences culinaires » avec un `textarea` (`maxLength={1000}`, 3 lignes, exemple en `placeholder`) et une `.quantity-note` disant qu'il est transmis à 1min.AI lors du remplissage. Enregistré par le bouton « Enregistrer » existant, avec les autres réglages.

Le texte est inséré dans la consigne entre guillemets, sous l'intitulé « Préférences de l'utilisateur, à respecter », tronqué à 1 000 caractères par sécurité. Il est lu au moment de la demande, pas à l'ouverture de la fenêtre.

### D8 — Modèle de recherche vérifié avant la première demande

`getEmbeddingStatus()` est appelé à la validation de la grille, avant la demande A : découvrir l'absence du modèle après avoir payé la proposition serait pire. S'il manque, l'état `SETUP` affiche `EmbeddingSetup` ; `onReady` enchaîne sur la proposition. La fenêtre appelle `acquireEmbedding()` tant qu'elle est ouverte.

## Risks / Trade-offs

- [Trois demandes facturées et une attente de plusieurs dizaines de secondes pour une semaine entière] → étapes nommées, annulation possible, rien d'écrit avant la fin.
- [Réponse tronquée ou tri dégradé sur 21 plats] → constante `MAX_DISHES_PER_ANALYSIS` (D4) ; échec par plat isolé ; relance sur les seules propositions restantes.
- [Quantités approximatives : la description vient de l'IA, pas de l'utilisateur] → toutes les lignes sont `ESTIMATE` côté analyse, donc marquées « estimé » au détail du plat ; les calories de l'entrée se corrigent au planning comme pour tout plat.
- [La description propose un poids, la décomposition pourrait le classer `USER`] → sans conséquence sur les grammes ; pour garder la marque d'estimation, `generate` force `isEstimated: true` sur toutes les lignes des plats du remplissage.
- [Catalogue encombré : chaque remplissage crée jusqu'à 21 plats] → dédoublonnage dans un même remplissage (D3) ; l'icône de l'IA permet de les repérer et de les supprimer. La réutilisation du catalogue est un Non-Goal assumé.
- [Préférences contradictoires ou ignorées par le modèle] → la relecture permet de supprimer une proposition avant qu'elle ne coûte une analyse.
- [Le bilan demande un appui de plus qu'avant] → accepté : c'est le prix d'un seul point d'entrée IA pour la semaine.
- [Un créneau se garnit pendant que la fenêtre est ouverte] → impossible en pratique (fenêtre modale) ; un créneau accepte de toute façon plusieurs entrées.

## Migration Plan

1. Préférences culinaires et bouton d'en-tête vers la fenêtre à onglets (onglet Bilan seul utilisable).
2. Onglet de remplissage : grille, proposition, liste.
3. Création et ajout au planning.

Aucune migration de données. Retour arrière : rétablir l'appel direct de `review` sur le bouton d'en-tête ; les plats et repas déjà créés restent des plats et repas ordinaires, et la clé `foodPreferences` est ignorée.

## Open Questions

- Formulation de la consigne de proposition (variété, simplicité, répartition des calories entre les repas) : à affiner à l'usage grâce aux traces de console, sans toucher aux specs.
