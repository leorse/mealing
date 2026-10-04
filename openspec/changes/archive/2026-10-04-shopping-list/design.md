# Design

## Context

Voir `proposal.md` — Why. Exigences dans `specs/shopping-list/spec.md`.

État actuel :

- `MealSlot.includeInShopping` (booléen non indexé) marque une entrée pour les courses ; il est basculé depuis la pastille du planning par `updateSlot`.
- Une entrée porte `recipeId`, `freeLabel`, `slotDate`, `mealType`. Une recette porte `kind` ; ses lignes sont dans `recipeIngredients` (`ingredientId`, `quantityG`).
- Les lectures du planning sont toutes bornées à une semaine (`getWeek` → `listSlotsForWeek`). Rien ne lit les créneaux toutes semaines confondues.
- Les tables `shoppingLists` et `shoppingItems` existent dans le schéma, sans lecteur ni écrivain.
- La page `/shopping` est une coquille. Le CSS fournit déjà `.mode-toggle`, `.card`, `.empty-state`, `.icon-button`, et la pastille `.meal-entry-shop` (grise, verte en `.active`) du planning. `ConfirmModal` existe.
- Le lot précédent prévoyait qu'un retrait depuis la page Courses « regrise la pastille ». C'est repris pour la **suppression**, pas pour la désactivation.

## Goals / Non-Goals

**Goals**

- Une liste toujours juste, sans bouton « générer ».
- Un seul état par article, lu à l'identique par les deux vues.
- Deux gestes nettement séparés : désactiver (réversible sur place) et supprimer (définitif sur la page).
- Aucune migration de base.

**Non-Goals**

- Un état « acheté » distinct de « désactivé ».
- Des articles saisis à la main, un regroupement par rayon, des unités autres que le gramme, un ajustement aux portions.
- L'usage des tables `shoppingLists` / `shoppingItems`.

## Decisions

### La liste est dérivée, pas stockée

La liste est recalculée à partir des créneaux marqués, des recettes et de leurs ingrédients, dans une lecture réactive (`useLiveQuery`).

*Pourquoi* : une liste stockée devrait être resynchronisée à chaque changement du planning ou d'une recette, et pourrait diverger. Dérivée, elle est juste par construction.

*Alternative écartée* : remplir `shoppingItems` par un bouton « Générer ». Elle introduit une liste périmée dès qu'on retouche le planning.

### La liste lit toutes les entrées marquées, sans borne de date

Le repository de planning gagne une lecture « tous les créneaux marqués pour les courses », par filtrage de la table `mealSlots` sur `includeInShopping`.

*Pourquoi sans index* : indexer un booléen demanderait une nouvelle version de schéma, et IndexedDB n'indexe pas les booléens tels quels. Un parcours filtré de la table reste négligeable à l'échelle d'un usage personnel (quelques milliers de créneaux au bout de plusieurs années).

*Conséquence assumée* : un plat marqué et jamais supprimé reste dans la liste indéfiniment. C'est le comportement demandé ; « Tout supprimer » est le moyen de repartir de zéro.

### La construction est une fonction pure dans `services/shopping.ts`

Une fonction reçoit créneaux, recettes, lignes de recette et ingrédients déjà chargés, et renvoie une structure unique : la liste des **occurrences** (une par créneau marqué) avec leurs lignes `{ article, quantité, état }`, articles supprimés exclus. Deux petites fonctions en tirent la vue par plat (directe) et la vue par ingrédient (regroupement par article, somme des quantités actives, provenance).

*Pourquoi* : même découpage que `services/nutrition.ts` — le calcul ne charge rien et se vérifie isolément. Les deux vues partent de la même structure, donc ne peuvent pas se contredire.

Le chargement est fait par un hook `useShoppingList()` qui ne fait que lire.

### La quantité est celle de la recette, sans calcul

Quantité d'une occurrence = `quantityG` de la ligne de recette. Ni `servings` ni `portions` n'interviennent.

*Pourquoi* : décision de l'utilisateur — cocher un plat revient à acheter de quoi faire la recette telle qu'elle est écrite. Deux plats à 100 g de tomates donnent 200 g.

*À savoir* : le planning, lui, compte les calories d'une portion par entrée. Les deux écrans ne mesurent donc pas la même chose ; c'est voulu.

### L'état d'un article est stocké sur le créneau, à trois valeurs

`MealSlot` reçoit un champ optionnel non indexé, par exemple `shoppingItemStates?: Record<string, 'OFF' | 'DELETED'>`, dont la clé est un `ingredientId` — ou le `recipeId` lui-même pour un plat tout prêt. Absent de la table, un article est **actif**.

*Pourquoi sur le créneau* : c'est l'unité la plus fine demandée (désactiver la tomate de *cette* bolognaise). Les niveaux supérieurs s'en déduisent : un ingrédient est désactivé pour toute la liste quand il l'est dans toutes ses occurrences restantes ; un plat est désactivé quand tous ses articles restants le sont.

*Pourquoi une table d'états plutôt que deux listes* : un article ne peut être à la fois désactivé et supprimé ; une seule clé par article l'interdit par construction.

*Pourquoi non indexé* : lu en mémoire avec le créneau, jamais interrogé. `db.version(1).stores(...)` reste inchangé ; l'absence du champ vaut « tout actif ».

*Alternatives écartées* : un état par ingrédient pour toute la liste (ne permet pas d'agir sur une seule provenance, et ne sait pas quoi faire d'un plat ajouté après coup) ; la table `shoppingItems` (un second endroit à tenir cohérent avec les créneaux).

### Supprimer le dernier article d'un plat le démarque

Quand une suppression laisse un créneau sans aucun article non supprimé — ou quand on supprime le plat entier —, le créneau passe à `includeInShopping: false` et sa table d'états est vidée.

