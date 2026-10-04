# shopping-list Specification

## Purpose

Permet de savoir quoi acheter : la liste est déduite des plats marqués au planning, dit de quel plat vient chaque ingrédient, et laisse écarter ou supprimer ce qui n'est pas à acheter.

## Requirements

### Requirement: La liste se construit à partir de tous les plats marqués

La liste de courses SHALL contenir ce que demandent toutes les entrées du planning dont la pastille de courses est active, quelle que soit leur date. Elle NE SHALL PAS être limitée à une semaine. Une entrée non marquée, une entrée d'écart ou une entrée dont le plat n'existe plus NE SHALL rien apporter à la liste.

#### Scenario: Plat marqué

- **WHEN** une recette maison est planifiée et que sa pastille de courses est active
- **THEN** les ingrédients de cette recette figurent dans la liste de courses

#### Scenario: Plat non marqué

- **WHEN** une recette est planifiée et que sa pastille de courses est grisée
- **THEN** aucun de ses ingrédients ne figure dans la liste

#### Scenario: Plat marqué il y a un mois

- **WHEN** une recette a été marquée sur un repas daté d'il y a un mois et n'a pas été supprimée de la liste depuis
- **THEN** ses ingrédients figurent toujours dans la liste

#### Scenario: Plats de semaines différentes

- **WHEN** un plat de cette semaine et un plat de la semaine suivante sont tous deux marqués
- **THEN** la liste contient les ingrédients des deux plats

#### Scenario: Plat supprimé depuis

- **WHEN** une entrée marquée référence une recette qui a été supprimée
- **THEN** cette entrée n'apporte rien à la liste
- **AND** la liste s'affiche sans erreur

#### Scenario: Aucun plat marqué

- **WHEN** aucune entrée du planning n'est marquée pour les courses
- **THEN** la page indique que la liste est vide et que les plats se choisissent depuis le planning

### Requirement: La liste suit le planning sans action de l'utilisateur

La liste SHALL refléter l'état courant du planning et des recettes : marquer, démarquer, ajouter, supprimer une entrée, ou modifier les ingrédients d'une recette SHALL se retrouver dans la liste sans régénération manuelle.

#### Scenario: Pastille activée après coup

- **WHEN** l'utilisateur active la pastille d'un plat au planning, puis ouvre la page Courses
- **THEN** les ingrédients de ce plat figurent dans la liste

#### Scenario: Entrée supprimée du planning

- **WHEN** l'utilisateur supprime du planning une entrée marquée
- **THEN** ce que cette entrée apportait disparaît de la liste

#### Scenario: Recette modifiée

- **WHEN** l'utilisateur change la quantité d'un ingrédient dans une recette marquée au planning
- **THEN** la liste affiche la quantité mise à jour

### Requirement: La quantité d'un ingrédient est celle de la recette

Pour chaque entrée marquée, la quantité demandée d'un ingrédient SHALL être la quantité inscrite dans la recette, sans ajustement au nombre de portions. Les quantités SHALL être affichées en grammes entiers.

#### Scenario: Un plat

- **WHEN** une recette contenant 100 g de tomates est marquée à un repas
- **THEN** la liste demande 100 g de tomates

#### Scenario: Recette pour plusieurs portions

- **WHEN** une recette prévue pour 4 portions contient 400 g de tomates et qu'elle est marquée à un repas
- **THEN** la liste demande 400 g de tomates

### Requirement: Deux vues de la même liste

La page SHALL proposer deux vues, « Par ingrédient » et « Par plat », entre lesquelles l'utilisateur bascule d'un geste. Les deux vues SHALL présenter les mêmes articles dans le même état. La vue « Par ingrédient » SHALL être affichée par défaut.

#### Scenario: Bascule

- **WHEN** l'utilisateur choisit « Par plat »
- **THEN** la liste se présente par plat, sans rechargement de la page

#### Scenario: Vue par défaut

- **WHEN** l'utilisateur ouvre la page Courses
- **THEN** la vue « Par ingrédient » est affichée

#### Scenario: État commun

- **WHEN** l'utilisateur désactive ou supprime un article dans une vue, puis bascule sur l'autre
- **THEN** cet article y apparaît dans le même état

### Requirement: La vue par ingrédient additionne les quantités

