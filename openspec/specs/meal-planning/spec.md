# meal-planning Specification

## Purpose

Décrit comment l'utilisateur garnit son planning hebdomadaire : ce qu'un créneau de repas peut contenir, comment on y ajoute une recette ou un écart, et d'où viennent les calories affichées.

## Requirements

### Requirement: L'ajout d'un repas se fait dans une fenêtre

Depuis la grille du planning, l'action d'ajout d'un créneau de repas SHALL ouvrir une fenêtre par-dessus la grille. Le parcours NE SHALL PAS passer par un écran séparé ni quitter le planning.

#### Scenario: Ouverture depuis un créneau vide

- **WHEN** l'utilisateur active le bouton d'ajout d'un créneau de repas d'un jour donné
- **THEN** une fenêtre d'ajout s'ouvre par-dessus la grille
- **AND** elle porte sur ce jour et ce type de repas

#### Scenario: La grille reste affichée

- **WHEN** la fenêtre d'ajout est ouverte
- **THEN** la grille de la semaine reste visible derrière
- **AND** aucune navigation n'a eu lieu

### Requirement: La fenêtre propose un mode Recette ou un mode Écart

La fenêtre SHALL proposer deux modes exclusifs, Recette et Écart, et n'appliquer que les champs du mode actif.

#### Scenario: Bascule vers le mode Écart

- **WHEN** l'utilisateur sélectionne le mode Écart alors qu'une recette était choisie
- **THEN** la recette choisie n'est plus prise en compte
- **AND** les champs de l'écart sont proposés à la saisie

#### Scenario: Bascule vers le mode Recette

- **WHEN** l'utilisateur sélectionne le mode Recette
- **THEN** la liste des recettes et plats enregistrés est proposée au choix

### Requirement: Le mode Recette choisit parmi les repas enregistrés

En mode Recette, la fenêtre SHALL permettre de choisir une recette maison ou un plat tout prêt parmi ceux enregistrés, et ce choix SHALL être obligatoire pour valider.

#### Scenario: Recettes et plats proposés ensemble

- **WHEN** l'utilisateur ouvre la fenêtre en mode Recette
- **THEN** les recettes maison et les plats tout prêts enregistrés sont proposés
- **AND** le type de chaque entrée est visible

#### Scenario: Recherche par nom

- **WHEN** l'utilisateur saisit du texte dans le champ de recherche de la fenêtre
- **THEN** la liste se restreint aux repas dont le nom correspond

#### Scenario: Validation impossible sans choix

- **WHEN** le mode Recette est actif et qu'aucune recette n'a été choisie
- **THEN** la validation est indisponible

### Requirement: Les calories se pré-remplissent depuis la recette choisie

En mode Recette, le champ calories SHALL se remplir automatiquement avec les calories par portion de la recette choisie, et SHALL se mettre à jour à chaque changement de choix tant que la fenêtre n'a pas été validée.

#### Scenario: Choix d'une recette

- **WHEN** l'utilisateur choisit une recette dans la liste
- **THEN** le champ calories affiche les calories par portion de cette recette

#### Scenario: Changement de recette avant validation

- **WHEN** l'utilisateur choisit une recette, puis en choisit une autre sans avoir validé
- **THEN** le champ calories affiche les calories de la seconde recette

#### Scenario: Plat tout prêt

- **WHEN** l'utilisateur choisit un plat tout prêt, dont les valeurs nutritionnelles sont saisies par portion
- **THEN** le champ calories affiche les calories par portion enregistrées pour ce plat

### Requirement: Les calories restent modifiables

Le champ calories SHALL rester modifiable par l'utilisateur dans les deux modes, et la valeur retenue à la validation SHALL être celle affichée dans le champ.

#### Scenario: Correction après pré-remplissage

- **WHEN** l'utilisateur choisit une recette puis corrige le champ calories
- **AND** valide la fenêtre
- **THEN** le créneau retient la valeur corrigée, et non celle de la recette

#### Scenario: Saisie en mode Écart

