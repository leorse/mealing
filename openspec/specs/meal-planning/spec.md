# meal-planning Specification

## Purpose

Décrit comment l'utilisateur garnit son planning hebdomadaire : ce qu'un créneau de repas peut contenir, comment on y ajoute une recette ou un écart, et d'où viennent les calories affichées.

## Requirements

### Requirement: L'ajout d'un repas se fait dans une fenêtre

Depuis la grille du planning, l'action d'ajout d'un créneau de repas SHALL ouvrir une fenêtre par-dessus la grille. Le parcours NE SHALL PAS passer par un écran séparé ni quitter le planning.

#### Scenario: Ouverture depuis un créneau vide

- **WHEN** l'utilisateur active le bouton d'ajout d'un créneau de repas d'un jour donné
- **THEN** une fenêtre d'ajout s'ouvre par-dessus la grille
- **AND** elle porte sur ce jour et ce type de repas

#### Scenario: La grille reste affichée

- **WHEN** la fenêtre d'ajout est ouverte
- **THEN** la grille de la semaine reste visible derrière
- **AND** aucune navigation n'a eu lieu

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

### Requirement: Les calories se pré-remplissent depuis la recette choisie

En mode Recette, le champ calories SHALL se remplir automatiquement avec les calories par portion de la recette choisie, et SHALL se mettre à jour à chaque changement de choix tant que la fenêtre n'a pas été validée.

#### Scenario: Choix d'une recette

- **WHEN** l'utilisateur choisit une recette dans la liste
- **THEN** le champ calories affiche les calories par portion de cette recette

#### Scenario: Changement de recette avant validation

- **WHEN** l'utilisateur choisit une recette, puis en choisit une autre sans avoir validé
- **THEN** le champ calories affiche les calories de la seconde recette

#### Scenario: Plat tout prêt

- **WHEN** l'utilisateur choisit un plat tout prêt, dont les valeurs nutritionnelles sont saisies par portion
- **THEN** le champ calories affiche les calories par portion enregistrées pour ce plat

### Requirement: Les calories restent modifiables

Le champ calories SHALL rester modifiable par l'utilisateur dans les deux modes, et la valeur retenue à la validation SHALL être celle affichée dans le champ.

#### Scenario: Correction après pré-remplissage

- **WHEN** l'utilisateur choisit une recette puis corrige le champ calories
- **AND** valide la fenêtre
- **THEN** le créneau retient la valeur corrigée, et non celle de la recette

#### Scenario: Saisie en mode Écart

- **WHEN** le mode Écart est actif
- **THEN** le champ calories est vide et se saisit à la main

### Requirement: Un écart porte un nom

En mode Écart, la fenêtre SHALL proposer un champ nom, utilisé pour désigner l'entrée dans la grille.

#### Scenario: Écart nommé

- **WHEN** l'utilisateur saisit « Resto italien » en mode Écart avec des calories, puis valide
- **THEN** la grille affiche « Resto italien » sur ce créneau

### Requirement: La validation est explicite

La fenêtre SHALL proposer une action de validation et une action d'annulation. La validation SHALL rester indisponible tant que les champs requis du mode actif ne sont pas renseignés.

#### Scenario: Annulation

- **WHEN** l'utilisateur annule la fenêtre après avoir choisi une recette
- **THEN** la fenêtre se ferme
- **AND** le planning n'est pas modifié

#### Scenario: Calories manquantes

- **WHEN** le champ calories est vide ou négatif
- **THEN** la validation est indisponible

### Requirement: Un créneau de repas accepte plusieurs entrées

Un créneau de repas d'un jour SHALL pouvoir contenir plusieurs entrées, et le bouton d'ajout SHALL rester disponible une fois la première entrée posée.

#### Scenario: Un plat et un écart sur le même repas

- **WHEN** l'utilisateur ajoute une recette au déjeuner d'un jour, puis ajoute un écart sur ce même déjeuner
- **THEN** les deux entrées apparaissent sur ce créneau

