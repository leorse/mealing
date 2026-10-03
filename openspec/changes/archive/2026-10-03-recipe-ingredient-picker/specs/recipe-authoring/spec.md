# Spec Delta

## Purpose

Décrit comment l'utilisateur compose une recette : comment il y ajoute des ingrédients, en fixe les quantités et les retire.

## ADDED Requirements

### Requirement: L'ajout d'un ingrédient passe par une fenêtre de sélection

L'écran de saisie d'une recette SHALL proposer un bouton d'ajout d'ingrédient qui ouvre une fenêtre de sélection dédiée. L'écran de recette NE SHALL PAS comporter de champ de recherche d'ingrédient ni de liste de suggestions dans le flux du formulaire.

#### Scenario: Ouverture de la fenêtre

- **WHEN** l'utilisateur active le bouton d'ajout de la zone « Ingrédients »
- **THEN** une fenêtre de sélection s'ouvre par-dessus l'écran de recette

#### Scenario: L'écran de recette ne bouge plus pendant la recherche

- **WHEN** l'utilisateur saisit une recherche dans la fenêtre de sélection
- **THEN** la mise en page de l'écran de recette situé derrière reste inchangée

### Requirement: La fenêtre de sélection recherche parmi les ingrédients enregistrés

La fenêtre de sélection SHALL comporter un champ de recherche et afficher les ingrédients correspondants dans une liste à défilement propre, dont la hauteur ne dépend pas du nombre de résultats.

#### Scenario: Recherche avec résultats

- **WHEN** l'utilisateur saisit au moins deux caractères dans le champ de recherche
- **THEN** la liste affiche les ingrédients dont le nom ou la marque contient le texte saisi

#### Scenario: Nombreux résultats

- **WHEN** la recherche renvoie plus de résultats que la liste n'en peut afficher
- **THEN** la liste défile à l'intérieur de la fenêtre
- **AND** le champ de recherche et les boutons de validation restent visibles

#### Scenario: Aucun résultat

- **WHEN** la recherche ne renvoie aucun ingrédient
- **THEN** la fenêtre indique qu'aucun ingrédient ne correspond

### Requirement: La quantité initiale se saisit dans la fenêtre

La fenêtre de sélection SHALL comporter un champ de quantité en grammes, pré-rempli à 100 g, appliqué à l'ingrédient retenu au moment de la validation.

#### Scenario: Validation avec la quantité par défaut

- **WHEN** l'utilisateur sélectionne un ingrédient et valide sans toucher au champ de quantité
- **THEN** l'ingrédient est ajouté à la recette avec une quantité de 100 g

#### Scenario: Validation avec une quantité saisie

- **WHEN** l'utilisateur sélectionne un ingrédient, saisit 60 dans le champ de quantité et valide
- **THEN** l'ingrédient est ajouté à la recette avec une quantité de 60 g

### Requirement: La validation est explicite et conditionnée

La fenêtre de sélection SHALL proposer une action de validation et une action d'annulation. L'action de validation SHALL rester indisponible tant qu'aucun ingrédient n'est sélectionné ou que la quantité saisie n'est pas strictement positive.

#### Scenario: Validation indisponible sans sélection

- **WHEN** la fenêtre est ouverte et qu'aucun ingrédient n'a été sélectionné
- **THEN** l'action de validation est indisponible

#### Scenario: Validation indisponible avec une quantité nulle

- **WHEN** l'utilisateur a sélectionné un ingrédient et saisi une quantité de 0 ou vide
- **THEN** l'action de validation est indisponible

#### Scenario: Annulation

- **WHEN** l'utilisateur annule la fenêtre après avoir sélectionné un ingrédient
- **THEN** la fenêtre se ferme
- **AND** aucun ingrédient n'est ajouté à la recette

#### Scenario: Un ingrédient par validation

- **WHEN** l'utilisateur valide la fenêtre
- **THEN** un seul ingrédient est ajouté
- **AND** la fenêtre se ferme

### Requirement: Un ingrédient déjà présent est signalé

La fenêtre de sélection SHALL indiquer qu'un ingrédient figure déjà dans la recette et empêcher de le sélectionner à nouveau, plutôt que d'ignorer l'action sans explication.

#### Scenario: Ingrédient déjà ajouté

- **WHEN** la liste de résultats contient un ingrédient déjà présent dans la recette
- **THEN** cet ingrédient est présenté comme déjà ajouté
- **AND** il ne peut pas être sélectionné

### Requirement: La quantité reste modifiable dans la liste de la recette

Chaque ingrédient ajouté SHALL s'afficher dans la zone « Ingrédients » de l'écran de recette avec son nom, un champ de quantité en grammes modifiable sur place, et une action de retrait.

#### Scenario: Correction d'une quantité

- **WHEN** l'utilisateur modifie la valeur du champ de quantité d'un ingrédient déjà ajouté
- **THEN** la nouvelle quantité est retenue pour cet ingrédient
- **AND** aucune fenêtre ne s'ouvre

#### Scenario: Retrait d'un ingrédient

- **WHEN** l'utilisateur active l'action de retrait d'une ligne d'ingrédient
- **THEN** cet ingrédient disparaît de la recette
- **AND** les autres ingrédients et leurs quantités sont conservés

#### Scenario: Recette sans ingrédient

- **WHEN** la recette ne comporte aucun ingrédient
- **THEN** la zone « Ingrédients » indique qu'aucun ingrédient n'a été ajouté

### Requirement: Les quantités alimentent le calcul nutritionnel

Les quantités saisies, à l'ajout comme à la correction, SHALL être celles utilisées pour le calcul nutritionnel de la recette à l'enregistrement.

#### Scenario: Enregistrement après correction

- **WHEN** l'utilisateur ajoute un ingrédient à 100 g, corrige la quantité à 60 g dans la liste, puis enregistre la recette
- **THEN** les valeurs nutritionnelles de la recette sont calculées sur la base de 60 g pour cet ingrédient

### Requirement: Le parcours est identique en création et en modification

Le mode d'ajout, de quantification et de retrait des ingrédients SHALL être le même à la création d'une recette et à la modification d'une recette existante.

#### Scenario: Modification d'une recette existante

- **WHEN** l'utilisateur ouvre une recette existante en modification
- **THEN** ses ingrédients sont listés avec leur quantité modifiable et leur action de retrait
- **AND** le bouton d'ajout ouvre la même fenêtre de sélection qu'à la création
