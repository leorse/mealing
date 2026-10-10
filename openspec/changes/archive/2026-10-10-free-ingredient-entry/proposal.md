# Proposal

## Why

Lors de la saisie d'un plat maison, un ingrédient ne peut être ajouté que s'il figure déjà parmi les aliments enregistrés (Ciqual pour l'essentiel). Quand la recherche ne donne rien — épice rare, produit local, préparation maison —, l'utilisateur est bloqué : il doit renoncer à l'ingrédient ou en choisir un autre qui ne correspond pas, ce qui fausse aussi sa liste de courses.

## What Changes

- La fenêtre d'ajout d'un ingrédient propose deux modes, au choix de l'utilisateur : **Rechercher** (comportement actuel, parmi les aliments enregistrés dont la liste Ciqual) et **Saisie libre**.
- En saisie libre, l'utilisateur donne un **nom** et une **quantité en grammes** (100 g par défaut), puis valide : l'ingrédient est ajouté au plat.
- La saisie libre propose aussi les **valeurs nutritionnelles pour 100 g** (calories, protéines, glucides, lipides), toutes à **0 par défaut** et facultatives.
- Ces valeurs restent **modifiables après coup**, depuis la ligne de l'ingrédient dans l'écran de saisie du plat.
- Quand une recherche ne renvoie aucun résultat, la fenêtre propose de passer en saisie libre en reprenant le texte cherché comme nom.
- Un ingrédient libre est enregistré comme aliment personnel : il se retrouve ensuite par la recherche, avec ses valeurs. Un nom déjà pris par un aliment personnel ne peut pas être saisi une seconde fois : la fenêtre renvoie vers la recherche.
- Tant que ses valeurs sont toutes à zéro, l'ingrédient compte pour zéro dans le calcul du plat et l'écran le signale sur sa ligne, pour que le total ne passe pas pour complet.
- Il suit le reste du parcours comme tout autre ingrédient : quantité modifiable sur place, retrait, liste de courses.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `recipe-authoring` : la fenêtre de sélection gagne un mode de saisie libre (nom, quantité, valeurs nutritionnelles facultatives) à côté de la recherche ; la condition de validation en tient compte ; les valeurs d'un aliment personnel se corrigent depuis sa ligne ; une ligne aux valeurs non renseignées est signalée.

## Impact

- **Code** : `src/components/IngredientPickerModal.tsx` (bascule de mode, formulaire libre), nouveau composant de fenêtre pour corriger les valeurs d'un aliment personnel, `src/screens/recipes/RecipeFormScreen.tsx` (action de correction et signalement sur la ligne), `src/db/repositories/ingredientRepository.ts` (liste des aliments personnels), `src/index.css` (classes existantes réutilisées en priorité).
- **Données** : aucun changement de schéma ni migration ; les aliments libres rejoignent la table `ingredients` (`source: 'CUSTOM'`) et sont repris tels quels par l'export et l'import.
- **Écrans en aval** : fiche du plat, planning, liste de courses et avis de l'IA lisent ces aliments comme les autres, sans changement de code attendu ; une correction de valeurs s'y répercute.
- **Docs** : `docs/architecture/data-model.md`, `docs/architecture/domain-rules.md`, `docs/design/components.md`, `docs/log.md`.
- **Dépendances** : aucune.
