# Design

## Context

Voir `proposal.md` — Why. Exigences dans `specs/ingredient-search/spec.md`.

État actuel :

- `ingredientRepository.search(query)` : texte vide → 50 premiers par nom ; sinon `db.ingredients.filter(nom ou marque contient, en minuscules).limit(50)`. Le filtre parcourt la table dans l'ordre de la clé primaire (uuid), donc les 50 résultats sont arbitraires.
- Seul appelant : `IngredientPickerModal`, qui appelle `search` à chaque frappe à partir de 2 caractères.
- La table compte environ 3 300 aliments Ciqual, plus les imports Open Food Facts et les aliments personnels.
- Les noms Ciqual suivent le schéma « Aliment[ précision], détail, détail » : la première virgule sépare l'aliment de ses précisions (« Pomme, chair et peau, crue », « Pomme de terre, bouillie/cuite à l'eau »).

## Goals / Non-Goals

**Goals**

- Un classement déterministe, explicable, testable sur des noms réels.
- Aucun changement pour l'écran appelant.

**Non-Goals**

- Recherche floue, mots dans le désordre, pondération par fréquence d'usage.
- Index de recherche persistant.

## Decisions

### Le classement est une fonction pure dans `services/ingredientSearch.ts`

Deux fonctions : `normalize(text)` (minuscules, décomposition Unicode NFD, suppression des diacritiques) et `rankIngredients(ingredients, query)` qui filtre, classe et renvoie la liste ordonnée. Le repository charge, appelle, puis coupe à 50.

*Pourquoi* : même découpage que `nutrition.ts` et `shopping.ts` ; le classement se vérifie sur un jeu de noms sans IndexedDB.

### Le niveau se calcule sur le mot qu'achève la saisie

Avec `n = normalize(nom)` et `q = normalize(saisie).trim()` :

1. Si `n` ne commence pas par `q` → niveau 4 (s'il correspond par ailleurs).
2. Sinon, on complète le mot en cours : on avance dans `n` après `q` tant que les caractères sont des lettres. Ce qui suit est le **reste**.
3. Reste vide ou commençant par une virgule → niveau 1.
4. Reste commençant par un espace suivi d'une liaison (`de`, `du`, `des`, `d'`, `a`, `au`, `aux`, `en`, accents déjà retirés) puis d'un espace, d'une apostrophe ou de la fin → niveau 3.
5. Sinon (autre mot, parenthèse…) → niveau 2.

*Pourquoi compléter le mot* : sans cela, « pom » ne classerait rien au niveau 1 (« Pomme, … » continue par « me, »). Avec, la saisie partielle se comporte comme le mot entier qu'elle commence, et « Pommes de terre… » (pluriel) suit la même règle que « Pomme de terre ».

*Saisie de plusieurs mots* : la règle s'applique telle quelle à la saisie entière. « pomme de terre » met « Pomme de terre, … » au niveau 1 et « Pomme de terre dauphine » au niveau 2.

*Alternative écartée* : se fier à la première virgule seule (niveau 1 = première partie égale à la saisie). Elle range ensemble variétés et noms composés, ce que l'utilisateur ne veut pas (« Pomme Gala » et « Pomme de terre » sont de natures différentes).

### Tri alphabétique insensible à la casse et aux accents

À l'intérieur d'un niveau : `a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })`.

*À savoir* : dans l'ordre français, l'espace précède la virgule ; au niveau 3, « Pomme de terre dauphine » précède donc « Pomme de terre, bouillie ». C'est l'ordre alphabétique attendu d'un dictionnaire, sans effet sur la séparation des niveaux.

### Classer tout, puis couper

`search` charge tous les aliments (`toArray`), classe, puis garde les 50 premiers. Texte vide : comportement inchangé (50 premiers par nom).

*Pourquoi pas de filtre Dexie avant* : un filtre `filter()` de Dexie parcourt de toute façon toute la table ; charger puis filtrer en mémoire coûte le même parcours, et la normalisation se fait une fois par nom.

*Coût* : environ 3 300 noms normalisés à chaque frappe. Négligeable à l'échelle d'une saisie ; si cela se voyait, un cache des noms normalisés en mémoire de module serait la suite, sans changer le contrat.

## Risks / Trade-offs

- **Heuristique des liaisons** → couvre la forme des noms Ciqual (« X de Y », « X à la Y ») ; un nom personnel atypique peut se retrouver au niveau 2 plutôt que 3. Sans gravité : il reste dans les résultats, juste un cran plus haut.
- **Accents ignorés** → « pâte » et « pâté » se confondent dans la correspondance. C'est voulu (on tape rarement les accents sur mobile) ; l'ordre alphabétique les départage.
- **Marque seule** → un aliment trouvé uniquement par sa marque tombe au niveau 4. Acceptable : on cherche surtout par nom d'aliment.
