# app-shell-layout Specification

## Purpose

Définit comment la coquille applicative répartit l'espace entre la zone de contenu et la barre de navigation fixe, afin que tout contenu reste atteignable quelle que soit sa hauteur.

## Requirements

### Requirement: La zone de contenu défile verticalement

La zone de contenu de la coquille applicative SHALL défiler verticalement lorsque le contenu de l'écran dépasse la hauteur disponible, sans que ce contenu déborde hors de sa boîte.

#### Scenario: Contenu plus haut que le viewport

- **WHEN** un écran affiche un contenu plus haut que la zone de contenu disponible
- **THEN** la zone de contenu devient défilable verticalement
- **AND** l'utilisateur peut atteindre le dernier élément de l'écran en défilant

#### Scenario: Contenu plus court que le viewport

- **WHEN** un écran affiche un contenu qui tient entièrement dans la zone disponible
- **THEN** aucune barre de défilement n'apparaît
- **AND** la mise en page reste identique à celle d'avant ce changement

### Requirement: Aucun contenu ne reste masqué par la barre de navigation

La coquille applicative SHALL réserver, à la fin de la zone défilable, un espace au moins égal à la hauteur de la barre de navigation fixe, afin qu'aucun contenu ne reste définitivement sous elle.

#### Scenario: Défilement jusqu'en bas

- **WHEN** l'utilisateur a défilé jusqu'à la fin d'un écran plus haut que le viewport
- **THEN** le dernier élément de l'écran est entièrement visible au-dessus de la barre de navigation

#### Scenario: Action en fin d'écran

- **WHEN** le dernier élément d'un écran est un contrôle interactif, tel le bouton de validation d'un formulaire
- **AND** l'utilisateur a défilé jusqu'à la fin de l'écran
- **THEN** un clic sur ce contrôle l'active
- **AND** le clic n'est pas intercepté par la barre de navigation

#### Scenario: Création d'une recette avec de nombreux ingrédients

- **WHEN** l'utilisateur saisit une nouvelle recette et y ajoute assez d'ingrédients pour que le formulaire dépasse la hauteur de l'écran
- **THEN** le bouton de validation du formulaire reste visible et cliquable après défilement

### Requirement: Les écrans ne sont pas compressés pour tenir dans le viewport

La coquille applicative SHALL préserver la hauteur naturelle des éléments d'un écran plutôt que de les comprimer pour faire tenir le contenu dans la hauteur du viewport.

#### Scenario: Formulaire long

- **WHEN** un formulaire comporte plus de champs que la hauteur de l'écran ne peut en afficher
- **THEN** chaque champ conserve sa hauteur naturelle
- **AND** le dépassement est absorbé par le défilement, non par la réduction des éléments

### Requirement: Les écrans à défilement interne conservent leur comportement

Un écran qui gère son propre défilement interne SHALL conserver ce comportement, sans défilement imbriqué parasite de la zone de contenu.

#### Scenario: Écran de planning hebdomadaire

- **WHEN** l'utilisateur consulte le planning de la semaine, dont la grille défile horizontalement dans une zone dédiée
- **THEN** la grille continue de défiler horizontalement dans sa propre zone
- **AND** la coquille n'ajoute pas de défilement vertical superflu autour d'elle