Dans la vue « Par ingrédient », un même ingrédient SHALL occuper une seule ligne, quel que soit le nombre de plats qui le demandent, avec pour quantité la somme des quantités actives. Les lignes SHALL être classées par ordre alphabétique.

#### Scenario: Ingrédient commun à deux plats

- **WHEN** deux plats marqués contiennent chacun 100 g de tomates
- **THEN** la liste affiche une seule ligne « Tomate » de 200 g

#### Scenario: Même plat planifié deux fois

- **WHEN** la même recette, qui contient 150 g de tomates, est marquée à deux repas
- **THEN** la liste affiche une seule ligne « Tomate » de 300 g

### Requirement: Chaque ingrédient indique sa provenance

Dans la vue « Par ingrédient », chaque ligne SHALL nommer les plats qui la demandent. Un plat présent plusieurs fois SHALL être nommé une seule fois, suivi du nombre d'occurrences.

#### Scenario: Deux plats différents

- **WHEN** la tomate est demandée par « Bolognaise » et par « Salade niçoise »
- **THEN** la ligne « Tomate » mentionne « Bolognaise » et « Salade niçoise »

#### Scenario: Plat répété

- **WHEN** « Bolognaise » est marquée à deux repas
- **THEN** la ligne de chacun de ses ingrédients mentionne « Bolognaise ×2 »

### Requirement: Le détail d'un ingrédient montre chaque occurrence

Une ligne de la vue « Par ingrédient » SHALL pouvoir être dépliée pour montrer, occurrence par occurrence, le plat, la date, le repas et la quantité demandée. Déplier ou replier une ligne NE SHALL PAS modifier l'état de l'article.

#### Scenario: Détail déplié

- **WHEN** l'utilisateur déplie la ligne « Tomate », demandée par « Bolognaise » le lundi 5 octobre au dîner et le jeudi 8 octobre au déjeuner
- **THEN** deux lignes de détail apparaissent, chacune avec le plat, la date, le repas et sa quantité

#### Scenario: Déplier ne change rien

- **WHEN** l'utilisateur déplie puis replie une ligne
- **THEN** l'article reste dans l'état où il était

### Requirement: La vue par plat présente chaque occurrence séparément

Dans la vue « Par plat », chaque entrée marquée SHALL former un bloc distinct, identifié par le nom du plat, la date et le repas, et listant ses ingrédients avec leur quantité. Les blocs SHALL être classés par date puis par repas.

#### Scenario: Plat planifié une fois

- **WHEN** « Salade niçoise » est marquée le mardi 6 octobre au déjeuner
- **THEN** un bloc « Salade niçoise » indiquant cette date et le déjeuner liste ses ingrédients et leurs quantités

#### Scenario: Même plat planifié deux fois

- **WHEN** « Bolognaise » est marquée le lundi au dîner et le jeudi au déjeuner
- **THEN** deux blocs « Bolognaise » distincts apparaissent, un par occurrence

### Requirement: Un plat tout prêt est lui-même l'article à acheter

Un plat tout prêt marqué SHALL figurer dans la liste comme un article unique portant son nom, sans ingrédients. Dans la vue « Par ingrédient », les plats tout prêts SHALL être regroupés à part des ingrédients, avec le nombre d'occurrences actives.

#### Scenario: Plat tout prêt en vue par ingrédient

- **WHEN** « Lasagnes surgelées », plat tout prêt, est marqué à deux repas
- **THEN** la liste affiche, à part des ingrédients, une ligne « Lasagnes surgelées » avec la quantité ×2

#### Scenario: Plat tout prêt en vue par plat

- **WHEN** un plat tout prêt est marqué à un repas
- **THEN** un bloc à son nom apparaît, sans liste d'ingrédients

### Requirement: Chaque article porte un bouton de courses actif par défaut

Chaque article de la liste SHALL porter un bouton de courses à deux états, de même apparence que la pastille de courses du planning. Un article apporté par un plat marqué SHALL être actif, bouton vert, sans autre action de l'utilisateur.

#### Scenario: Article nouvellement apporté

- **WHEN** l'utilisateur marque un plat au planning, puis ouvre la page Courses
- **THEN** chaque ingrédient de ce plat porte un bouton de courses vert

#### Scenario: État annoncé

- **WHEN** un lecteur d'écran parcourt le bouton de courses d'un article
- **THEN** il annonce si l'article est actif ou désactivé

