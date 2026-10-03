# Spec Delta

## ADDED Requirements

### Requirement: Le planning ouvre la semaine contenant aujourd'hui

À son ouverture, le planning SHALL afficher la semaine qui contient la date du jour selon l'heure locale de l'utilisateur, quelle que soit l'heure à laquelle l'application est lancée et quel que soit son fuseau horaire.

#### Scenario: Ouverture en journée

- **WHEN** l'utilisateur ouvre le planning en milieu de journée
- **THEN** la semaine affichée contient la date du jour

#### Scenario: Ouverture juste après minuit

- **WHEN** l'utilisateur ouvre le planning entre minuit et deux heures du matin
- **THEN** la semaine affichée contient la date du jour
- **AND** elle est la même que celle affichée plus tard dans la même journée

#### Scenario: Les repas déjà planifiés restent visibles

- **WHEN** l'utilisateur a planifié des repas dans la semaine en cours et rouvre l'application à n'importe quelle heure
- **THEN** ces repas apparaissent sur leurs créneaux

### Requirement: Une date se convertit sans glissement de jour

La conversion d'une date en texte et sa relecture SHALL préserver le jour tel que l'utilisateur le voit, sans décalage lié au fuseau horaire.

#### Scenario: Aller-retour en soirée

- **WHEN** une date du jour courant est convertie en texte puis relue, en soirée
- **THEN** la date obtenue désigne le même jour

#### Scenario: Aller-retour juste après minuit

- **WHEN** une date du jour courant est convertie en texte puis relue, peu après minuit
- **THEN** la date obtenue désigne le même jour

#### Scenario: Fuseau à décalage négatif

- **WHEN** l'utilisateur se trouve dans un fuseau en retard sur le temps universel
- **THEN** la conversion et la relecture d'une date désignent le même jour qu'à l'écran

### Requirement: Les jours affichés suivent le début de semaine

Les sept jours présentés par le planning SHALL être les sept jours consécutifs à partir du lundi de la semaine affichée, sans jour manquant ni répété, quel que soit le fuseau.

#### Scenario: Semaine complète du lundi au dimanche

- **WHEN** le planning affiche une semaine
- **THEN** il présente sept colonnes, du lundi au dimanche

#### Scenario: Navigation d'une semaine à l'autre

- **WHEN** l'utilisateur passe à la semaine précédente puis revient à la suivante
- **THEN** il retrouve exactement la semaine de départ
