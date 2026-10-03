# Design

## Context

Voir `proposal.md` — Why.

État actuel :

- `MealSlot` porte `recipeId`, `freeLabel`, `isDeviation`, `caloriesOverride`. Rien n'exprime une intention d'achat.
- Une entrée du planning se rend aujourd'hui en deux éléments : une zone cliquable qui ouvre la modification, et une corbeille. La pastille en ajoute un troisième.
- La grille est en `grid-template-columns: repeat(7, minmax(130px, 1fr))`. À 130 px, trois contrôles plus un nom de plat ne tiennent pas.
- Les tables `shoppingLists` et `shoppingItems` existent dans le schéma Dexie mais ne sont écrites par personne, et aucun `shoppingRepository` n'existe. Ce lot ne les touche pas.
- `MaskIcon` recolore une icône monochrome par masque CSS ; `public/icons/nav/caddie.svg` sert déjà d'icône de navigation pour les courses.

## Goals / Non-Goals

**Goals**

- Un geste par repas, explicite, réversible, persistant.
- Ne rien envoyer aux courses par défaut.
- Un état unique, lisible et modifiable depuis les deux écrans à terme : la page Courses aura le dernier mot et pourra regriser une pastille.

**Non-Goals**

- La page Courses et la construction de la liste.
- Les quantités : ce lot dit *quels plats*, pas *combien*.
- Un marquage global du type « toute la semaine », qui irait contre l'intention.

## Decisions

### Le marquage est un champ booléen non indexé sur le créneau

`MealSlot` reçoit un champ optionnel, par exemple `includeInShopping?: boolean`.

*Pourquoi sur le créneau et non sur la recette* : la même recette planifiée deux fois dans la semaine doit pouvoir être achetée une fois et pas l'autre. L'intention porte sur l'occurrence, pas sur le plat.

*Pourquoi non indexé* : la grille charge déjà tous les créneaux de la semaine et filtre en mémoire. Aucun index n'est nécessaire, donc `db.version(1).stores(...)` reste inchangé et il n'y a pas de migration.

*Alternative écartée* : une table de liaison entre créneaux et liste de courses. Elle n'apporterait rien tant qu'il n'y a pas de liste, et imposerait une migration.

### L'absence vaut non marqué

Le champ est optionnel et lu comme faux lorsqu'il est absent.

*Pourquoi* : les créneaux déjà enregistrés n'ont pas ce champ. Les traiter comme non marqués est à la fois le comportement attendu par défaut et exactement ce que demande l'utilisateur — rien ne part aux courses tout seul. Aucune reprise de données n'est nécessaire.

### La pastille est un bouton à part entière

Trois zones cliquables indépendantes dans une ligne : pastille, corps de l'entrée, corbeille.

*Pourquoi* : la pastille ne doit ni ouvrir la modification ni supprimer. Un bouton distinct évite d'avoir à arrêter la propagation d'un clic, source classique de régressions.

*À surveiller* : trois cibles tactiles dans une case étroite. C'est le risque principal de ce lot.

### La largeur des colonnes est repoussée après coup

Les colonnes gardent pour l'instant leur minimum de 130 px. On pose la pastille, on regarde, puis on décide.

*Pourquoi* : élargir à l'aveugle se paierait en jours visibles d'un coup, pour un gain que personne n'a encore constaté. La ligne d'entrée est réagencée pour accueillir trois éléments proprement ; si cela suffit à 130 px, il n'y a rien à élargir.

### L'état de la pastille se déduit du créneau, sans état local

Le rendu lit le créneau, le clic appelle `updateSlot`, et `useLiveQuery` rafraîchit la grille.

*Pourquoi* : un état local dupliquerait la source de vérité et pourrait diverger. Le chemin est déjà celui de la suppression.

## Risks / Trade-offs

- **Densité tactile** → trois contrôles par entrée dans des colonnes étroites. À vérifier au doigt ; si c'est trop serré, la pastille peut passer en pastille d'angle plutôt qu'en élément de la ligne.
- **Une intention sans effet visible** → tant que la page Courses n'existe pas, marquer un plat ne produit rien d'observable hors de la pastille. Assumé, c'est la découpe choisie.
- **Marquages oubliés** → un plat marqué il y a trois semaines restera marqué. La page Courses devra décider du périmètre temporel qu'elle ramasse ; ce lot ne tranche pas cette question.

## Migration Plan

Aucune migration : champ optionnel non indexé, `db.version(1)` inchangé, créneaux existants valides et traités comme non marqués. Retour arrière en retirant le champ et le rendu.
