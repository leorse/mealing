# Spec Delta

## ADDED Requirements

### Requirement: Une entrée de repas enregistré porte une pastille de courses

Toute entrée du planning référençant un repas enregistré — recette maison ou plat tout prêt — SHALL porter une pastille de courses, distincte de l'action qui ouvre la modification et de celle qui supprime l'entrée.

#### Scenario: Entrée portant une recette

- **WHEN** un créneau contient une entrée référençant une recette maison
- **THEN** cette entrée affiche une pastille de courses

#### Scenario: Entrée portant un plat tout prêt

- **WHEN** un créneau contient une entrée référençant un plat tout prêt
- **THEN** cette entrée affiche une pastille de courses

#### Scenario: Entrée d'écart

- **WHEN** un créneau contient une entrée d'écart, qui ne référence aucun repas enregistré
- **THEN** cette entrée n'affiche pas de pastille de courses

### Requirement: La pastille montre si le plat part aux courses

La pastille SHALL présenter deux états visuellement distincts : un état grisé lorsque le plat ne doit pas alimenter la liste de courses, et un état vert lorsqu'il le doit.

#### Scenario: Plat exclu des courses

- **WHEN** une entrée n'est pas marquée pour les courses
- **THEN** sa pastille est grisée

#### Scenario: Plat retenu pour les courses

- **WHEN** une entrée est marquée pour les courses
- **THEN** sa pastille est verte

### Requirement: Le marquage est désactivé par défaut

Une entrée SHALL être non marquée à sa création, et une entrée enregistrée avant l'existence de ce marquage SHALL être traitée comme non marquée. Aucun repas NE SHALL alimenter la liste de courses sans une action explicite de l'utilisateur.

#### Scenario: Repas fraîchement ajouté

- **WHEN** l'utilisateur ajoute un repas au planning
- **THEN** sa pastille de courses est grisée

#### Scenario: Repas planifié de longue date

- **WHEN** l'utilisateur consulte un repas planifié avant l'arrivée de cette fonctionnalité
- **THEN** sa pastille de courses est grisée

#### Scenario: Semaine entière non marquée

- **WHEN** l'utilisateur planifie une semaine complète sans toucher aux pastilles
- **THEN** aucun de ces repas n'est destiné à la liste de courses

### Requirement: La pastille bascule au clic et son état est conservé

Activer la pastille SHALL inverser l'état de marquage de l'entrée, et cet état SHALL être enregistré de façon à survivre au rechargement de l'application.

#### Scenario: Marquage d'un plat

- **WHEN** l'utilisateur active la pastille grisée d'une entrée
- **THEN** la pastille devient verte

#### Scenario: Retrait du marquage

- **WHEN** l'utilisateur active la pastille verte d'une entrée
- **THEN** la pastille redevient grisée

#### Scenario: Persistance

- **WHEN** l'utilisateur marque un plat puis recharge l'application
- **THEN** la pastille de ce plat est toujours verte

#### Scenario: Le marquage n'ouvre rien

- **WHEN** l'utilisateur active la pastille d'une entrée
- **THEN** la fenêtre de modification ne s'ouvre pas
- **AND** l'entrée n'est pas supprimée

### Requirement: Le marquage est propre à chaque entrée

Le marquage SHALL porter sur une seule entrée, sans effet sur les autres entrées du même créneau, du même jour, ni sur les autres occurrences du même repas dans la semaine.

#### Scenario: Deux entrées sur le même créneau

- **WHEN** un créneau contient deux entrées et que l'utilisateur en marque une
- **THEN** l'autre entrée reste non marquée

#### Scenario: Même recette planifiée deux fois

- **WHEN** la même recette est planifiée lundi et jeudi, et que l'utilisateur marque celle de lundi
- **THEN** celle de jeudi reste non marquée
