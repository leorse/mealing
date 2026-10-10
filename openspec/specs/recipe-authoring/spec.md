# recipe-authoring Specification

## Purpose

Décrit comment l'utilisateur compose une recette : comment il y ajoute des ingrédients, en fixe les quantités et les retire.

## Requirements

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

### Requirement: La validation est explicite et conditionnée

La fenêtre de sélection SHALL proposer une action de validation et une action d'annulation. En mode « Rechercher », l'action de validation SHALL rester indisponible tant qu'aucun ingrédient n'est sélectionné ou que la quantité saisie n'est pas strictement positive. En mode « Saisie libre », elle SHALL rester indisponible tant que le nom est vide, que la quantité saisie n'est pas strictement positive ou qu'une valeur nutritionnelle est négative.

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

#### Scenario: Saisie libre sans nom

- **WHEN** l'utilisateur est en saisie libre et que le nom est vide ou ne contient que des espaces
- **THEN** l'action de validation est indisponible

#### Scenario: Saisie libre avec une quantité nulle

- **WHEN** l'utilisateur est en saisie libre, a saisi un nom et une quantité de 0 ou vide
- **THEN** l'action de validation est indisponible

#### Scenario: Saisie libre avec une valeur négative

- **WHEN** l'utilisateur est en saisie libre et saisit une valeur nutritionnelle négative
- **THEN** l'action de validation est indisponible

#### Scenario: Annulation d'une saisie libre

- **WHEN** l'utilisateur annule la fenêtre après avoir rempli le nom et la quantité en saisie libre
- **THEN** la fenêtre se ferme
- **AND** aucun ingrédient n'est ajouté à la recette ni enregistré comme aliment

### Requirement: Un ingrédient déjà présent est signalé

La fenêtre de sélection SHALL indiquer qu'un ingrédient figure déjà dans la recette et empêcher de le sélectionner à nouveau, plutôt que d'ignorer l'action sans explication.

#### Scenario: Ingrédient déjà ajouté

- **WHEN** la liste de résultats contient un ingrédient déjà présent dans la recette
- **THEN** cet ingrédient est présenté comme déjà ajouté
- **AND** il ne peut pas être sélectionné

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

### Requirement: La fenêtre de sélection propose la recherche ou la saisie libre

La fenêtre de sélection SHALL proposer deux modes entre lesquels l'utilisateur choisit : « Rechercher », parmi les aliments enregistrés, et « Saisie libre ». Elle SHALL s'ouvrir en mode « Rechercher ». Quand une recherche ne renvoie aucun résultat, elle SHALL proposer de passer en saisie libre en reprenant le texte cherché comme nom.

#### Scenario: Mode à l'ouverture

- **WHEN** l'utilisateur ouvre la fenêtre de sélection
- **THEN** le mode « Rechercher » est actif
- **AND** le mode « Saisie libre » est proposé

#### Scenario: Passage en saisie libre

- **WHEN** l'utilisateur choisit le mode « Saisie libre »
- **THEN** la fenêtre présente un champ de nom, un champ de quantité et les champs de valeurs nutritionnelles
- **AND** le champ de recherche et la liste de résultats ne sont plus affichés

#### Scenario: Retour à la recherche

- **WHEN** l'utilisateur est en saisie libre et choisit le mode « Rechercher »
- **THEN** le champ de recherche et la liste de résultats sont de nouveau affichés

#### Scenario: Recherche sans résultat

- **WHEN** l'utilisateur cherche « sumac » et qu'aucun aliment ne correspond
- **THEN** la fenêtre propose de saisir « sumac » librement
- **AND** accepter cette proposition passe en saisie libre avec « sumac » comme nom

#### Scenario: Réouverture

- **WHEN** l'utilisateur ferme la fenêtre en saisie libre, puis la rouvre
- **THEN** le mode « Rechercher » est actif
- **AND** les champs de la saisie libre ont retrouvé leur état initial

### Requirement: La saisie libre ajoute un ingrédient par son nom et sa quantité

En saisie libre, l'utilisateur SHALL pouvoir ajouter au plat un ingrédient absent des aliments enregistrés en donnant un nom et une quantité en grammes, pré-remplie à 100. Le nom SHALL être retenu sans ses espaces de début et de fin.

#### Scenario: Ajout d'un ingrédient libre

- **WHEN** l'utilisateur saisit « Sumac » et 5 en saisie libre, puis valide
- **THEN** « Sumac » est ajouté au plat pour 5 g
- **AND** la fenêtre se ferme

#### Scenario: Quantité par défaut

- **WHEN** l'utilisateur saisit un nom en saisie libre et valide sans toucher à la quantité
- **THEN** l'ingrédient est ajouté pour 100 g

#### Scenario: Espaces autour du nom

- **WHEN** l'utilisateur saisit «  Sumac  » en saisie libre et valide
- **THEN** l'ingrédient ajouté s'appelle « Sumac »

#### Scenario: Ingrédient libre conservé à l'enregistrement

- **WHEN** l'utilisateur enregistre un plat contenant l'ingrédient libre « Sumac » à 5 g, puis le rouvre pour le modifier
- **THEN** la ligne « Sumac » est présente, à 5 g

### Requirement: La saisie libre accepte des valeurs nutritionnelles facultatives

La saisie libre SHALL proposer les valeurs nutritionnelles de l'ingrédient pour 100 g : calories, protéines, glucides et lipides. Chacune SHALL être pré-remplie à 0 et rester facultative ; un champ laissé vide SHALL valoir 0. Les valeurs saisies SHALL être celles utilisées pour le calcul nutritionnel du plat.

#### Scenario: Valeurs par défaut