### Requirement: Le bouton de courses désactive et réactive un article

Un clic sur le bouton de courses d'un article actif SHALL le désactiver : l'article reste affiché à sa place, grisé, son bouton passe au gris, et il ne compte plus dans les quantités. Un clic sur le bouton d'un article désactivé SHALL le réactiver. Aucune confirmation NE SHALL être demandée.

#### Scenario: Désactivation

- **WHEN** l'utilisateur clique sur le bouton de courses vert d'un article
- **THEN** l'article reste visible, grisé, et son bouton de courses est gris
- **AND** aucune fenêtre de confirmation ne s'ouvre

#### Scenario: Réactivation après une erreur

- **WHEN** l'utilisateur clique sur le bouton de courses d'un article désactivé par erreur
- **THEN** l'article retrouve son aspect normal, son bouton redevient vert, et il compte à nouveau

### Requirement: Chaque article porte un bouton de suppression

Chaque article SHALL porter un bouton de suppression rouge, distinct du bouton de courses. Un clic SHALL retirer l'article de la liste : il n'y est plus affiché, ni actif ni grisé, et la page Courses n'offre aucun moyen de le faire revenir.

#### Scenario: Suppression d'un article

- **WHEN** l'utilisateur clique sur le bouton de suppression d'un article
- **THEN** l'article disparaît de la liste

#### Scenario: Suppression d'un article désactivé

- **WHEN** l'utilisateur clique sur le bouton de suppression d'un article grisé
- **THEN** l'article disparaît de la liste

#### Scenario: Les deux boutons sont indépendants

- **WHEN** l'utilisateur clique sur le bouton de courses d'un article
- **THEN** l'article n'est pas supprimé

### Requirement: Désactiver et supprimer se font à trois niveaux

L'utilisateur SHALL pouvoir désactiver, réactiver ou supprimer : un ingrédient pour une seule occurrence de plat, un ingrédient pour toute la liste, ou une occurrence de plat entière. Agir sur un ingrédient pour toute la liste équivaut à agir sur chacune de ses occurrences ; agir sur un plat équivaut à agir sur chacun de ses ingrédients.

#### Scenario: Désactiver une seule provenance

- **WHEN** la tomate est demandée par « Bolognaise » (150 g) et « Salade niçoise » (100 g), et que l'utilisateur désactive la provenance « Salade niçoise » dans le détail déplié
- **THEN** la ligne « Tomate » affiche 150 g et reste active
- **AND** la provenance « Salade niçoise » apparaît grisée

#### Scenario: Désactiver un ingrédient entier

- **WHEN** l'utilisateur désactive la ligne « Tomate » de la vue par ingrédient
- **THEN** la ligne est grisée
- **AND** la tomate apparaît grisée dans chaque bloc de la vue par plat

#### Scenario: Ingrédient dont toutes les provenances sont désactivées

- **WHEN** l'utilisateur désactive une à une toutes les provenances d'un ingrédient
- **THEN** la ligne de cet ingrédient apparaît grisée, bouton de courses gris

#### Scenario: Réactiver un ingrédient entier

- **WHEN** l'utilisateur clique sur le bouton de courses d'une ligne d'ingrédient grisée
- **THEN** toutes ses provenances restantes sont réactivées et la quantité totale est rétablie

#### Scenario: Désactiver un plat entier

- **WHEN** l'utilisateur désactive un bloc de la vue par plat
- **THEN** le bloc et tous ses ingrédients sont grisés
- **AND** les lignes de la vue par ingrédient ne comptent plus les quantités de ce plat

#### Scenario: Supprimer une seule provenance

- **WHEN** la tomate est demandée par deux plats et que l'utilisateur supprime l'une des deux provenances dans le détail déplié
- **THEN** la ligne « Tomate » reste, avec la seule quantité de l'autre plat
- **AND** la provenance supprimée n'apparaît plus

#### Scenario: Supprimer un ingrédient entier

- **WHEN** l'utilisateur supprime la ligne « Tomate » de la vue par ingrédient
- **THEN** la ligne disparaît
- **AND** la tomate n'apparaît plus dans aucun bloc de la vue par plat

### Requirement: Désactiver un article ne touche pas au planning

Désactiver ou réactiver un article ou un plat depuis la page Courses NE SHALL PAS modifier la pastille de courses du planning.

