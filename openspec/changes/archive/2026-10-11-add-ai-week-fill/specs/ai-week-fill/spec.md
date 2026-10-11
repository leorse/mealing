# Spec Delta

## Purpose

Permet de demander à l'IA de proposer des plats pour les créneaux vides d'une semaine, de relire ces propositions, puis de les transformer en plats chiffrés ajoutés au planning, en tenant compte de l'objectif nutritionnel et des préférences culinaires de l'utilisateur.

## ADDED Requirements

### Requirement: Le remplissage se demande depuis la fenêtre IA de la semaine

La fenêtre ouverte par l'icône IA de l'en-tête de semaine SHALL comporter un onglet « Remplir la semaine », à côté de l'onglet « Bilan ». L'onglet affiché à l'ouverture SHALL être « Remplir la semaine » lorsque la semaine ne contient aucun repas, et « Bilan » sinon. Changer d'onglet NE SHALL rien envoyer.

#### Scenario: Semaine vide

- **WHEN** l'utilisateur ouvre la fenêtre IA d'une semaine sans aucun repas
- **THEN** l'onglet « Remplir la semaine » est affiché

#### Scenario: Semaine entamée

- **WHEN** l'utilisateur ouvre la fenêtre IA d'une semaine qui contient des repas
- **THEN** l'onglet « Bilan » est affiché
- **AND** l'onglet « Remplir la semaine » est accessible d'un appui

#### Scenario: Changement d'onglet

- **WHEN** l'utilisateur passe d'un onglet à l'autre
- **THEN** aucune donnée n'est transmise à l'IA

### Requirement: Une grille montre les créneaux de la semaine

L'onglet de remplissage SHALL afficher une grille de sept colonnes, une par jour de la semaine affichée, et de trois lignes : petit-déjeuner, déjeuner, dîner. La collation NE SHALL PAS y figurer. Chaque case SHALL porter un libellé accessible nommant son jour et son repas.

#### Scenario: Forme de la grille

- **WHEN** l'utilisateur ouvre l'onglet de remplissage
- **THEN** la grille compte 21 cases, sept jours sur trois repas, sans ligne de collation

#### Scenario: Libellé d'une case

- **WHEN** un lecteur d'écran atteint la case du déjeuner du mardi 6
- **THEN** il annonce le déjeuner du mardi 6 et dit si la case est retenue

### Requirement: Les créneaux vides sont verts, les créneaux garnis sont gris et verrouillés

À l'ouverture, une case SHALL être verte lorsque son créneau ne contient aucune entrée au planning, et grise sinon. Une case grise parce que son créneau est déjà garni NE SHALL PAS pouvoir être retenue. L'état d'une case NE SHALL PAS être signalé par la seule couleur.

#### Scenario: Créneau vide

- **WHEN** le dîner du jeudi ne contient aucune entrée
- **THEN** sa case est verte

#### Scenario: Créneau garni

- **WHEN** le déjeuner du lundi contient déjà un plat
- **THEN** sa case est grise
- **AND** un appui dessus ne la rend pas verte

#### Scenario: Écart planifié

- **WHEN** le dîner du samedi ne contient qu'un écart
- **THEN** sa case est grise et verrouillée, comme pour un plat

#### Scenario: Thème sombre

- **WHEN** l'application est en thème sombre
- **THEN** les cases vertes, grises et verrouillées restent distinguables

### Requirement: Un appui retient ou écarte un créneau vide

Un appui sur la case d'un créneau vide SHALL la faire passer de verte à grise, et un nouvel appui de grise à verte. Seules les cases vertes SHALL faire l'objet d'une proposition. Le nombre de créneaux retenus SHALL être affiché, et la demande SHALL être impossible tant qu'aucun créneau n'est retenu.

#### Scenario: Écarter les petits-déjeuners

- **WHEN** les petits-déjeuners du jeudi et du vendredi sont vides et que l'utilisateur appuie sur ces deux cases
- **THEN** elles deviennent grises
- **AND** l'IA ne proposera rien pour ces deux créneaux