- **WHEN** l'utilisateur passe en saisie libre
- **THEN** les calories, protéines, glucides et lipides pour 100 g sont à 0

#### Scenario: Validation sans valeurs

- **WHEN** l'utilisateur saisit « Sumac » et 5 g sans toucher aux valeurs nutritionnelles, puis valide
- **THEN** « Sumac » est ajouté au plat
- **AND** il compte pour zéro dans le calcul nutritionnel du plat

#### Scenario: Validation avec valeurs

- **WHEN** l'utilisateur saisit « Pesto maison », 50 g et 400 kcal pour 100 g, puis valide et enregistre le plat
- **THEN** « Pesto maison » contribue pour 200 kcal au total du plat

#### Scenario: Champ vidé

- **WHEN** l'utilisateur efface le contenu du champ des protéines et valide
- **THEN** l'ingrédient est ajouté avec 0 g de protéines pour 100 g

### Requirement: Un ingrédient libre devient un aliment réutilisable

Un ingrédient saisi librement SHALL être enregistré comme aliment personnel, avec ses valeurs nutritionnelles, et se retrouver ensuite par la recherche. La saisie libre NE SHALL PAS créer un second aliment personnel du même nom, sans distinction de casse ni d'accents : elle SHALL signaler que l'aliment existe et inviter à le choisir par la recherche.

#### Scenario: Retrouvé par la recherche

- **WHEN** l'utilisateur a ajouté « Pesto maison » à 400 kcal pour 100 g en saisie libre, puis cherche « pesto » en composant un autre plat
- **THEN** « Pesto maison » figure dans les résultats, présenté comme un aliment personnel
- **AND** l'ajouter pour 100 g compte 400 kcal dans ce plat

#### Scenario: Nom déjà pris

- **WHEN** l'utilisateur saisit librement « sumac » alors que l'aliment personnel « Sumac » existe
- **THEN** la fenêtre indique que cet aliment existe déjà et se choisit par la recherche
- **AND** l'action de validation est indisponible

#### Scenario: Liste de courses

- **WHEN** un plat contenant l'ingrédient libre « Sumac » à 5 g est marqué pour les courses
- **THEN** la liste de courses comporte « Sumac » pour 5 g

### Requirement: Les valeurs d'un aliment personnel se corrigent depuis sa ligne

La ligne d'un aliment personnel dans la zone « Ingrédients » SHALL proposer une action ouvrant la correction de ses calories, protéines, glucides et lipides pour 100 g, pré-remplies de leurs valeurs actuelles. La correction SHALL s'appliquer à l'aliment lui-même, donc à tous les plats qui l'utilisent, sans attendre l'enregistrement du plat en cours. Les lignes des autres aliments NE SHALL PAS proposer cette action.

#### Scenario: Ouverture de la correction

- **WHEN** l'utilisateur active l'action de correction sur la ligne « Pesto maison », enregistré à 400 kcal pour 100 g
- **THEN** une fenêtre présente ses quatre valeurs, dont 400 pour les calories

#### Scenario: Valeurs corrigées

- **WHEN** l'utilisateur remplace 400 par 450 kcal et valide, puis enregistre le plat qui contient 100 g de « Pesto maison »
- **THEN** « Pesto maison » contribue pour 450 kcal au total du plat

#### Scenario: Valeurs renseignées après coup

- **WHEN** l'utilisateur a ajouté « Sumac » sans valeurs, puis saisit 240 kcal pour 100 g par l'action de correction
- **THEN** la ligne « Sumac » n'est plus signalée comme non renseignée

#### Scenario: Répercussion sur un autre plat

- **WHEN** l'utilisateur corrige les calories de « Pesto maison » depuis un plat, puis consulte un autre plat qui l'utilise
- **THEN** les valeurs nutritionnelles de cet autre plat tiennent compte de la correction

#### Scenario: Annulation de la correction

- **WHEN** l'utilisateur modifie une valeur dans la fenêtre de correction, puis annule
- **THEN** les valeurs de l'aliment sont inchangées

#### Scenario: Valeur négative

- **WHEN** l'utilisateur saisit une valeur négative dans la fenêtre de correction
- **THEN** la validation de la correction est indisponible

#### Scenario: Aliment Ciqual

- **WHEN** le plat contient un aliment issu de la liste Ciqual
- **THEN** sa ligne ne propose pas l'action de correction des valeurs

### Requirement: Un ingrédient aux valeurs non renseignées est signalé

Un aliment personnel dont les calories, protéines, glucides et lipides sont tous à 0 SHALL être signalé sur sa ligne de l'écran de saisie comme n'ayant pas de valeurs nutritionnelles renseignées. La saisie libre SHALL avertir que, sans valeurs, l'ingrédient ne compte pas dans le calcul du plat.

#### Scenario: Avertissement dans la fenêtre

- **WHEN** l'utilisateur est en saisie libre
- **THEN** la fenêtre indique que, sans valeurs, l'ingrédient ne compte pas dans les valeurs nutritionnelles du plat

#### Scenario: Ligne signalée

- **WHEN** le plat contient l'ingrédient libre « Sumac », ajouté sans valeurs
- **THEN** la ligne « Sumac » indique que ses valeurs nutritionnelles ne sont pas renseignées

#### Scenario: Ligne renseignée

- **WHEN** le plat contient « Pesto maison », enregistré à 400 kcal pour 100 g
- **THEN** sa ligne ne porte pas ce signalement

#### Scenario: Aliment Ciqual sans calories

- **WHEN** le plat contient un aliment Ciqual à 0 kcal, comme l'eau
- **THEN** sa ligne ne porte pas ce signalement
