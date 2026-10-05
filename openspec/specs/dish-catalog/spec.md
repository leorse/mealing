# dish-catalog Specification

## Purpose
Décrit la liste des plats enregistrés, maison ou tout prêts : le vocabulaire employé pour les désigner à l'écran et la possibilité d'en marquer certains comme favoris.

## Requirements

### Requirement: L'interface parle de plats, pas de recettes

Tout texte affiché à l'utilisateur — libellé, titre, message, texte d'aide, confirmation, texte lu par un lecteur d'écran — SHALL désigner un repas enregistré par le mot « plat ». Un plat composé d'ingrédients SHALL être dit « plat maison », par opposition au « plat tout prêt ». Le mot « recette » NE SHALL plus apparaître à l'écran.

#### Scenario: Navigation

- **WHEN** l'utilisateur parcourt la barre de navigation avec un lecteur d'écran
- **THEN** l'onglet des repas enregistrés est annoncé « Plats »

#### Scenario: Liste des plats

- **WHEN** l'utilisateur ouvre la liste des repas enregistrés
- **THEN** l'écran est titré « Plats » et son champ de recherche invite à rechercher un plat

#### Scenario: Création

- **WHEN** l'utilisateur crée un repas composé d'ingrédients
- **THEN** l'écran est titré « Nouveau plat maison »

#### Scenario: Suppression

- **WHEN** l'utilisateur demande la suppression d'un plat
- **THEN** la confirmation demande « Supprimer ce plat ? »

#### Scenario: Aucun écran ne dit « recette »

- **WHEN** l'utilisateur parcourt tous les écrans et fenêtres de l'application
- **THEN** le mot « recette » n'apparaît dans aucun texte affiché ni annoncé

### Requirement: Chaque plat de la liste porte un cœur

Dans la liste des plats, chaque plat, maison comme tout prêt, SHALL porter un cœur. Le cœur SHALL être vide lorsque le plat n'est pas favori et rempli en rouge lorsqu'il l'est. Un plat existant ou nouvellement créé SHALL être non favori.

#### Scenario: Plat jamais marqué

- **WHEN** l'utilisateur consulte la liste des plats
- **THEN** chaque plat jamais marqué affiche un cœur vide

#### Scenario: Plat tout prêt

- **WHEN** la liste contient un plat tout prêt
- **THEN** ce plat porte lui aussi un cœur

#### Scenario: Plat favori

- **WHEN** un plat est favori
- **THEN** son cœur est rempli en rouge, en thème clair comme en thème sombre

#### Scenario: État annoncé

- **WHEN** un lecteur d'écran parcourt le cœur d'un plat
- **THEN** il annonce le nom du plat et s'il est favori

### Requirement: Le cœur bascule le favori au clic

Un clic sur le cœur d'un plat SHALL le faire passer de non favori à favori, ou l'inverse, sans ouvrir le plat ni demander de confirmation. L'état SHALL être conservé après rechargement de l'application et après modification du plat.

#### Scenario: Ajout aux favoris

- **WHEN** l'utilisateur clique sur le cœur vide d'un plat
- **THEN** le cœur se remplit en rouge
- **AND** l'écran du plat ne s'ouvre pas

#### Scenario: Retrait des favoris

- **WHEN** l'utilisateur clique sur le cœur rouge d'un plat
- **THEN** le cœur redevient vide

#### Scenario: Rechargement

- **WHEN** l'utilisateur marque un plat comme favori, puis recharge l'application
- **THEN** le cœur de ce plat est toujours rouge

#### Scenario: Modification du plat

- **WHEN** l'utilisateur modifie puis enregistre un plat favori
- **THEN** le plat est toujours favori