#### Scenario: Le bouton d'ajout persiste

- **WHEN** un créneau de repas contient déjà au moins une entrée
- **THEN** le bouton d'ajout de ce créneau reste disponible

### Requirement: Le total du jour additionne toutes les entrées

Le total calorique affiché pour un jour SHALL être la somme des calories de toutes les entrées de ce jour, tous créneaux et tous modes confondus.

#### Scenario: Plusieurs entrées dans la journée

- **WHEN** un jour comporte un petit-déjeuner à 400 kcal, un déjeuner à 600 kcal et un écart à 300 kcal
- **THEN** le total du jour affiche 1300 kcal

### Requirement: Une entrée se retire du planning

Chaque entrée d'un créneau SHALL porter une action de suppression accessible depuis la grille, distincte de l'action qui ouvre la modification. Cette action SHALL demander un appui maintenu : la suppression n'a lieu qu'au terme de l'appui, et un relâchement prématuré l'annule.

#### Scenario: Suppression d'une entrée

- **WHEN** l'utilisateur maintient l'action de suppression d'une entrée jusqu'à son terme
- **THEN** cette entrée disparaît du créneau
- **AND** les autres entrées du créneau sont conservées

#### Scenario: Appui relâché trop tôt

- **WHEN** l'utilisateur commence à maintenir l'action de suppression puis relâche avant son terme
- **THEN** l'entrée est conservée

#### Scenario: Appui qui quitte la commande

- **WHEN** l'utilisateur maintient l'action de suppression puis déplace son doigt ou son curseur hors de la commande avant le terme
- **THEN** l'entrée est conservée

#### Scenario: Clic simple sans effet

- **WHEN** l'utilisateur clique brièvement sur l'action de suppression
- **THEN** l'entrée est conservée

#### Scenario: Progression visible pendant l'appui

- **WHEN** l'utilisateur maintient l'action de suppression
- **THEN** la commande montre la progression de l'appui vers la suppression

#### Scenario: Retour à l'état initial après annulation

- **WHEN** un appui est annulé avant son terme
- **THEN** la commande revient à son apparence de départ
- **AND** un nouvel appui repart du début

#### Scenario: Le total du jour suit la suppression

- **WHEN** l'utilisateur supprime une entrée de 300 kcal d'une journée qui en totalisait 1300
- **THEN** le total du jour affiche 1000 kcal

#### Scenario: Suppression de la dernière entrée

- **WHEN** l'utilisateur supprime la seule entrée d'un créneau
- **THEN** le créneau redevient vide et propose l'ajout

#### Scenario: Supprimer n'ouvre pas la modification

- **WHEN** l'utilisateur maintient puis relâche l'action de suppression d'une entrée
- **THEN** la fenêtre de modification ne s'ouvre pas

#### Scenario: Suppression au clavier

- **WHEN** l'utilisateur donne le focus à l'action de suppression et maintient la touche d'activation jusqu'au terme
- **THEN** l'entrée est supprimée

#### Scenario: Touche relâchée trop tôt

- **WHEN** l'utilisateur maintient la touche d'activation puis la relâche avant le terme
- **THEN** l'entrée est conservée

### Requirement: Une entrée existante se modifie dans la même fenêtre

Activer une entrée déjà posée SHALL rouvrir la fenêtre en modification, pré-remplie avec les valeurs de cette entrée, et la validation SHALL mettre à jour cette entrée au lieu d'en créer une nouvelle.

#### Scenario: Réouverture d'une entrée

- **WHEN** l'utilisateur active une entrée existante du planning
- **THEN** la fenêtre s'ouvre avec le mode, la recette et les calories de cette entrée

#### Scenario: Correction des calories d'une entrée

- **WHEN** l'utilisateur rouvre une entrée, change ses calories et valide
- **THEN** l'entrée est mise à jour
- **AND** aucune entrée supplémentaire n'est créée sur ce créneau

