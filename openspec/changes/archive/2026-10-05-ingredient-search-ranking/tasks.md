# Tasks

> Pas de framework de test : la fonction pure se vérifie par un script sur les noms réels de `public/seed/ciqual.json` ; l'écran par observation dans `npm run dev`. Puis `npm run lint` et `npm run build`.

## 1. Classement

- [x] 1.1 Créer `src/services/ingredientSearch.ts` avec `normalize` (minuscules, NFD, sans diacritiques) et vérifier que `normalize('Pâté')` vaut `pate`
- [x] 1.2 Ajouter `rankIngredients(ingredients, query)` : correspondance sur nom ou marque normalisés, calcul du niveau 1 à 4 selon `design.md`, tri par niveau puis `localeCompare` français ; vérifier par script sur `ciqual.json` l'ordre attendu de chaque scénario de la spec pour « pomme », « pom », « POMME », « pomme de terre » et « pate »
- [x] 1.3 Décrire les règles de recherche dans `docs/architecture/domain-rules.md`

## 2. Branchement

- [x] 2.1 Faire classer `ingredientRepository.search` sur tous les aliments avant de garder les 50 premiers, texte vide inchangé ; vérifier par `npm run build`
- [x] 2.2 Dans la fenêtre d'ajout d'ingrédient d'un plat maison, taper « pomme » et vérifier que « Pomme, chair et peau, crue » apparaît en tête et « Jus de pomme » après les pommes de terre

## 3. Contrôle d'ensemble

- [x] 3.1 Exécuter `npm run lint` et `npm run build` sans nouvelle erreur, puis ajouter une ligne à `docs/log.md`
