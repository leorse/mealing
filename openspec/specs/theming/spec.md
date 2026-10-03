# theming Specification

## Purpose

Garantit que les surfaces de l'interface suivent le thème clair ou sombre choisi au niveau du système, sans zone restée lisible dans un seul des deux thèmes.

## Requirements

### Requirement: Les surfaces suivent le thème du système

Toute surface de l'interface SHALL adopter le fond et la couleur de texte du thème actif du système, en thème clair comme en thème sombre.

#### Scenario: Fenêtre de sélection en thème sombre

- **WHEN** le système est en thème sombre et que l'utilisateur ouvre la fenêtre de sélection d'ingrédient
- **THEN** la fenêtre s'affiche sur un fond sombre avec un texte clair

#### Scenario: Fenêtre de sélection en thème clair

- **WHEN** le système est en thème clair et que l'utilisateur ouvre la fenêtre de sélection d'ingrédient
- **THEN** la fenêtre s'affiche sur un fond clair avec un texte sombre

### Requirement: Les bordures et séparateurs s'adaptent au thème

Les bordures, séparateurs et fonds de survol SHALL conserver un contraste correct dans les deux thèmes, et NE SHALL PAS être figés sur une valeur prévue pour un seul d'entre eux.

#### Scenario: Séparateurs de la liste de résultats en thème sombre

- **WHEN** le système est en thème sombre et que la liste de résultats affiche plusieurs ingrédients
- **THEN** les séparateurs entre résultats restent discrets sur le fond sombre
- **AND** ils n'apparaissent pas comme des traits clairs et lumineux

#### Scenario: Bordure du champ de recherche

- **WHEN** le thème du système passe de clair à sombre
- **THEN** la bordure du champ de recherche et celle du champ de quantité restent lisibles dans les deux thèmes

### Requirement: Les icônes restent visibles dans les deux thèmes

Une icône dont la couleur est figée SHALL être adaptée au thème sombre afin de rester visible sur un fond sombre.

#### Scenario: Icône d'ajout en thème sombre

- **WHEN** le système est en thème sombre et que l'utilisateur consulte la zone « Ingrédients »
- **THEN** l'icône du bouton d'ajout est visible sur le fond sombre