#### Scenario: Annulation d'une modification

- **WHEN** l'utilisateur rouvre une entrée, modifie des valeurs puis annule
- **THEN** l'entrée reste telle qu'elle était

### Requirement: Une entrée de repas enregistré porte une pastille de courses

Toute entrée du planning référençant un repas enregistré — recette maison ou plat tout prêt — SHALL porter une pastille de courses, distincte de l'action qui ouvre la modification et de celle qui supprime l'entrée.

#### Scenario: Entrée portant une recette

- **WHEN** un créneau contient une entrée référençant une recette maison
- **THEN** cette entrée affiche une pastille de courses

#### Scenario: Entrée portant un plat tout prêt

- **WHEN** un créneau contient une entrée référençant un plat tout prêt
- **THEN** cette entrée affiche une pastille de courses

#### Scenario: Entrée d'écart

- **WHEN** un créneau contient une entrée d'écart, qui ne référence aucun repas enregistré
- **THEN** cette entrée n'affiche pas de pastille de courses

### Requirement: La pastille montre si le plat part aux courses

La pastille SHALL présenter deux états visuellement distincts : un état grisé lorsque le plat ne doit pas alimenter la liste de courses, et un état vert lorsqu'il le doit.

#### Scenario: Plat exclu des courses

- **WHEN** une entrée n'est pas marquée pour les courses
- **THEN** sa pastille est grisée

#### Scenario: Plat retenu pour les courses

- **WHEN** une entrée est marquée pour les courses
- **THEN** sa pastille est verte

### Requirement: Le marquage est désactivé par défaut

Une entrée SHALL être non marquée à sa création, et une entrée enregistrée avant l'existence de ce marquage SHALL être traitée comme non marquée. Aucun repas NE SHALL alimenter la liste de courses sans une action explicite de l'utilisateur.

#### Scenario: Repas fraîchement ajouté

- **WHEN** l'utilisateur ajoute un repas au planning
- **THEN** sa pastille de courses est grisée

#### Scenario: Repas planifié de longue date

- **WHEN** l'utilisateur consulte un repas planifié avant l'arrivée de cette fonctionnalité
- **THEN** sa pastille de courses est grisée

#### Scenario: Semaine entière non marquée

- **WHEN** l'utilisateur planifie une semaine complète sans toucher aux pastilles
- **THEN** aucun de ces repas n'est destiné à la liste de courses

### Requirement: La pastille bascule au clic et son état est conservé

Activer la pastille SHALL inverser l'état de marquage de l'entrée, et cet état SHALL être enregistré de façon à survivre au rechargement de l'application.

#### Scenario: Marquage d'un plat

- **WHEN** l'utilisateur active la pastille grisée d'une entrée
- **THEN** la pastille devient verte

#### Scenario: Retrait du marquage

- **WHEN** l'utilisateur active la pastille verte d'une entrée
- **THEN** la pastille redevient grisée

#### Scenario: Persistance

- **WHEN** l'utilisateur marque un plat puis recharge l'application
- **THEN** la pastille de ce plat est toujours verte

#### Scenario: Le marquage n'ouvre rien

- **WHEN** l'utilisateur active la pastille d'une entrée
- **THEN** la fenêtre de modification ne s'ouvre pas
- **AND** l'entrée n'est pas supprimée

### Requirement: Le marquage est propre à chaque entrée

Le marquage SHALL porter sur une seule entrée, sans effet sur les autres entrées du même créneau, du même jour, ni sur les autres occurrences du même repas dans la semaine.

#### Scenario: Deux entrées sur le même créneau

- **WHEN** un créneau contient deux entrées et que l'utilisateur en marque une
- **THEN** l'autre entrée reste non marquée

#### Scenario: Même recette planifiée deux fois

- **WHEN** la même recette est planifiée lundi et jeudi, et que l'utilisateur marque celle de lundi
- **THEN** celle de jeudi reste non marquée

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