#### Scenario: Retenir de nouveau

- **WHEN** l'utilisateur appuie de nouveau sur une case qu'il vient d'écarter
- **THEN** elle redevient verte

#### Scenario: Aucun créneau retenu

- **WHEN** toutes les cases sont grises
- **THEN** le bouton de demande est inactif

#### Scenario: Semaine pleine

- **WHEN** les 21 créneaux sont déjà garnis
- **THEN** l'onglet indique qu'il n'y a rien à remplir, et le bouton de demande est inactif

### Requirement: L'IA propose un plat par créneau retenu

À la validation de la grille, une seule demande SHALL être envoyée à l'IA pour tous les créneaux retenus. La réponse SHALL fournir, pour chaque créneau, un nom de plat et une description de sa composition pour une personne, avec des quantités. Aucun plat NE SHALL être créé ni aucun repas ajouté au planning à cette étape.

#### Scenario: Proposition

- **WHEN** l'utilisateur valide une grille de neuf créneaux retenus
- **THEN** une seule demande est envoyée
- **AND** neuf propositions sont reçues, une par créneau retenu

#### Scenario: Rien n'est écrit

- **WHEN** les propositions viennent d'arriver
- **THEN** la liste des plats et le planning sont inchangés

#### Scenario: Double appui

- **WHEN** l'utilisateur appuie deux fois de suite, très vite, sur le bouton de demande
- **THEN** le bouton est grisé dès le premier appui et une seule demande part

### Requirement: La semaine complète est transmise à l'IA

La demande de proposition SHALL transmettre tous les repas déjà planifiés de la semaine affichée, jour par jour, avec leur créneau, leur nom, leurs calories et la mention d'écart le cas échéant — y compris la collation, et y compris les jours dont aucun créneau n'est retenu. Elle SHALL aussi indiquer les créneaux vides que l'utilisateur a écartés, comme des repas qu'il gère lui-même. Les consignes SHALL demander de ne pas surcharger une journée ni la semaine.

#### Scenario: Créneau garni, donc grisé

- **WHEN** le mardi contient déjà un déjeuner de 900 kcal et que seul son dîner est retenu
- **THEN** la demande indique ce déjeuner et ses calories, pour que le dîner proposé complète la journée sans la surcharger

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

### Requirement: La proposition tient compte de l'objectif et des préférences

La demande de proposition SHALL transmettre à l'IA : les créneaux retenus avec leur jour et leur repas, l'objectif calorique quotidien, la répartition visée des macronutriments, l'objectif de poids, et les préférences culinaires si elles sont renseignées. Elle SHALL demander des plats variés d'un créneau à l'autre.

#### Scenario: Objectif transmis

- **WHEN** l'objectif de l'utilisateur est de 2 100 kcal par jour
- **THEN** la demande indique cet objectif et la répartition visée des macronutriments

#### Scenario: Préférences renseignées

- **WHEN** les préférences culinaires disent « pas de champignons, plats simples »
- **THEN** ce texte figure dans les consignes de la demande

#### Scenario: Préférences vides

- **WHEN** aucune préférence culinaire n'est enregistrée
- **THEN** la demande part sans mention de préférences

### Requirement: Rien de personnel n'est transmis, et seulement sur demande

L'application NE SHALL transmettre de données à l'IA pour le remplissage qu'après une validation explicite. Aucune demande NE SHALL contenir le prénom, la date de naissance, le sexe, le poids ni la taille de l'utilisateur, ni les repas d'une autre semaine. Les préférences culinaires NE SHALL être transmises que pour le remplissage.

#### Scenario: Ouverture sans validation

- **WHEN** l'utilisateur ouvre l'onglet, modifie la grille puis ferme la fenêtre
- **THEN** rien n'est transmis

#### Scenario: Contenu de la demande

- **WHEN** une demande de proposition est envoyée
- **THEN** elle ne contient ni prénom, ni date de naissance, ni sexe, ni poids, ni taille

### Requirement: Les propositions se relisent et se suppriment

