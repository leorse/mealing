# Spec Delta

## MODIFIED Requirements

### Requirement: Une entrée se retire du planning

Chaque entrée d'un créneau SHALL porter une action de suppression accessible depuis la grille, distincte de l'action qui ouvre la modification. Cette action SHALL demander un appui maintenu : la suppression n'a lieu qu'au terme de l'appui, et un relâchement prématuré l'annule.

#### Scenario: Suppression d'une entrée

- **WHEN** l'utilisateur maintient l'action de suppression d'une entrée jusqu'à son terme
- **THEN** cette entrée disparaît du créneau
- **AND** les autres entrées du créneau sont conservées

#### Scenario: Appui relâché trop tôt

- **WHEN** l'utilisateur commence à maintenir l'action de suppression puis relâche avant son terme
- **THEN** l'entrée est conservée

#### Scenario: Appui qui quitte la commande

- **WHEN** l'utilisateur maintient l'action de suppression puis déplace son doigt ou son curseur hors de la commande avant le terme
- **THEN** l'entrée est conservée

#### Scenario: Clic simple sans effet

- **WHEN** l'utilisateur clique brièvement sur l'action de suppression
- **THEN** l'entrée est conservée

#### Scenario: Progression visible pendant l'appui

- **WHEN** l'utilisateur maintient l'action de suppression
- **THEN** la commande montre la progression de l'appui vers la suppression

#### Scenario: Retour à l'état initial après annulation

- **WHEN** un appui est annulé avant son terme
- **THEN** la commande revient à son apparence de départ
- **AND** un nouvel appui repart du début

#### Scenario: Le total du jour suit la suppression

- **WHEN** l'utilisateur supprime une entrée de 300 kcal d'une journée qui en totalisait 1300
- **THEN** le total du jour affiche 1000 kcal

#### Scenario: Suppression de la dernière entrée

- **WHEN** l'utilisateur supprime la seule entrée d'un créneau
- **THEN** le créneau redevient vide et propose l'ajout

#### Scenario: Supprimer n'ouvre pas la modification

- **WHEN** l'utilisateur maintient puis relâche l'action de suppression d'une entrée
- **THEN** la fenêtre de modification ne s'ouvre pas

#### Scenario: Suppression au clavier

- **WHEN** l'utilisateur donne le focus à l'action de suppression et maintient la touche d'activation jusqu'au terme
- **THEN** l'entrée est supprimée

#### Scenario: Touche relâchée trop tôt

- **WHEN** l'utilisateur maintient la touche d'activation puis la relâche avant le terme
- **THEN** l'entrée est conservée
