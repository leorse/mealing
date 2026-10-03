# Tasks

> Le projet n'embarque pas de framework de test (`package.json` : `dev`, `build`, `lint`, `preview`).
> La vérification se fait donc par observation dans `npm run dev`, plus `npm run build` et `npm run lint`.

## 1. Fenêtre de choix du repas

- [x] 1.1 Créer le composant de fenêtre dans `src/components/`, avec l'entrée à modifier en option, `onConfirm` et `onCancel`, et vérifier qu'il s'ouvre et se ferme depuis la grille
- [x] 1.2 Ajouter le sélecteur de mode Recette / Écart et vérifier que basculer de mode change les champs proposés
- [x] 1.3 En mode Recette, lister les recettes et plats tout prêts avec leur type et un champ de recherche par nom, et vérifier que la liste se restreint à la saisie
- [x] 1.4 Afficher un message dédié quand la bibliothèque ne contient aucune recette, et le vérifier sur une base vide
- [x] 1.5 Pré-remplir le champ calories au choix d'une recette — `caloriesPerServing` pour un plat tout prêt, `computeRecipeNutrition` + `perServing` pour une recette maison — et vérifier la valeur sur un exemple de chaque type
- [x] 1.6 Mettre à jour le champ calories à chaque changement de recette avant validation, et le vérifier en enchaînant deux choix
- [x] 1.7 En mode Écart, proposer les champs nom et calories en saisie libre, et vérifier qu'aucune recette n'est retenue à la validation
- [x] 1.8 Conditionner la validation — recette obligatoire en mode Recette, calories strictement positives dans les deux modes — et vérifier que le bouton reste indisponible dans chaque cas
- [x] 1.9 Reprendre les classes de la fenêtre d'ingrédient (`.modal-card--picker`, `.picker-*`, `.modal-button--*`) et styler le sélecteur de mode en couleurs système, puis vérifier le rendu en thème clair et sombre

## 2. Enregistrement des entrées

- [x] 2.1 À la validation d'un ajout, écrire le créneau via `addSlotForWeek` selon la projection des deux modes (`recipeId`, `freeLabel`, `isDeviation`, `caloriesOverride`), et vérifier en base qu'une recette ajoutée porte bien son `recipeId`
- [x] 2.2 À la validation d'une modification, écrire via `updateSlot` et vérifier qu'aucune entrée supplémentaire n'est créée sur le créneau
- [x] 2.3 Vérifier que l'annulation, en ajout comme en modification, laisse le planning inchangé

## 3. Grille du planning

- [x] 3.1 Remplacer `daySlots.find` par `daySlots.filter` pour rendre toutes les entrées d'un créneau, et vérifier qu'un plat et un écart coexistent sur le même déjeuner
- [x] 3.2 Rendre le bouton d'ajout permanent sous les entrées d'un créneau, et vérifier qu'il reste utilisable une fois une entrée posée
- [x] 3.3 Rendre chaque entrée activable pour ouvrir la fenêtre en modification pré-remplie, et vérifier le mode, la recette et les calories à la réouverture
- [x] 3.4 Vérifier que le total du jour additionne toutes les entrées de tous les créneaux
- [x] 3.5 Vérifier la lisibilité et la zone cliquable d'une colonne chargée de plusieurs entrées, au doigt sur mobile
- [x] 3.6 Ajouter une action de suppression sur chaque entrée, appelant `deleteSlot`, et vérifier que l'entrée disparaît et que les autres restent
- [x] 3.7 Vérifier que supprimer n'ouvre pas la fenêtre de modification, et que le total du jour se met à jour après suppression
- [x] 3.8 Vérifier qu'un créneau vidé de sa dernière entrée repropose l'ajout

## 4. Retrait de l'ancien parcours

- [x] 4.1 Supprimer `AddMealScreen` et sa route `/planning/:date/add` du routeur, et vérifier qu'aucune référence ne subsiste dans `src/`
- [x] 4.2 Vérifier qu'aucun lien de la grille ne pointe plus vers l'ancienne route

## 5. Contrôle d'ensemble

- [x] 5.1 Planifier une journée complète mêlant recettes, plat tout prêt et écart, puis vérifier les totaux du jour et de la semaine
- [x] 5.2 Vérifier que les créneaux enregistrés avant ce changement s'affichent toujours correctement
- [x] 5.3 Exécuter `npm run lint` et `npm run build` et vérifier qu'ils passent sans nouvelle erreur