Après la proposition, la fenêtre SHALL afficher la liste des plats proposés, dans l'ordre des jours puis des repas, chacun avec son jour, son repas, son nom et sa description. Chaque proposition SHALL pouvoir être supprimée ; un créneau dont la proposition est supprimée NE SHALL recevoir aucun plat. La création SHALL être impossible lorsque la liste est vide.

#### Scenario: Lecture de la liste

- **WHEN** neuf propositions ont été reçues
- **THEN** la liste en montre neuf, du lundi au dimanche, chacune avec son jour, son repas, son nom et sa description

#### Scenario: Suppression

- **WHEN** l'utilisateur supprime la proposition du dîner du mercredi
- **THEN** elle disparaît de la liste
- **AND** le dîner du mercredi restera vide

#### Scenario: Liste vidée

- **WHEN** l'utilisateur supprime toutes les propositions
- **THEN** le bouton de création est inactif

#### Scenario: Retour à la grille

- **WHEN** l'utilisateur revient à la grille depuis la liste
- **THEN** la grille retrouve les créneaux qu'il avait retenus
- **AND** une nouvelle demande remplacera les propositions

### Requirement: Les résultats restent consultables sans nouvelle demande

Une fois des propositions reçues, la grille SHALL offrir, à côté du bouton de demande, un bouton « Résultats » qui ramène à la liste des propositions telle qu'elle était, suppressions comprises, sans rien envoyer à l'IA. Ce bouton NE SHALL PAS apparaître tant qu'aucune proposition n'a été reçue. Une nouvelle demande SHALL remplacer les résultats.

#### Scenario: Avant toute demande

- **WHEN** l'utilisateur ouvre l'onglet de remplissage pour la première fois
- **THEN** seul le bouton de demande est affiché

#### Scenario: Retour aux résultats

- **WHEN** l'utilisateur revient à la grille depuis la liste, puis appuie sur « Résultats »
- **THEN** la liste réapparaît avec les mêmes propositions
- **AND** aucune demande n'est envoyée à l'IA

#### Scenario: Suppressions conservées

- **WHEN** l'utilisateur a supprimé une proposition, revient à la grille puis aux résultats
- **THEN** la proposition supprimée n'est pas revenue

#### Scenario: Nouvelle demande

- **WHEN** l'utilisateur modifie la grille et lance une nouvelle demande
- **THEN** les nouvelles propositions remplacent les précédentes

### Requirement: Une proposition incomplète n'écarte pas les autres

Lorsque la réponse de l'IA ne fournit pas de proposition exploitable pour certains créneaux retenus, les propositions valides SHALL être affichées et les créneaux sans proposition SHALL être signalés. Une réponse sans aucune proposition exploitable SHALL être traitée comme un échec.

#### Scenario: Créneau oublié

- **WHEN** neuf créneaux sont demandés et que la réponse n'en couvre que huit
- **THEN** huit propositions sont affichées
- **AND** un message indique qu'un créneau n'a pas reçu de proposition

#### Scenario: Créneau non demandé

- **WHEN** la réponse contient un plat pour un créneau qui n'était pas retenu
- **THEN** ce plat est ignoré

#### Scenario: Réponse inexploitable

- **WHEN** la réponse ne contient aucune proposition lisible
- **THEN** un message indique que la réponse n'a pas pu être lue et invite à réessayer
- **AND** la grille et ses créneaux retenus sont conservés

### Requirement: La validation de la liste crée les plats et les place au planning

À la validation de la liste, les descriptions des propositions restantes SHALL être analysées ensemble, en une seule analyse par lot, pour en tirer les ingrédients, leurs quantités et les aliments Ciqual. Chaque plat obtenu SHALL être enregistré comme plat maison d'une portion, puis ajouté au créneau de sa proposition, sans autre action de l'utilisateur.

#### Scenario: Création et placement

- **WHEN** l'utilisateur valide une liste de huit propositions
- **THEN** huit plats sont créés avec leurs ingrédients
- **AND** chacun apparaît au planning, au jour et au repas de sa proposition

#### Scenario: Une seule analyse

