# Proposal

## Why

La pastille de courses du planning enregistre déjà quels plats doivent être achetés, mais rien n'en fait une liste : la page Courses est une coquille « À venir ». L'intention existe sans produire de résultat.

Il faut maintenant la liste elle-même : ce qu'il y a à acheter, avec la possibilité d'écarter ce qu'on possède déjà, de supprimer ce qui n'a plus lieu d'être, et de voir de quel plat vient chaque ingrédient — y compris quand le même plat est planifié plusieurs fois.

## What Changes

- La page **Courses** affiche une liste unique, construite à partir de **toutes** les entrées du planning dont la pastille est verte, **quelle que soit leur date**. La liste n'est liée à aucune semaine : un plat marqué il y a un mois y figure tant qu'il n'en a pas été supprimé.
- La quantité d'un ingrédient est celle **inscrite dans la recette**, telle quelle, pour chaque plat marqué : deux plats à 100 g de tomates donnent 200 g.
- Une bascule **Par ingrédient / Par plat** offre deux lectures de la même liste :
  - **Par ingrédient** : une ligne par ingrédient, quantités additionnées, avec la provenance (noms des plats, `×N` quand le même plat revient). La ligne se déplie pour montrer chaque occurrence — plat, date, repas, quantité.
  - **Par plat** : un bloc par occurrence de plat, avec ses ingrédients et leurs quantités.
- Chaque article porte **deux boutons** :
  - un **bouton de courses**, vert par défaut puisque l'article vient d'un plat choisi au planning. Un clic le **désactive** — l'article reste affiché, grisé, et ne compte plus ; un second clic le réactive ;
  - un **bouton rouge de suppression**, qui retire l'article de la liste pour de bon.
- Ces deux gestes existent à trois niveaux : un ingrédient pour un seul plat, un ingrédient pour toute la liste, un plat entier.
- Supprimer un plat entier — ou son dernier ingrédient — **regrise sa pastille au planning**. Le repas, lui, reste planifié.
- Un bouton général **« Tout supprimer »** vide la liste, après confirmation, pour repartir d'une liste vide.
- Réactiver une pastille au planning remet le plat **complet** dans la liste.
- Un **plat tout prêt** n'a pas d'ingrédients : il est lui-même l'article à acheter.
- L'état de chaque article est enregistré et survit au rechargement.

Pas de changement cassant.

## Capabilities

### New Capabilities

- `shopping-list`: construction de la liste de courses à partir des plats marqués au planning, ses deux vues, la provenance des ingrédients, la désactivation réversible et la suppression d'articles, le vidage de la liste.

### Modified Capabilities

<!-- Aucune : les exigences de `meal-planning` sur la pastille (présence, deux états, bascule, persistance) restent inchangées. Que la page Courses puisse la regriser et que sa réactivation remette le plat complet sont des exigences de `shopping-list`. -->

## Impact

- `src/screens/shopping/ShoppingListScreen.tsx` : remplace la coquille « À venir ».
- `src/services/shopping.ts` (nouveau) : construction pure de la liste à partir des créneaux, recettes et ingrédients.
- `src/hooks/useShoppingList.ts` (nouveau) : lecture réactive de la liste.
- `src/db/schema.ts` : un champ optionnel non indexé sur `MealSlot` pour l'état des articles. Aucune migration Dexie.
- `src/db/repositories/planningRepository.ts` : lecture de toutes les entrées marquées, écriture de l'état des articles, marquage et démarquage d'une entrée, vidage de la liste.
- `src/screens/planning/WeekPlanScreen.tsx` : la bascule de la pastille passe par la nouvelle fonction de marquage, qui repart d'un plat complet.
- `src/components/MealPickerModal.tsx` : oubli de l'état des articles quand le plat d'une entrée change.
- `src/index.css` : classes pour les lignes de la liste, leurs deux boutons et l'état désactivé ; la bascule, les cartes et la pastille du planning sont réutilisées.
- `docs/` : routes, modèle de données, règles métier, catalogue des classes, journal.
- Hors périmètre : cocher un article comme « acheté », ajouter un article à la main, regrouper par rayon, convertir les unités, ajuster les quantités au nombre de portions, exporter ou partager la liste. Les tables `shoppingLists` et `shoppingItems` restent inutilisées.
