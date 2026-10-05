# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: La fenêtre propose un mode Recette ou un mode Écart`
- TO: `### Requirement: La fenêtre propose un mode Plat ou un mode Écart`

- FROM: `### Requirement: Le mode Recette choisit parmi les repas enregistrés`
- TO: `### Requirement: Le mode Plat choisit parmi les repas enregistrés`

## MODIFIED Requirements

### Requirement: La fenêtre propose un mode Plat ou un mode Écart

La fenêtre SHALL proposer deux modes exclusifs, Plat et Écart, et n'appliquer que les champs du mode actif.

#### Scenario: Bascule vers le mode Écart

- **WHEN** l'utilisateur sélectionne le mode Écart alors qu'un plat était choisi
- **THEN** le plat choisi n'est plus pris en compte
- **AND** les champs de l'écart sont proposés à la saisie

#### Scenario: Bascule vers le mode Recette

- **WHEN** l'utilisateur sélectionne le mode Plat
- **THEN** la liste des plats maison et tout prêts enregistrés est proposée au choix

### Requirement: Le mode Plat choisit parmi les repas enregistrés

En mode Plat, la fenêtre SHALL permettre de choisir un plat maison ou un plat tout prêt parmi ceux enregistrés, et ce choix SHALL être obligatoire pour valider. Les plats favoris SHALL être proposés en premier, par ordre alphabétique, suivis des autres plats, par ordre alphabétique. Chaque plat proposé SHALL porter un cœur qui bascule son favori sans le choisir.

#### Scenario: Recettes et plats proposés ensemble

- **WHEN** l'utilisateur ouvre la fenêtre en mode Plat
- **THEN** les plats maison et les plats tout prêts enregistrés sont proposés
- **AND** le type de chaque entrée est visible

#### Scenario: Favoris en tête

- **WHEN** « Tajine » et « Bolognaise » sont favoris, et « Andouillette » et « Ratatouille » ne le sont pas
- **THEN** la fenêtre propose dans l'ordre « Bolognaise », « Tajine », « Andouillette », « Ratatouille »

#### Scenario: Cœur sur chaque plat proposé

- **WHEN** la fenêtre propose des plats
- **THEN** chaque plat porte un cœur, rempli en rouge s'il est favori et vide sinon

#### Scenario: Marquer un favori depuis la fenêtre

- **WHEN** l'utilisateur clique sur le cœur vide d'un plat proposé
- **THEN** le cœur se remplit en rouge et le plat devient favori, y compris dans la liste des plats
- **AND** le plat n'est pas choisi pour autant

#### Scenario: L'ordre ne bouge pas pendant le choix

- **WHEN** l'utilisateur marque ou démarque un plat dans la fenêtre ouverte
- **THEN** le plat garde sa place dans la liste proposée
- **AND** le nouvel ordre s'applique à la prochaine ouverture de la fenêtre

#### Scenario: Aucun favori

- **WHEN** aucun plat n'est favori
- **THEN** la fenêtre propose tous les plats par ordre alphabétique

#### Scenario: Recherche par nom

- **WHEN** l'utilisateur saisit du texte dans le champ de recherche de la fenêtre
- **THEN** la liste se restreint aux repas dont le nom correspond
- **AND** les favoris correspondants restent proposés en premier

#### Scenario: Validation impossible sans choix

- **WHEN** le mode Plat est actif et qu'aucun plat n'a été choisi
- **THEN** la validation est indisponible
