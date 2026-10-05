# Proposal

## Why

La recherche d'ingrédient renvoie les aliments dont le nom contient le texte saisi, sans ordre utile. En tapant « pomme », on obtient pêle-mêle des aliments comme « Aligot (purée de pomme de terre…) », « Jus de pomme » ou « Pomme, chair et peau, crue ». L'aliment cherché se perd parmi 97 résultats. De plus, la limite de 50 résultats s'applique avant tout classement : le bon aliment peut ne jamais apparaître.

## What Changes

- Les résultats sont **classés en quatre niveaux**, chacun trié par ordre alphabétique :
  1. le nom commence par le mot cherché, suivi d'une virgule ou de rien (« Pomme, chair et peau, crue ») ;
  2. le nom commence par le mot cherché, suivi d'un autre mot (« Pomme Gala, … », « Pomme Golden, … ») ;
  3. le nom commence par le mot cherché, suivi d'une liaison — de, du, des, d', à, au, aux, en (« Pomme de terre, … ») ;
  4. le mot cherché apparaît ailleurs dans le nom ou dans la marque (« Compote de pomme », « Jus de pomme »).
- Une saisie partielle classe d'après le mot qu'elle commence : « pom » classe « Pomme, … » au niveau 1 et « Pomme de terre » au niveau 3.
- La recherche ignore la **casse et les accents** : « pate » trouve « Pâte ».
- Le classement se fait **sur tous les aliments correspondants**, puis la liste est limitée. Le meilleur résultat n'est plus jamais coupé.

Pas de changement cassant : les aliments trouvés sont les mêmes qu'avant, plus ceux qui ne différaient que par un accent.

## Capabilities

### New Capabilities

- `ingredient-search`: correspondance et classement des résultats d'une recherche d'ingrédient par nom, indépendamment de l'écran qui l'utilise.

### Modified Capabilities

<!-- Aucune : l'exigence de `recipe-authoring` (« la liste affiche les ingrédients dont le nom ou la marque contient le texte saisi ») reste vraie. -->

## Impact

- `src/services/ingredientSearch.ts` (nouveau) : normalisation et classement, en fonctions pures.
- `src/db/repositories/ingredientRepository.ts` : `search` filtre, classe, puis limite.
- `src/components/IngredientPickerModal.tsx` : aucun changement de code ; seul utilisateur actuel de `search`, il bénéficie du nouvel ordre.
- `docs/architecture/domain-rules.md` : règles de recherche.
- Hors périmètre : recherche par mots dans le désordre, tolérance aux fautes de frappe, recherche Open Food Facts, écran `/ingredients` (encore « À venir », il réutilisera ce classement).
