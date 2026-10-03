# Proposal

## Why

La liste de courses n'existe pas encore, et la façon évidente de la construire — ramasser automatiquement les ingrédients de tous les repas planifiés — ne convient pas : le placard et le frigo contiennent déjà de quoi couvrir une partie des repas à venir. Une liste qui se remplit toute seule ferait racheter ce qu'on possède déjà.

Il faut donc que l'utilisateur désigne lui-même, repas par repas, ce qui doit partir aux courses. Le planning est l'endroit naturel pour ce geste : c'est là qu'on voit la semaine et qu'on sait ce qui manque.

## What Changes

- Chaque entrée du planning portant un repas enregistré gagne une **pastille de courses**, placée avant le nom du plat.
- La pastille a deux états : **grisée** (le plat ne part pas aux courses) et **verte** (il y part). Un clic bascule de l'un à l'autre.
- L'état par défaut est **grisé** : rien ne part aux courses sans un geste explicite, y compris pour les repas déjà planifiés avant ce changement.
- L'état est enregistré sur le créneau et survit au rechargement.
- Les entrées d'écart ne portent pas de pastille : elles ne correspondent à aucun achat.
- La largeur des colonnes est réévaluée une fois la pastille en place : on regarde ce que donnent trois contrôles par entrée avant de décider d'élargir.

Pas de changement cassant.

## Capabilities

### New Capabilities

<!-- Aucune : le marquage enrichit la capacité de planning existante. -->

### Modified Capabilities

- `meal-planning`: une entrée de planning peut désormais être marquée comme devant alimenter la liste de courses.

## Impact

- `src/db/schema.ts` : un champ booléen non indexé sur `MealSlot`. Aucune migration Dexie, les créneaux existants le liront comme absent, donc désactivé.
- `src/screens/planning/WeekPlanScreen.tsx` : rendu de la pastille et bascule de son état.
- `src/db/repositories/planningRepository.ts` : `updateSlot` existe déjà et suffit à enregistrer la bascule.
- `src/index.css` : largeur des colonnes et mise en page de la ligne d'entrée, désormais à trois éléments.
- `public/icons/nav/caddie.svg` : réutilisée comme pastille, recolorée par `MaskIcon`.
- Hors périmètre, décidé explicitement : **la page Courses elle-même**. Ce lot pose le marquage ; la construction de la liste à partir des plats marqués fera l'objet d'une change suivante. Conséquence assumée — tant qu'elle n'est pas faite, la pastille enregistre une intention sans produire encore de liste.
- Hors périmètre également, prévu dans un second temps : le retour de la page Courses vers le planning, où retirer un ingrédient de la liste regriserait la pastille correspondante.
