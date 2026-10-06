# ingredient-portions Specification

## Purpose
Décrit l'unité usuelle d'un aliment et son poids (« 1 saucisse = 130 g ») : d'où ils viennent, comment l'utilisateur les corrige, comment une quantité en unités s'affiche, et ce qu'une correction change aux plats.

## Requirements

### Requirement: Un aliment peut porter une unité et son poids

Un aliment SHALL pouvoir porter une unité, définie par un nom et un poids en grammes. Les aliments de la base Ciqual SHALL être fournis avec une unité estimée. Un aliment sans unité SHALL rester utilisable, en grammes uniquement.

#### Scenario: Aliment Ciqual

- **WHEN** l'utilisateur choisit « Saucisse de Toulouse crue » dans la fenêtre d'ajout d'ingrédient
- **THEN** l'unité « saucisse » de 130 g lui est proposée

#### Scenario: Aliment sans unité

- **WHEN** l'utilisateur choisit un aliment qui n'a pas d'unité
- **THEN** la quantité se saisit en grammes
- **AND** la fenêtre propose de définir une unité pour cet aliment

### Requirement: Les unités estimées arrivent sur une installation existante

Au lancement, l'application SHALL apporter leur unité estimée aux aliments Ciqual déjà enregistrés qui n'en ont pas. Elle NE SHALL PAS remplacer une unité déjà présente sur un aliment, ni modifier un aliment qui ne vient pas de Ciqual.

#### Scenario: Base chargée avant l'arrivée des unités

- **WHEN** l'utilisateur lance la nouvelle version sur une application installée auparavant
- **THEN** les aliments Ciqual proposent leur unité estimée, sans réinstallation

#### Scenario: Unité déjà corrigée

- **WHEN** l'utilisateur a corrigé le poids d'une unité, puis relance l'application
- **THEN** sa correction est conservée

#### Scenario: Aliment personnel

- **WHEN** l'utilisateur a créé un aliment personnel sans unité
- **THEN** le lancement ne lui en attribue aucune

### Requirement: L'unité d'un aliment se corrige depuis la fenêtre d'ajout

Lorsqu'un aliment est sélectionné dans la fenêtre d'ajout d'ingrédient, l'utilisateur SHALL pouvoir modifier le nom et le poids de son unité, ou les définir s'il n'en a pas. La modification SHALL être retenue pour cet aliment et proposée à chaque sélection ultérieure. Un poids nul, négatif ou vide, ou un nom vide, NE SHALL PAS être accepté.

#### Scenario: Correction du poids

- **WHEN** l'utilisateur sélectionne « Saucisse de Toulouse crue », remplace 130 g par 110 g et valide la correction
- **THEN** la fenêtre affiche « 1 saucisse = 110 g »
- **AND** la prochaine sélection de cet aliment propose 110 g

#### Scenario: Définition d'une unité

- **WHEN** l'utilisateur sélectionne un aliment sans unité, saisit « tranche » et 25 g, et valide
- **THEN** la quantité de cet aliment peut se saisir en tranches

#### Scenario: Poids invalide

- **WHEN** l'utilisateur vide le champ du poids ou y saisit 0
- **THEN** la correction ne peut pas être validée
- **AND** l'unité précédente est conservée

### Requirement: Corriger une unité met à jour les plats comptés en unités

Lorsque le poids de l'unité d'un aliment change, chaque plat qui compte cet aliment en unités SHALL conserver son nombre d'unités et prendre le nouveau poids. Un plat qui compte cet aliment en grammes NE SHALL PAS être modifié.

#### Scenario: Plat compté en unités

- **WHEN** un plat contient « 3 saucisses » à 130 g l'unité et que l'utilisateur corrige l'unité à 110 g
- **THEN** ce plat contient toujours « 3 saucisses », pour 330 g
- **AND** ses valeurs nutritionnelles affichées sont celles de 330 g

#### Scenario: Plat compté en grammes

- **WHEN** un plat contient 400 g de saucisse saisis en grammes et que l'utilisateur corrige l'unité à 110 g
- **THEN** ce plat contient toujours 400 g de saucisse

#### Scenario: Changement de nom seul

- **WHEN** l'utilisateur renomme l'unité « pièce » en « galette » sans changer son poids
- **THEN** les plats concernés affichent « galette », pour le même poids

### Requirement: Une quantité en unités s'affiche avec son équivalent en grammes

Une quantité saisie en unités SHALL s'afficher sous la forme du nombre suivi du nom de l'unité, accordé au pluriel à partir de deux, accompagnée de son équivalent en grammes entiers. Un nom d'unité abrégé ou composé de plusieurs mots SHALL rester invariable.

#### Scenario: Pluriel

- **WHEN** un plat contient 3 unités « saucisse » de 130 g
- **THEN** l'ingrédient s'affiche « 3 saucisses (390 g) »

#### Scenario: Singulier

- **WHEN** un plat contient 1 unité « œuf » de 50 g
- **THEN** l'ingrédient s'affiche « 1 œuf (50 g) »

#### Scenario: Unité abrégée

- **WHEN** un plat contient 2 unités « c. à soupe » de 10 g
- **THEN** l'ingrédient s'affiche « 2 c. à soupe (20 g) »

#### Scenario: Demi-unité

- **WHEN** un plat contient 0,5 unité « avocat » de 140 g
- **THEN** l'ingrédient s'affiche « 0,5 avocat (70 g) »

#### Scenario: Pluriel en -x

- **WHEN** un plat contient 2 unités « morceau » de 5 g
- **THEN** l'ingrédient s'affiche « 2 morceaux (10 g) »

### Requirement: Le détail d'un plat montre les quantités comme elles ont été saisies

L'écran de détail d'un plat maison SHALL afficher chaque ingrédient dans le mode où il a été saisi : en unités avec l'équivalent en grammes, ou en grammes seuls.

#### Scenario: Ingrédients mêlés

- **WHEN** un plat contient « 3 saucisses » saisies en unités et 200 g de lentilles saisis en grammes
- **THEN** le détail affiche « 3 saucisses (390 g) » pour les unes et « 200 g » pour les autres

#### Scenario: Plat antérieur

- **WHEN** l'utilisateur ouvre un plat enregistré avant l'arrivée des unités
- **THEN** tous ses ingrédients s'affichent en grammes, comme auparavant
