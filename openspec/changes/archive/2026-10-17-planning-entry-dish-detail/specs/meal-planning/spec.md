# Spec Delta

## MODIFIED Requirements

### Requirement: Une entrée existante se modifie dans la même fenêtre

Activer une entrée déjà posée qui référence un plat SHALL ouvrir une fenêtre à deux onglets, « Plat » et « Remplacer ». L'onglet « Plat » SHALL être affiché à l'ouverture ; l'onglet « Remplacer » SHALL contenir la fenêtre de choix pré-remplie avec les valeurs de l'entrée, dont la validation met à jour cette entrée au lieu d'en créer une nouvelle. Activer une entrée d'écart SHALL ouvrir directement cette fenêtre de choix, sans onglets.

#### Scenario: Réouverture d'une entrée

- **WHEN** l'utilisateur active une entrée de plat existante du planning
- **THEN** la fenêtre s'ouvre sur l'onglet « Plat »
- **AND** l'onglet « Remplacer » est accessible d'un appui

#### Scenario: Onglet Remplacer

- **WHEN** l'utilisateur passe à l'onglet « Remplacer »
- **THEN** la fenêtre de choix s'affiche avec la recette et les calories de cette entrée

#### Scenario: Remplacement d'un plat

- **WHEN** l'utilisateur choisit un autre plat dans l'onglet « Remplacer » et valide
- **THEN** l'entrée est mise à jour
- **AND** aucune entrée supplémentaire n'est créée sur ce créneau

#### Scenario: Correction des calories d'une entrée

- **WHEN** l'utilisateur rouvre une entrée, change ses calories dans l'onglet « Remplacer » et valide
- **THEN** l'entrée est mise à jour
- **AND** aucune entrée supplémentaire n'est créée sur ce créneau

#### Scenario: Annulation d'une modification

- **WHEN** l'utilisateur rouvre une entrée, modifie des valeurs puis annule
- **THEN** l'entrée reste telle qu'elle était

#### Scenario: Entrée d'écart

- **WHEN** l'utilisateur active une entrée d'écart
- **THEN** la fenêtre de modification s'ouvre directement, sans onglet « Plat »

## ADDED Requirements

### Requirement: L'onglet Plat montre la fiche complète du plat

L'onglet « Plat » SHALL afficher le plat de l'entrée avec le même contenu et la même présentation que la fiche d'un plat dans l'écran Plats : nom en entier, description, origine IA le cas échéant, badges, ingrédients avec leurs quantités et valeurs nutritionnelles. Le nom SHALL y être lisible en entier, sans troncature. Cet onglet SHALL être en lecture seule : il ne modifie ni ne supprime le plat.

#### Scenario: Nom long

- **WHEN** le nom d'un plat est tronqué dans le planning et que l'utilisateur active son entrée
- **THEN** l'onglet « Plat » affiche ce nom en entier

#### Scenario: Plat maison

- **WHEN** l'utilisateur active une entrée de plat maison
- **THEN** l'onglet liste ses ingrédients et affiche ses valeurs nutritionnelles, comme la fiche de l'écran Plats

#### Scenario: Plat tout prêt

- **WHEN** l'utilisateur active une entrée de plat tout prêt
- **THEN** l'onglet affiche ses valeurs nutritionnelles par portion, sans liste d'ingrédients, comme la fiche de l'écran Plats

#### Scenario: Plat supprimé depuis

- **WHEN** le plat référencé par l'entrée n'existe plus
- **THEN** l'onglet « Plat » indique que le plat est introuvable
- **AND** l'onglet « Remplacer » reste utilisable

#### Scenario: Aucune modification

- **WHEN** l'utilisateur consulte l'onglet « Plat »
- **THEN** le plat et l'entrée du planning restent inchangés