#### Scenario: Plat entier désactivé

- **WHEN** l'utilisateur désactive un plat entier depuis la page Courses, puis ouvre le planning
- **THEN** la pastille de courses de cette entrée est toujours active
- **AND** le plat figure toujours, grisé, dans la liste de courses

### Requirement: Supprimer un plat le démarque au planning

Supprimer un plat entier de la liste, ou supprimer son dernier article restant, SHALL désactiver la pastille de courses de l'entrée correspondante au planning. L'entrée du planning elle-même NE SHALL PAS être supprimée ni modifiée autrement.

#### Scenario: Plat supprimé depuis la vue par plat

- **WHEN** l'utilisateur supprime un bloc de la vue par plat, puis ouvre le planning
- **THEN** le repas est toujours planifié
- **AND** sa pastille de courses est grisée

#### Scenario: Dernier ingrédient supprimé

- **WHEN** l'utilisateur supprime un à un tous les ingrédients d'un plat
- **THEN** le bloc de ce plat disparaît de la liste
- **AND** la pastille de courses de l'entrée est grisée au planning

### Requirement: Marquer un plat au planning l'apporte complet

Activer la pastille de courses d'une entrée du planning SHALL apporter à la liste tous les articles du plat, actifs, sans tenir compte des désactivations ou suppressions faites auparavant sur cette entrée.

#### Scenario: Plat remis après suppression

- **WHEN** l'utilisateur supprime un plat de la liste, puis réactive sa pastille au planning
- **THEN** tous les ingrédients du plat figurent à nouveau dans la liste, boutons de courses verts

#### Scenario: Ingrédient supprimé par erreur

- **WHEN** l'utilisateur a supprimé un ingrédient d'un plat, puis désactive et réactive la pastille de ce plat au planning
- **THEN** cet ingrédient figure à nouveau dans la liste

### Requirement: Un bouton général vide la liste

La page SHALL proposer un bouton « Tout supprimer » qui, après confirmation, retire tous les articles de la liste et désactive la pastille de courses de toutes les entrées concernées. Aucune entrée du planning NE SHALL être supprimée. Le bouton NE SHALL PAS être proposé lorsque la liste est vide.

#### Scenario: Vidage confirmé

- **WHEN** l'utilisateur clique sur « Tout supprimer » et confirme
- **THEN** la liste est vide et la page affiche l'état de liste vide
- **AND** au planning, les repas sont toujours présents, pastilles de courses grisées

#### Scenario: Vidage annulé

- **WHEN** l'utilisateur clique sur « Tout supprimer » puis refuse la confirmation
- **THEN** la liste est inchangée

#### Scenario: Articles désactivés inclus

- **WHEN** la liste contient des articles actifs et des articles désactivés, et que l'utilisateur confirme « Tout supprimer »
- **THEN** les uns comme les autres disparaissent

#### Scenario: Repartir d'une liste vide

- **WHEN** l'utilisateur a vidé la liste, puis marque un plat au planning
- **THEN** la liste ne contient que les articles de ce plat

#### Scenario: Liste vide

- **WHEN** la liste ne contient aucun article
- **THEN** le bouton « Tout supprimer » n'est pas affiché

### Requirement: L'état des articles est conservé

Les désactivations et suppressions SHALL être enregistrées et retrouvées après rechargement de l'application. Elles SHALL rester attachées à l'occurrence de plat concernée lorsque d'autres entrées du planning changent. Lorsque le plat d'une entrée est remplacé par un autre, l'état des articles de cette entrée SHALL être oublié.

#### Scenario: Rechargement

- **WHEN** l'utilisateur désactive un article et en supprime un autre, puis recharge l'application
- **THEN** le premier est toujours grisé et le second toujours absent

#### Scenario: Ajout d'un autre plat

- **WHEN** l'utilisateur a désactivé la tomate de « Bolognaise », puis marque un nouveau plat qui contient aussi de la tomate
- **THEN** la tomate de « Bolognaise » reste désactivée
- **AND** la tomate du nouveau plat est active

#### Scenario: Plat remplacé

- **WHEN** l'utilisateur modifie une entrée marquée du planning pour y mettre une autre recette
- **THEN** tous les ingrédients de la nouvelle recette sont actifs dans la liste
