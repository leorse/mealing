# Spec Delta

## MODIFIED Requirements

### Requirement: La quantité initiale se saisit dans la fenêtre

La fenêtre de sélection SHALL comporter un champ de quantité, appliqué à l'ingrédient retenu au moment de la validation. Pour un aliment qui porte une unité, la quantité SHALL pouvoir se saisir en grammes ou en unités, avec l'équivalent en grammes affiché ; sinon elle se saisit en grammes. Le champ SHALL être pré-rempli à 1 unité pour un aliment à unité propre, et à 100 g pour un aliment sans unité ou dont l'unité est la « portion » générique.

#### Scenario: Validation avec la quantité par défaut

- **WHEN** l'utilisateur sélectionne un ingrédient sans unité propre et valide sans toucher au champ de quantité
- **THEN** l'ingrédient est ajouté à la recette avec une quantité de 100 g

#### Scenario: Validation avec une quantité saisie

- **WHEN** l'utilisateur sélectionne un ingrédient, saisit 60 dans le champ de quantité en grammes et valide
- **THEN** l'ingrédient est ajouté à la recette avec une quantité de 60 g

#### Scenario: Aliment à unité propre

- **WHEN** l'utilisateur sélectionne « Saucisse de Toulouse crue », dont l'unité est « saucisse » de 130 g
- **THEN** la quantité est proposée en unités, pré-remplie à 1
- **AND** la fenêtre indique l'équivalent, 130 g

#### Scenario: Saisie en unités

- **WHEN** l'utilisateur saisit 3 en unités pour « Saucisse de Toulouse crue » et valide
- **THEN** l'ingrédient est ajouté à la recette pour 3 saucisses, soit 390 g

#### Scenario: Unité générique

- **WHEN** l'utilisateur sélectionne un aliment dont l'unité est « portion »
- **THEN** la quantité est proposée en grammes, pré-remplie à 100
- **AND** la saisie en portions reste proposée

#### Scenario: Passage d'un mode à l'autre

- **WHEN** l'utilisateur a saisi 3 saucisses, puis passe en grammes
- **THEN** le champ affiche 390
- **AND** l'ingrédient validé ensuite est enregistré en grammes

#### Scenario: Changement d'aliment

- **WHEN** l'utilisateur sélectionne un aliment, puis en sélectionne un autre avant de valider
- **THEN** le mode et la quantité sont ceux par défaut du second aliment

#### Scenario: Demi-unité

- **WHEN** l'utilisateur saisit 0,5 en unités pour un aliment dont l'unité pèse 140 g
- **THEN** l'ingrédient est ajouté pour 70 g

### Requirement: La quantité reste modifiable dans la liste de la recette

Chaque ingrédient ajouté SHALL s'afficher dans la zone « Ingrédients » de l'écran de recette avec son nom, un champ de quantité modifiable sur place, et une action de retrait. Le champ SHALL être en grammes pour un ingrédient saisi en grammes, et en nombre d'unités pour un ingrédient saisi en unités, avec dans ce cas le nom de l'unité et l'équivalent en grammes.

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

#### Scenario: Correction d'un nombre d'unités

- **WHEN** l'utilisateur remplace 3 par 4 sur la ligne « saucisses » d'un ingrédient de 130 g l'unité
- **THEN** la ligne indique 4 saucisses et 520 g
- **AND** le calcul nutritionnel porte sur 520 g

#### Scenario: Mode conservé à la réouverture

- **WHEN** l'utilisateur enregistre un plat contenant 3 saucisses, puis le rouvre pour le modifier
- **THEN** la ligne est toujours en unités, à 3 saucisses

#### Scenario: Plat antérieur

- **WHEN** l'utilisateur modifie un plat enregistré avant l'arrivée des unités
- **THEN** tous ses ingrédients sont en grammes, avec leurs quantités d'origine
