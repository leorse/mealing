# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
