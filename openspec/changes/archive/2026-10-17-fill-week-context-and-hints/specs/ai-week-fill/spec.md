# Spec Delta

## MODIFIED Requirements

### Requirement: La semaine complète est transmise à l'IA

Lorsque l'option « Tenir compte du reste de la semaine » est activée, la demande de proposition SHALL transmettre tous les repas déjà planifiés de la semaine affichée, jour par jour, avec leur créneau, leur nom, leurs calories, la mention d'écart le cas échéant et, pour un plat maison, la liste de ses ingrédients — y compris la collation, et y compris les jours dont aucun créneau n'est retenu. Elle SHALL aussi indiquer les créneaux vides écartés comme des repas que l'utilisateur gère lui-même. Les consignes SHALL demander de ne pas surcharger une journée ni la semaine, et de ne reproposer aucun plat ni ingrédient principal déjà présent dans la semaine.

#### Scenario: Créneau garni, donc grisé

- **WHEN** le mardi contient déjà un déjeuner de 900 kcal et que seul son dîner est retenu
- **THEN** la demande indique ce déjeuner, ses calories et ses ingrédients, pour que le dîner proposé complète la journée sans la surcharger

#### Scenario: Jour sans créneau retenu

- **WHEN** le samedi est entièrement garni et qu'aucun de ses créneaux n'est retenu
- **THEN** les repas du samedi sont quand même transmis

#### Scenario: Collation et écart

- **WHEN** le jeudi contient une collation et le vendredi un écart au dîner
- **THEN** la collation et l'écart, signalé comme tel, sont transmis avec leurs calories

#### Scenario: Créneau vide écarté

- **WHEN** l'utilisateur a écarté les petits-déjeuners du jeudi et du vendredi, qui sont vides
- **THEN** la demande indique que ces deux repas seront pris sans proposition de l'IA

#### Scenario: Semaine vide

- **WHEN** la semaine ne contient aucun repas
- **THEN** la demande indique qu'aucun repas n'est encore planifié

#### Scenario: Ne pas répéter le midi

- **WHEN** le lundi midi est un poulet au riz et que seuls les dîners sont retenus, option activée
- **THEN** la demande contient ce plat et ses ingrédients
- **AND** elle demande de ne reproposer ni ce plat ni ses ingrédients principaux

## ADDED Requirements

### Requirement: Le reste de la semaine se transmet par une option activée par défaut

L'onglet de remplissage SHALL comporter une option « Tenir compte du reste de la semaine », activée à chaque ouverture de la fenêtre, avec une mention qu'elle envoie davantage de données et consomme plus de crédits. Désactivée, la demande SHALL se limiter aux jours qui contiennent au moins un créneau retenu, avec le nom et les calories de leurs repas, sans ingrédients ni consigne de non-répétition sur la semaine. Le choix NE SHALL PAS être enregistré.

#### Scenario: Valeur à l'ouverture

- **WHEN** l'utilisateur ouvre l'onglet de remplissage
- **THEN** l'option est activée

#### Scenario: Option désactivée

- **WHEN** l'utilisateur désactive l'option et ne retient que le dîner du jeudi
- **THEN** la demande ne transmet que les repas du jeudi, sans ingrédients
- **AND** les autres jours de la semaine n'y figurent pas

#### Scenario: Pas de mémoire

- **WHEN** l'utilisateur désactive l'option, ferme la fenêtre puis la rouvre
- **THEN** l'option est de nouveau activée

#### Scenario: Aucune transmission au changement

- **WHEN** l'utilisateur bascule l'option
- **THEN** aucune donnée n'est transmise à l'IA

### Requirement: Des indications complémentaires ponctuelles s'ajoutent aux préférences

L'onglet de remplissage SHALL comporter une zone de texte optionnelle « Indications complémentaires », de 300 caractères au plus, avec un exemple (« pas de riz, sans poisson »). Son contenu, s'il n'est pas vide, SHALL être transmis dans la demande de proposition, en plus des préférences culinaires des Réglages, avec la consigne de le respecter strictement. Il NE SHALL PAS être enregistré ni modifier les préférences des Réglages ; il est conservé tant que la fenêtre reste ouverte, y compris entre deux demandes.

#### Scenario: Indication saisie

- **WHEN** l'utilisateur écrit « pas de riz, sans poisson » et valide la grille
- **THEN** ce texte figure dans les consignes de la demande, à respecter strictement
- **AND** les préférences des Réglages y figurent aussi si elles sont renseignées

#### Scenario: Zone vide

- **WHEN** la zone est vide ou ne contient que des espaces
- **THEN** la demande part sans mention d'indications complémentaires

#### Scenario: Limite de longueur

- **WHEN** l'utilisateur atteint 300 caractères
- **THEN** la zone n'accepte pas davantage

#### Scenario: Nouvelle demande

- **WHEN** l'utilisateur revient à la grille après une proposition et relance une demande
- **THEN** la zone contient encore son texte

#### Scenario: Pas d'enregistrement

- **WHEN** l'utilisateur ferme la fenêtre puis la rouvre
- **THEN** la zone est vide
- **AND** les préférences des Réglages sont inchangées
