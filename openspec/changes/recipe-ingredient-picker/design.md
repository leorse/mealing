# Design

## Context

Voir `proposal.md` — Why, pour la motivation.

État actuel dans `src/screens/recipes/RecipeFormScreen.tsx` :

- un état local `ingredients: DraftIngredient[]` (`{ ingredient, quantityG }`) ;
- `ingredientQuery` / `ingredientResults`, alimentés par un `useEffect` qui appelle `search()` du `ingredientRepository` au-delà de deux caractères ;
- `addIngredient` (quantité figée à 100 g, doublon ignoré en silence), `updateQuantity`, `removeIngredient` ;
- à la soumission, `computeRecipeNutrition(ingredients)` consomme `quantityG`.

Pour les fenêtres, le projet dispose déjà de `ConfirmModal` et des styles `.modal-overlay` / `.modal-card`. `ConfirmModal` est figé sur un couple Oui/Non et ne porte pas de contenu libre.

Sur le thème, l'application déclare `color-scheme: light dark` et utilise les couleurs système par endroits (`.modal-card { background: canvas; color: canvastext }`, `color-mix(in srgb, canvasText 6%, transparent)`), mais la zone d'ingrédients est codée en dur : `.ingredient-picker input`, `.ingredient-suggestions` et ses `li button` portent des `#ddd` / `#eee`.

## Goals / Non-Goals

**Goals**

- Sortir la sélection d'ingrédient du flux du formulaire.
- Ne pas toucher au modèle de données ni au calcul nutritionnel.
- Laisser la zone d'ingrédients correcte dans les deux thèmes.

**Non-Goals**

- Sélection multiple : la quantité se saisissant par ingrédient, la fenêtre en traite un seul à la fois.
- Création d'un ingrédient absent de la base depuis la fenêtre : parcours distinct, déjà servi par l'écran de recherche d'ingrédients.
- Reprise des `#ddd` / `#eee` ailleurs dans la feuille de style : ce travail se limite à la zone d'ingrédients et à la fenêtre.
- Correction du défilement de la coquille : traitée par la change `fix-app-scroll`.

## Decisions

### Un composant de fenêtre dédié, pas une extension de `ConfirmModal`

Un nouveau composant, par exemple `IngredientPickerModal`, prend un `open`, la liste des identifiants déjà présents, un `onConfirm({ ingredient, quantityG })` et un `onCancel`.

*Pourquoi* : `ConfirmModal` a une signature message + Oui/Non ; la généraliser pour accueillir un contenu libre reviendrait à écrire le nouveau composant tout en fragilisant ses deux usages actuels (`RecipeListScreen`, `RecipeDetailScreen`). Les styles `.modal-overlay` / `.modal-card` restent partagés.

### L'état de sélection vit dans la fenêtre, pas dans l'écran

La fenêtre porte sa recherche, ses résultats, sa sélection et sa quantité ; elle ne remonte rien tant que l'utilisateur n'a pas validé. L'écran de recette ne garde que `ingredients`.

*Pourquoi* : c'est ce qui rend l'annulation gratuite — fermer la fenêtre jette son état. Cela retire aussi `ingredientQuery` et `ingredientResults` de l'écran, qui sont la cause des sauts de mise en page.

*Alternative écartée* : conserver la recherche dans l'écran et ne déporter que l'affichage. L'écran resterait sensible à la frappe.

### Réutiliser `search()` telle quelle

Le `useEffect` de recherche, avec son seuil de deux caractères et son drapeau d'annulation, se déplace dans la fenêtre sans changer de logique. `search()` renvoie déjà au plus 50 résultats.

*Note* : `search()` ne filtre pas les ingrédients déjà présents dans la recette. Le marquage « déjà ajouté » se fait côté fenêtre, à partir de la liste d'identifiants reçue — ce qui permet de les montrer désactivés plutôt que de les faire disparaître, et évite le silence actuel de `addIngredient`.

### La hauteur de la fenêtre est bornée, la liste seule défile

La carte reçoit une hauteur maximale relative au viewport ; à l'intérieur, seule la liste de résultats défile, le champ de recherche, le champ de quantité et les boutons restant fixes.

*Pourquoi* : c'est l'objet même du changement. `.modal-card` n'a aujourd'hui qu'un `max-width: 320px`, sans contrainte de hauteur — elle est donc à compléter, pas à réutiliser telle quelle.

### Couleurs système plutôt que valeurs figées

Dans la fenêtre et la zone d'ingrédients : `canvas` / `canvastext` pour les surfaces, et `color-mix(in srgb, canvasText X%, transparent)` pour les bordures, séparateurs et états de survol. Toute icône à couleur figée porte `.dark-invert`.

*Pourquoi* : c'est le motif déjà retenu par les parties récentes de la feuille de style. Déplacer les `#ddd` actuels dans une fenêtre à fond `canvas` les rendrait plus visibles encore en thème sombre.

### La quantité est saisie deux fois, volontairement

Elle est saisie dans la fenêtre à l'ajout, puis reste modifiable dans la ligne.

*Pourquoi* : la fenêtre fixe le bon grammage dès l'ajout, sans passer par un 100 g par défaut à corriger ensuite ; le champ en ligne permet l'ajustement répété — l'opération la plus fréquente quand on cale une recette — sans rouvrir de fenêtre. C'est une redondance assumée, pas un oubli.

## Risks / Trade-offs

- **Une ouverture de fenêtre par ingrédient** → coût réel sur une recette longue, accepté en contrepartie d'un écran stable ; la sélection multiple reste ouverte comme évolution ultérieure.
- **Un ingrédient absent de la base n'a pas de porte de sortie dans la fenêtre** → comportement inchangé par rapport à aujourd'hui, mais il devient plus visible ; à traiter séparément si la gêne se confirme.
- **Fermeture accidentelle par clic sur le fond** → `ConfirmModal` ferme au clic sur l'overlay ; la saisie perdue est ici plus coûteuse, donc à confirmer au moment de l'implémentation.
- **Accessibilité clavier** → la fenêtre doit pouvoir se fermer à l'échappement et recevoir le focus à l'ouverture ; aucun précédent dans le projet, à poser ici.

## Migration Plan

Aucune migration de données : la structure `{ ingredientId, quantityG }` est inchangée, les recettes existantes s'ouvrent et s'enregistrent à l'identique. Retour arrière par restauration de l'écran dans son état précédent.