- **WHEN** huit propositions sont validées
- **THEN** leur analyse n'envoie qu'une demande de décomposition et une demande de choix des aliments, pour les huit

#### Scenario: Valeurs nutritionnelles

- **WHEN** un plat vient d'être créé par le remplissage
- **THEN** ses valeurs nutritionnelles sont calculées par l'application à partir de Ciqual, et non fournies par l'IA

#### Scenario: Double appui

- **WHEN** l'utilisateur appuie deux fois de suite, très vite, sur le bouton de création
- **THEN** les plats ne sont créés et placés qu'une fois

### Requirement: Les plats créés sont des plats de l'IA comme les autres

Un plat créé par le remplissage SHALL porter le nom de sa proposition, conserver sa description comme description d'origine, et être signalé dans la liste des plats comme créé par l'IA. Ses quantités SHALL être marquées comme estimées. Il SHALL ensuite se modifier, se planifier et se supprimer comme tout plat maison.

#### Scenario: Dans la liste des plats

- **WHEN** l'utilisateur ouvre la liste des plats après un remplissage
- **THEN** les plats créés y figurent avec l'icône de l'IA

#### Scenario: Détail du plat

- **WHEN** l'utilisateur ouvre l'un de ces plats
- **THEN** la description proposée par l'IA est affichée comme description d'origine
- **AND** ses quantités sont signalées comme estimées

#### Scenario: Deux créneaux, même plat

- **WHEN** deux propositions ont exactement le même nom et la même description
- **THEN** un seul plat est créé, placé dans les deux créneaux

### Requirement: Le repas ajouté porte les calories du plat

Chaque repas ajouté au planning par le remplissage SHALL être une entrée de plat ordinaire : une portion, le nom du plat, et les calories du plat calculées à sa création. Il NE SHALL PAS être marqué pour la liste de courses. Il SHALL se modifier et se supprimer comme toute entrée du planning.

#### Scenario: Calories du jour

- **WHEN** un plat de 620 kcal est ajouté au dîner du mardi
- **THEN** l'entrée affiche 620 kcal et le total du mardi augmente d'autant

#### Scenario: Liste de courses

- **WHEN** des repas viennent d'être ajoutés par le remplissage
- **THEN** aucun n'est marqué pour les courses tant que l'utilisateur n'a pas appuyé sur sa pastille

#### Scenario: Avis de l'IA dépassé

- **WHEN** un jour déjà noté par l'IA reçoit un repas par le remplissage
- **THEN** son avis est signalé comme dépassé, comme après tout ajout de repas

### Requirement: Un plat qui échoue n'empêche pas les autres

Lorsque l'analyse ne permet pas de créer certains plats, les autres SHALL être créés et placés, et la fenêtre SHALL nommer les propositions restées sans plat, avec leur jour et leur repas. Un ingrédient sans aliment Ciqual retenu SHALL être omis du plat ; un plat sans aucun ingrédient retenu SHALL être traité comme un échec.

#### Scenario: Échec partiel

- **WHEN** huit propositions sont validées et que l'analyse de l'une d'elles échoue
- **THEN** sept plats sont créés et placés
- **AND** la fenêtre indique quelle proposition n'a pas pu être créée, avec son jour et son repas

#### Scenario: Tout a réussi

- **WHEN** tous les plats ont été créés et placés
- **THEN** la fenêtre se ferme et le planning montre les nouveaux repas

#### Scenario: Ingrédient sans aliment

- **WHEN** un ingrédient d'un plat n'a trouvé aucun aliment Ciqual
- **THEN** le plat est créé sans cet ingrédient

### Requirement: Un échec d'ensemble ne laisse rien à moitié

Lorsque la création échoue dans son ensemble — clé refusée, trop de demandes, absence de réseau, réponse inexploitable — aucun plat NE SHALL être créé ni aucun repas ajouté, un message SHALL dire pourquoi, et la liste des propositions SHALL être conservée pour une nouvelle tentative.

#### Scenario: Réseau coupé pendant la création