- **WHEN** le mode Écart est actif
- **THEN** le champ calories est vide et se saisit à la main

### Requirement: Un écart porte un nom

En mode Écart, la fenêtre SHALL proposer un champ nom, utilisé pour désigner l'entrée dans la grille.

#### Scenario: Écart nommé

- **WHEN** l'utilisateur saisit « Resto italien » en mode Écart avec des calories, puis valide
- **THEN** la grille affiche « Resto italien » sur ce créneau

### Requirement: La validation est explicite

La fenêtre SHALL proposer une action de validation et une action d'annulation. La validation SHALL rester indisponible tant que les champs requis du mode actif ne sont pas renseignés.

#### Scenario: Annulation

- **WHEN** l'utilisateur annule la fenêtre après avoir choisi une recette
- **THEN** la fenêtre se ferme
- **AND** le planning n'est pas modifié

#### Scenario: Calories manquantes

- **WHEN** le champ calories est vide ou négatif
- **THEN** la validation est indisponible

### Requirement: Un créneau de repas accepte plusieurs entrées

Un créneau de repas d'un jour SHALL pouvoir contenir plusieurs entrées, et le bouton d'ajout SHALL rester disponible une fois la première entrée posée.

#### Scenario: Un plat et un écart sur le même repas

- **WHEN** l'utilisateur ajoute une recette au déjeuner d'un jour, puis ajoute un écart sur ce même déjeuner
- **THEN** les deux entrées apparaissent sur ce créneau

#### Scenario: Le bouton d'ajout persiste

- **WHEN** un créneau de repas contient déjà au moins une entrée
- **THEN** le bouton d'ajout de ce créneau reste disponible

### Requirement: Le total du jour additionne toutes les entrées

Le total calorique affiché pour un jour SHALL être la somme des calories de toutes les entrées de ce jour, tous créneaux et tous modes confondus.

#### Scenario: Plusieurs entrées dans la journée

- **WHEN** un jour comporte un petit-déjeuner à 400 kcal, un déjeuner à 600 kcal et un écart à 300 kcal
- **THEN** le total du jour affiche 1300 kcal

### Requirement: Une entrée se retire du planning

Chaque entrée d'un créneau SHALL porter une action de suppression accessible depuis la grille, distincte de l'action qui ouvre la modification.

#### Scenario: Suppression d'une entrée

- **WHEN** l'utilisateur active l'action de suppression d'une entrée
- **THEN** cette entrée disparaît du créneau
- **AND** les autres entrées du créneau sont conservées

#### Scenario: Le total du jour suit la suppression

- **WHEN** l'utilisateur supprime une entrée de 300 kcal d'une journée qui en totalisait 1300
- **THEN** le total du jour affiche 1000 kcal

#### Scenario: Suppression de la dernière entrée

- **WHEN** l'utilisateur supprime la seule entrée d'un créneau
- **THEN** le créneau redevient vide et propose l'ajout

#### Scenario: Supprimer n'ouvre pas la modification

- **WHEN** l'utilisateur active l'action de suppression d'une entrée
- **THEN** la fenêtre de modification ne s'ouvre pas

### Requirement: Une entrée existante se modifie dans la même fenêtre

Activer une entrée déjà posée SHALL rouvrir la fenêtre en modification, pré-remplie avec les valeurs de cette entrée, et la validation SHALL mettre à jour cette entrée au lieu d'en créer une nouvelle.

#### Scenario: Réouverture d'une entrée

- **WHEN** l'utilisateur active une entrée existante du planning
- **THEN** la fenêtre s'ouvre avec le mode, la recette et les calories de cette entrée

#### Scenario: Correction des calories d'une entrée

- **WHEN** l'utilisateur rouvre une entrée, change ses calories et valide
- **THEN** l'entrée est mise à jour
- **AND** aucune entrée supplémentaire n'est créée sur ce créneau

#### Scenario: Annulation d'une modification

- **WHEN** l'utilisateur rouvre une entrée, modifie des valeurs puis annule
- **THEN** l'entrée reste telle qu'elle était
