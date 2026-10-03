# Tasks

> Le projet n'embarque pas de framework de test (`package.json` : `dev`, `build`, `lint`, `preview`).
> La vérification se fait donc par observation dans `npm run dev`, plus `npm run build` et `npm run lint`.

## 1. Modèle de données

- [x] 1.1 Ajouter le champ booléen optionnel de marquage à `MealSlot` dans `src/db/schema.ts`, sans toucher à `db.version(1).stores(...)`, et vérifier que l'application démarre sur une base existante sans erreur Dexie
- [x] 1.2 Vérifier qu'un créneau enregistré avant ce changement se lit sans le champ et se comporte comme non marqué

## 2. Pastille dans la grille

- [x] 2.1 Rendre la pastille de courses avant le nom du plat, sur les seules entrées référençant un repas enregistré, et vérifier qu'une entrée d'écart n'en porte pas
- [x] 2.2 Appliquer l'état visuel gris / vert selon le marquage, et vérifier le contraste des deux états en thème clair comme en thème sombre
- [x] 2.3 Basculer le marquage au clic via `updateSlot`, et vérifier que la pastille change de couleur immédiatement
- [x] 2.4 Vérifier que le clic sur la pastille n'ouvre pas la fenêtre de modification et ne supprime pas l'entrée
- [x] 2.5 Vérifier la persistance en rechargeant l'application après avoir marqué un plat
- [x] 2.6 Vérifier qu'un marquage ne touche ni les autres entrées du créneau, ni la même recette planifiée un autre jour

## 3. Mise en page de la grille

- [x] 3.1 Réagencer la ligne d'entrée à trois éléments, sans toucher à la largeur des colonnes, puis vérifier qu'un nom de plat long ne chasse ni la pastille ni la corbeille
- [x] 3.2 Vérifier au doigt, sur mobile, que les trois cibles d'une entrée restent atteignables sans appui malencontreux
- [x] 3.3 Juger, une fois la pastille en place, si la largeur de colonne actuelle suffit, et n'élargir que si l'observation le réclame

## 4. Contrôle d'ensemble

- [x] 4.1 Marquer plusieurs plats d'une semaine mêlant recettes, plats tout prêts et écarts, puis vérifier que l'état de chacun est celui attendu après rechargement
- [x] 4.2 Exécuter `npm run lint` et `npm run build` et vérifier qu'ils passent sans nouvelle erreur
