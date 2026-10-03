# Tasks

> Le projet n'embarque pas de framework de test (`package.json` : `dev`, `build`, `lint`, `preview`).
> La vérification se fait donc par observation dans `npm run dev`, plus `npm run build` et `npm run lint`.

## 1. Composant de fenêtre de sélection

- [x] 1.1 Créer le composant de fenêtre dans `src/components/`, avec `open`, les identifiants déjà présents, `onConfirm({ ingredient, quantityG })` et `onCancel`, et vérifier qu'il s'ouvre et se ferme depuis un montage de test manuel
- [x] 1.2 Y déplacer la recherche d'ingrédients (seuil de deux caractères, drapeau d'annulation, appel à `search()` du `ingredientRepository`) et vérifier qu'une saisie de deux caractères affiche des résultats
- [x] 1.3 Afficher l'état « aucun résultat » et vérifier qu'une recherche sans correspondance l'affiche au lieu d'une liste vide muette
- [x] 1.4 Ajouter la sélection d'un résultat et le champ de quantité pré-rempli à 100 g, et vérifier que le choix se reflète dans la fenêtre
- [x] 1.5 Conditionner la validation à une sélection et à une quantité strictement positive, et vérifier qu'elle est indisponible sans sélection puis avec une quantité à 0
- [x] 1.6 Marquer comme déjà ajoutés, et rendre non sélectionnables, les ingrédients présents dans la recette, et vérifier qu'un ingrédient déjà ajouté apparaît signalé plutôt qu'ignoré
- [x] 1.7 Gérer la fermeture au clavier (échappement) et le focus à l'ouverture, et vérifier la navigation au clavier seul

## 2. Mise en page et thème de la fenêtre

- [x] 2.1 Borner la hauteur de la carte et rendre la seule liste de résultats défilante dans `src/index.css`, puis vérifier avec une recherche large que champ de recherche, champ de quantité et boutons restent visibles pendant le défilement
- [x] 2.2 Remplacer les `#ddd` / `#eee` de la fenêtre et de la zone d'ingrédients par `canvas`, `canvastext` et `color-mix(in srgb, canvasText X%, transparent)`, et vérifier en thème sombre que les séparateurs ne ressortent plus en traits clairs
- [x] 2.3 Appliquer `.dark-invert` aux icônes à couleur figée de la zone, et vérifier en thème sombre que l'icône du bouton d'ajout reste visible
- [x] 2.4 Vérifier le rendu de la fenêtre dans les deux thèmes en basculant le thème du système

## 3. Raccordement de l'écran de recette

- [x] 3.1 Retirer de `RecipeFormScreen` le champ de recherche en ligne, la liste de suggestions, `ingredientQuery` et `ingredientResults`, et vérifier que le formulaire ne bouge plus pendant une recherche
- [x] 3.2 Ajouter le bouton d'ajout en tête de la zone « Ingrédients » et l'ouverture de la fenêtre, et vérifier qu'un ingrédient validé apparaît dans la liste avec la quantité saisie
- [x] 3.3 Vérifier que la ligne conserve son champ de quantité modifiable et son action de retrait, en corrigeant une quantité puis en retirant un ingrédient
- [x] 3.4 Vérifier que l'annulation de la fenêtre n'ajoute rien à la recette
- [x] 3.5 Vérifier que l'état « aucun ingrédient ajouté » s'affiche toujours sur une recette vide

## 4. Contrôle d'ensemble

- [x] 4.1 Créer une recette de bout en bout avec plusieurs ingrédients, l'enregistrer, et vérifier sur l'écran de détail que les valeurs nutritionnelles correspondent aux quantités saisies, y compris après correction d'une quantité dans la liste
- [x] 4.2 Ouvrir une recette existante en modification et vérifier que ses ingrédients s'affichent avec leur quantité et que le bouton d'ajout ouvre la même fenêtre
- [x] 4.3 Vérifier que le type « plat tout prêt » est inchangé, sans zone d'ingrédients
- [x] 4.4 Exécuter `npm run lint` et `npm run build` et vérifier qu'ils passent sans nouvelle erreur