*Pourquoi* : un plat sans article n'a plus rien à faire dans la liste, et une pastille restée verte au planning mentirait. Le repas reste planifié.

*Désactiver*, à l'inverse, ne touche jamais à la pastille : le plat doit rester dans la liste, grisé, pour pouvoir être réactivé d'un clic.

### Marquer un plat repart d'un plat complet

Basculer la pastille au planning passe par une fonction dédiée du repository qui écrit `includeInShopping` **et** vide la table d'états, dans les deux sens.

*Pourquoi* : c'est le seul chemin de retour d'un article supprimé — la page Courses n'en offre aucun. Conserver d'anciennes suppressions ferait réapparaître un plat amputé sans explication.

*Conséquence* : `WeekPlanScreen` n'appelle plus `updateSlot` directement pour la pastille.

### « Tout supprimer » démarque toutes les entrées en une transaction

Le bouton, après `ConfirmModal`, passe tous les créneaux marqués à `includeInShopping: false` et vide leurs états, dans une transaction.

*Pourquoi une confirmation ici et pas sur la corbeille d'un article* : le vidage défait d'un coup un travail fait plat par plat et ne se rattrape qu'en remarquant chaque plat. La suppression d'un article est locale et se rattrape en un aller-retour au planning.

*Pourquoi ne pas supprimer les repas* : la liste de courses est une vue sur le planning ; la vider ne doit pas effacer l'historique des repas ni leurs calories.

### Les écritures passent par le repository de planning

- lire tous les créneaux marqués ;
- marquer ou démarquer un créneau (état remis à zéro) ;
- poser un état sur des articles de **plusieurs** créneaux en une transaction — sert aux trois niveaux, et applique la règle du dernier article ;
- vider la liste.

*Pourquoi* : modifier une table d'états est une lecture suivie d'une écriture ; la faire dans le repository, en transaction, évite qu'un double clic écrase un changement. Les écrans n'importent jamais `db`.

### L'état des articles est oublié quand le plat d'une entrée change

Quand `MealPickerModal` enregistre une entrée avec un `recipeId` différent, la table d'états est vidée.

*Pourquoi* : deux recettes peuvent partager un ingrédient ; garder l'ancien état écarterait à tort un ingrédient de la nouvelle. Une clé qui ne correspond plus à rien (ingrédient ôté de la recette) est simplement ignorée à la lecture.

### Rendu : mêmes briques que les écrans existants

- Écran en `.screen` standard (480 px) : titre, bascule `.mode-toggle` « Par ingrédient / Par plat » (état local), liste, puis « Tout supprimer » en bas.
- Une ligne d'article reprend l'ordre d'une entrée du planning : **bouton de courses** à gauche (pastille caddie, verte en `.active`, `aria-pressed`), nom et provenance au centre, quantité, **corbeille rouge** à droite en `.icon-button`. En vue par ingrédient, un bouton chevron déplie le détail. Trois boutons distincts, aucun clic à intercepter.
- La pastille du planning (`.meal-entry-shop`) est petite, taillée pour la grille dense. La liste en utilise une version à cible tactile normale, de même dessin et mêmes couleurs ; les règles communes sont factorisées plutôt que recopiées.
- Vue par plat : un `.card` par occurrence ; l'en-tête porte le nom, la date, le repas et les deux boutons du plat ; les ingrédients dessous sont des lignes d'article.
- État désactivé : classe d'état sur la ligne — opacité réduite et texte barré, sans couleur codée, donc valable en thème clair comme sombre. Les boutons restent à pleine lisibilité pour qu'on voie où cliquer.
- Date affichée en entier (`lun. 5 oct. · Dîner`) via `fromIsoDate` + date-fns, puisque la liste traverse les semaines.
- « Tout supprimer » : bouton de la famille `.button-primary` en variante rouge, corbeille + texte, masqué quand la liste est vide. Ce n'est pas l'action principale de l'écran au sens vert du terme : la variante destructive est nouvelle et rejoint le catalogue.

Les libellés de repas (`MEAL_TYPES`) sont aujourd'hui locaux à `WeekPlanScreen` ; ils sont déplacés dans un module partagé plutôt que recopiés.

## Risks / Trade-offs

- **Suppression d'un article sans confirmation ni annulation sur place** → le retour passe par le planning (pastille éteinte puis rallumée), ce qui remet le plat entier. Assumé ; si l'usage montre des suppressions par erreur fréquentes, une annulation éphémère pourra s'ajouter sans toucher au modèle.
- **Bouton de courses et corbeille sur la même ligne** → placés aux deux extrémités, comme dans le planning, pour qu'on ne confonde pas le geste réversible et le geste définitif.
- **Liste qui grossit sans fin** si rien n'est jamais supprimé → c'est le rôle de « Tout supprimer ».
- **Parcours complet de `mealSlots`** à chaque changement → volume faible ; si la table devenait grosse, un index sur un champ numérique dédié serait la suite, dans une nouvelle version de schéma.
- **Lecture en cascade** (créneaux → recettes → lignes → ingrédients) → charger par lots (`bulkGet`, `anyOf`) plutôt qu'une requête par ingrédient.
- **Désactivation partielle peu lisible** : une ligne à 150 g au lieu de 250 g ne dit pas d'elle-même qu'une provenance est désactivée → la provenance désactivée est barrée dans le résumé de la ligne, pas seulement dans le détail déplié.
- **Grammes entiers pour tout** : 2 œufs s'affichent en grammes → limite connue du modèle (`quantityG` seul), hors périmètre.
- **Tables `shoppingLists` / `shoppingItems` toujours mortes** → laissées en place : les retirer demanderait une nouvelle version de schéma, et les articles manuels pourront s'en servir.