- **WHEN** le réseau est coupé pendant l'analyse
- **THEN** aucun plat n'est créé et le planning est inchangé
- **AND** la liste des propositions est toujours là

#### Scenario: Nouvelle tentative

- **WHEN** l'utilisateur relance la création après un échec
- **THEN** les propositions restantes sont de nouveau analysées, sans nouvelle demande de proposition

#### Scenario: Clé absente

- **WHEN** l'utilisateur valide la grille sans avoir saisi de clé
- **THEN** aucune demande n'est envoyée
- **AND** un message l'invite à saisir sa clé dans les Réglages

### Requirement: Le remplissage exige la recherche intelligente

Lorsque le modèle de recherche intelligente n'est pas sur l'appareil, la fenêtre SHALL proposer son téléchargement avant d'envoyer la demande de proposition, en conservant les créneaux retenus.

#### Scenario: Modèle absent

- **WHEN** l'utilisateur valide la grille sans avoir téléchargé le modèle
- **THEN** le téléchargement lui est proposé
- **AND** aucune demande n'est envoyée à l'IA avant la fin du téléchargement

#### Scenario: Après le téléchargement

- **WHEN** le téléchargement se termine
- **THEN** la demande de proposition part pour les créneaux qui étaient retenus

### Requirement: L'avancement est visible et annulable

Pendant la proposition puis pendant la création, la fenêtre SHALL indiquer l'étape en cours : proposition des plats, compréhension des plats, recherche des aliments, choix des aliments, ajout au planning. L'utilisateur SHALL pouvoir annuler tant que l'ajout au planning n'a pas commencé ; une opération annulée NE SHALL rien créer.

#### Scenario: Étapes de la création

- **WHEN** la création est en cours
- **THEN** la fenêtre nomme l'étape en cours

#### Scenario: Annulation pendant la proposition

- **WHEN** l'utilisateur annule pendant la proposition
- **THEN** la fenêtre revient à la grille, créneaux retenus conservés

#### Scenario: Annulation pendant la création

- **WHEN** l'utilisateur annule pendant le choix des aliments
- **THEN** aucun plat n'est créé
- **AND** la liste des propositions est conservée

#### Scenario: Fermeture de la fenêtre

- **WHEN** l'utilisateur ferme la fenêtre pendant une opération
- **THEN** l'opération est annulée et rien n'est créé

### Requirement: La semaine remplie est celle qui était affichée à la demande

Les créneaux retenus, les repas déjà planifiés transmis et les repas ajoutés SHALL tous se rapporter à la semaine affichée au moment de l'ouverture de la fenêtre.

#### Scenario: Semaine figée

- **WHEN** l'utilisateur ouvre la fenêtre sur la semaine du 5 octobre et valide le remplissage
- **THEN** les repas sont ajoutés à la semaine du 5 octobre

### Requirement: Les préférences culinaires se saisissent dans les Réglages

L'écran Réglages SHALL comporter un champ de texte libre « Préférences culinaires », de 1 000 caractères au plus, avec un exemple. Le texte SHALL être enregistré sur l'appareil, retrouvé après rechargement, modifiable et effaçable. L'écran SHALL indiquer que ce texte est transmis à l'IA lors du remplissage de la semaine.

#### Scenario: Saisie

- **WHEN** l'utilisateur écrit « j'aime pas les champignons, des plats simples, pas de fromage râpé » et enregistre
- **THEN** ce texte est toujours là après rechargement de l'application

#### Scenario: Effacement

- **WHEN** l'utilisateur vide le champ et enregistre
- **THEN** les remplissages suivants partent sans préférences

#### Scenario: Limite de longueur

- **WHEN** l'utilisateur atteint 1 000 caractères
- **THEN** le champ n'accepte pas davantage

#### Scenario: Prise en compte

- **WHEN** l'utilisateur modifie ses préférences puis demande un remplissage
- **THEN** la demande utilise les préférences modifiées

#### Scenario: Sauvegarde

- **WHEN** l'utilisateur exporte ses données
- **THEN** les préférences culinaires font partie de l'export
