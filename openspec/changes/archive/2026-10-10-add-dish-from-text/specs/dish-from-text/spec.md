# Spec Delta

## Purpose

Permet de créer un plat à partir d'une description saisie en langage naturel : l'IA propose les ingrédients et estime les quantités que l'utilisateur ne connaît pas, les aliments sont rapprochés de Ciqual sur l'appareil, et les valeurs nutritionnelles sont calculées par l'application à partir de Ciqual.

## ADDED Requirements

### Requirement: Un plat se décrit en texte libre depuis la liste des plats

L'écran des plats SHALL proposer une action « Décrire un plat » ouvrant un écran de saisie d'un texte libre sur plusieurs lignes, avec un exemple de description. L'analyse NE SHALL démarrer que sur une action explicite, et seulement si le texte n'est pas vide.

#### Scenario: Ouverture

- **WHEN** l'utilisateur choisit « Décrire un plat » dans la liste des plats
- **THEN** un écran affiche un champ de texte vide, un exemple de description et un bouton d'analyse

#### Scenario: Texte vide

- **WHEN** le champ est vide ou ne contient que des espaces
- **THEN** le bouton d'analyse est inactif

### Requirement: L'analyse exige la clé d'IA et la recherche sémantique

L'analyse SHALL utiliser la clé et le modèle d'IA enregistrés dans les Réglages. Sans clé, aucune demande NE SHALL être envoyée et l'écran SHALL renvoyer aux Réglages. Si le modèle de recherche sémantique n'est pas sur l'appareil, l'écran SHALL proposer sa préparation avant toute analyse, en conservant le texte saisi.

#### Scenario: Clé absente

- **WHEN** l'utilisateur lance l'analyse sans avoir saisi de clé
- **THEN** aucune demande n'est envoyée
- **AND** un message l'invite à saisir sa clé dans les Réglages

#### Scenario: Recherche sémantique non installée

- **WHEN** l'utilisateur lance l'analyse sans avoir téléchargé le modèle de recherche
- **THEN** la préparation lui est proposée
- **AND** son texte est toujours là une fois la préparation terminée

### Requirement: Une analyse traite un ou plusieurs plats à la fois

L'analyse SHALL accepter une liste ordonnée d'une ou plusieurs descriptions de plats et rendre un résultat par description, dans le même ordre. Quel que soit le nombre de plats, elle SHALL n'envoyer qu'une demande de décomposition et une demande de choix. L'écran « Décrire un plat » SHALL soumettre une seule description.

#### Scenario: Un seul plat

- **WHEN** l'écran « Décrire un plat » lance l'analyse d'une description
- **THEN** l'analyse reçoit une liste d'une description et rend un seul plat

#### Scenario: Plusieurs plats

- **WHEN** l'analyse reçoit cinq descriptions
- **THEN** elle rend cinq plats, dans l'ordre des descriptions
- **AND** elle a envoyé une seule demande de décomposition et une seule demande de choix

#### Scenario: Liste vide

- **WHEN** l'analyse reçoit une liste sans aucune description non vide
- **THEN** aucune demande n'est envoyée

### Requirement: Chaque plat d'une analyse reste indépendant

Les ingrédients, les quantités, les candidats retenus et les contrôles SHALL être rattachés à leur plat : un ingrédient NE SHALL PAS passer d'un plat à un autre, et les quantités d'un même aliment NE SHALL être additionnées qu'à l'intérieur d'un plat. Un plat dont la décomposition est inexploitable SHALL être rendu en échec sans écarter les autres plats.

#### Scenario: Même aliment dans deux plats

- **WHEN** deux plats de la même analyse contiennent chacun de la mayonnaise
- **THEN** chaque plat garde sa propre ligne de mayonnaise, à sa propre quantité

#### Scenario: Un plat en échec

- **WHEN** la décomposition de trois plats est reçue et que celle du deuxième n'a aucun ingrédient exploitable
- **THEN** le premier et le troisième sont rendus normalement
- **AND** le deuxième est rendu en échec, avec sa description d'origine

#### Scenario: Plat manquant dans la réponse

- **WHEN** la réponse de l'IA ne contient pas l'un des plats demandés
- **THEN** ce plat est rendu en échec, les autres normalement

#### Scenario: Réponse entièrement illisible

- **WHEN** la réponse de l'IA ne peut pas être lue du tout
- **THEN** l'analyse entière échoue et aucun plat n'est rendu

### Requirement: L'IA décompose le texte en ingrédients

Une première demande à l'IA SHALL transformer chaque description en une liste d'ingrédients. Pour chaque ingrédient, elle SHALL fournir : un texte de recherche au vocabulaire proche de Ciqual, son état (cru, cuit, frit ou autre), son poids en grammes, la provenance de la quantité (utilisateur ou estimation), et un niveau de confiance. Elle SHALL aussi proposer un nom court pour chaque plat.

#### Scenario: Description sans quantité

- **WHEN** l'utilisateur analyse « un sandwich avec une grande merguez sauce samouraï et une grosse frite »
- **THEN** la décomposition contient au moins le pain, la merguez, la sauce et les frites
- **AND** chaque ingrédient a un poids en grammes marqué comme estimé

#### Scenario: Vocabulaire de recherche

- **WHEN** le texte mentionne « une grosse frite »
- **THEN** le texte de recherche de cet ingrédient désigne des frites de pomme de terre, avec leur état

#### Scenario: Nom proposé

- **WHEN** la décomposition est reçue
- **THEN** un nom court de plat est proposé, par exemple « Sandwich merguez frites »

### Requirement: Une quantité donnée par l'utilisateur prime sur l'estimation

Lorsque le texte indique une quantité pour un ingrédient, cette quantité SHALL être retenue telle quelle et marquée comme donnée par l'utilisateur. Un poids ou un volume explicite SHALL être repris exactement ; un nombre ou une fraction SHALL être repris comme tel. Sans indication, la quantité SHALL être estimée et marquée comme estimée.

#### Scenario: Poids explicite

- **WHEN** le texte contient « 50 g de frites »
- **THEN** les frites sont retenues pour 50 g, quantité donnée par l'utilisateur

#### Scenario: Nombre d'unités

- **WHEN** le texte contient « deux merguez »
- **THEN** la merguez est retenue pour deux unités, quantité donnée par l'utilisateur

#### Scenario: Fraction

- **WHEN** le texte contient « une demi-pizza »
- **THEN** la quantité retenue correspond à la moitié d'une pizza, quantité donnée par l'utilisateur

#### Scenario: Qualificatif seul

- **WHEN** le texte contient « une grosse frite » sans poids ni nombre
- **THEN** la quantité est estimée en tenant compte du qualificatif, et marquée comme estimée

### Requirement: Un nombre d'unités s'appuie sur l'unité de l'aliment retenu

Lorsque l'utilisateur a donné un nombre d'unités et que l'aliment Ciqual retenu porte une unité propre, la ligne SHALL être comptée en unités, son poids valant ce nombre multiplié par le poids de l'unité de l'aliment. Sinon, le poids SHALL être celui estimé par l'IA pour ce nombre.

#### Scenario: Aliment à unité propre

- **WHEN** le texte contient « deux merguez » et que l'aliment retenu indique « 1 saucisse = 60 g »
- **THEN** la ligne affiche 2 saucisses (120 g)

#### Scenario: Aliment sans unité propre

- **WHEN** le texte contient « deux poignées de riz » et que l'aliment retenu n'a pas d'unité propre
- **THEN** la ligne est en grammes, au poids estimé par l'IA pour deux poignées

### Requirement: Un aliment composé est décomposé en ingrédients simples

Lorsqu'un ingrédient n'existe probablement pas dans Ciqual, la décomposition SHALL le remplacer par des ingrédients simples avec leurs proportions. Le poids de chaque ingrédient simple SHALL valoir sa proportion appliquée au poids de l'aliment composé, la somme restant égale à ce poids. Chaque ligne obtenue SHALL rappeler l'aliment composé dont elle vient.

#### Scenario: Sauce samouraï

- **WHEN** le texte mentionne une sauce samouraï estimée à 30 g, décomposée en mayonnaise 70 %, ketchup 20 % et harissa 10 %
- **THEN** le plat contient 21 g de mayonnaise, 6 g de ketchup et 3 g de harissa
- **AND** chacune de ces lignes rappelle « sauce samouraï »

#### Scenario: Proportions incohérentes

- **WHEN** les proportions reçues ne totalisent pas 100 %
- **THEN** elles sont ramenées à 100 % en conservant leurs rapports

#### Scenario: Poids donné par l'utilisateur

- **WHEN** le texte contient « 50 g de sauce samouraï »
- **THEN** la somme des ingrédients simples de la sauce vaut 50 g

### Requirement: Les candidats Ciqual sont cherchés sur l'appareil

Pour chaque ingrédient de la décomposition, l'application SHALL chercher sur l'appareil, par recherche sémantique, une dizaine d'aliments Ciqual candidats à partir de son texte de recherche. Ni le texte de l'utilisateur ni les ingrédients NE SHALL être envoyés à un service d'embeddings distant.

#### Scenario: Candidats par ingrédient

- **WHEN** la décomposition contient quatre ingrédients
- **THEN** chacun reçoit sa propre liste d'une dizaine de candidats Ciqual

#### Scenario: Aucun candidat

- **WHEN** la recherche ne renvoie aucun candidat pour un ingrédient
- **THEN** cet ingrédient est présenté comme non trouvé, sans faire échouer l'analyse

### Requirement: L'IA choisit un aliment parmi les candidats, en une seule demande

Une seconde demande à l'IA, unique pour tous les plats de l'analyse, SHALL lui présenter chaque ingrédient avec ses candidats et leurs identifiants, et recevoir en retour chaque plat : pour chaque ingrédient, l'identifiant de l'aliment retenu ou l'indication qu'aucun ne convient. Cette demande NE SHALL PAS pouvoir changer les quantités.

#### Scenario: Une seule demande

- **WHEN** le plat compte six ingrédients
- **THEN** une seule demande de choix est envoyée, pour les six

#### Scenario: Une seule demande pour plusieurs plats

- **WHEN** l'analyse porte sur quatre plats totalisant vingt ingrédients
- **THEN** une seule demande de choix est envoyée, pour les vingt

#### Scenario: Choix d'un candidat

- **WHEN** l'ingrédient « merguez grillée » a dix candidats dont « Merguez, bœuf et mouton, cuite »
- **THEN** la réponse désigne par son identifiant l'un de ces dix candidats

#### Scenario: Aucun candidat convenable

- **WHEN** l'IA indique qu'aucun candidat ne convient pour un ingrédient
- **THEN** cet ingrédient est présenté comme non trouvé

### Requirement: Les choix de l'IA sont contrôlés

L'application SHALL vérifier que chaque identifiant renvoyé appartient à la liste des candidats de son ingrédient, et que les quantités données par l'utilisateur sont identiques avant et après le choix. Un choix hors de la liste, absent ou en double SHALL être écarté pour cet ingrédient seulement, remplacé par le candidat le plus proche et signalé « à vérifier ».

#### Scenario: Choix hors liste

- **WHEN** l'IA renvoie pour un ingrédient un identifiant qui ne figurait pas dans ses candidats, ou un identifiant inventé
- **THEN** ce choix est écarté
- **AND** le candidat le plus proche est proposé, signalé « à vérifier »

#### Scenario: Ingrédient oublié

- **WHEN** la réponse ne dit rien d'un des ingrédients
- **THEN** le candidat le plus proche est proposé pour celui-ci, signalé « à vérifier »
- **AND** les autres ingrédients gardent le choix de l'IA

#### Scenario: Quantité de l'utilisateur

- **WHEN** l'utilisateur a indiqué 50 g de frites
- **THEN** les frites sont à 50 g après le choix de l'aliment, quel que soit le contenu de la réponse

### Requirement: Les valeurs nutritionnelles viennent de Ciqual, jamais de l'IA

Les valeurs nutritionnelles du plat SHALL être calculées par l'application, à partir du poids de chaque ligne et des valeurs pour 100 g de l'aliment Ciqual retenu. L'application NE SHALL PAS demander de valeur nutritionnelle à l'IA, ni utiliser une valeur nutritionnelle figurant dans une réponse.

#### Scenario: Calcul d'une ligne

- **WHEN** une ligne retient 120 g d'un aliment à 300 kcal pour 100 g
- **THEN** elle compte pour 360 kcal

#### Scenario: Valeur glissée dans la réponse

- **WHEN** une réponse de l'IA contient des calories pour un ingrédient
- **THEN** cette valeur est ignorée

#### Scenario: Ingrédient non trouvé

- **WHEN** un ingrédient n'a pas d'aliment retenu
- **THEN** il ne compte pour rien dans les totaux tant qu'un aliment ne lui est pas attribué
- **AND** l'écran le signale

### Requirement: Le résultat présente chaque ligne et les totaux

Après l'analyse, l'écran SHALL afficher le nom proposé, modifiable, et pour chaque ligne : l'ingrédient tel que compris, l'aliment Ciqual retenu, la quantité, et ses calories. Il SHALL afficher les totaux du plat (calories, protéines, glucides, lipides), recalculés à chaque modification, et rappeler le texte analysé.

#### Scenario: Lecture du résultat

- **WHEN** l'analyse du sandwich aboutit
- **THEN** l'écran liste le pain, la merguez, les ingrédients de la sauce et les frites, chacun avec son aliment Ciqual, sa quantité et ses calories
- **AND** les totaux du plat sont affichés

#### Scenario: Totaux à jour

- **WHEN** l'utilisateur change la quantité d'une ligne
- **THEN** les calories de la ligne et les totaux changent aussitôt

### Requirement: Les quantités estimées sont signalées

Une ligne dont la quantité est estimée SHALL porter une marque visible et lisible par un lecteur d'écran, distincte d'une ligne dont la quantité vient de l'utilisateur. Tant qu'au moins une ligne est estimée, l'écran SHALL indiquer que le total est approximatif et que l'incertitude vient surtout des quantités.

#### Scenario: Ligne estimée

- **WHEN** les frites ont été estimées à 180 g
- **THEN** la ligne affiche « ≈ 180 g » et la mention « estimé »

#### Scenario: Ligne donnée par l'utilisateur

- **WHEN** l'utilisateur a indiqué 50 g de frites
- **THEN** la ligne affiche « 50 g » sans marque d'estimation

#### Scenario: Avertissement sur le total

- **WHEN** au moins une ligne est estimée
- **THEN** l'écran indique que le total est une estimation, pouvant s'écarter d'environ 30 %

#### Scenario: Plus aucune estimation

- **WHEN** toutes les quantités ont été données ou corrigées par l'utilisateur
- **THEN** l'avertissement disparaît

### Requirement: Une quantité estimée s'ajuste par taille de portion ou par poids

Chaque ligne estimée SHALL proposer trois tailles — petite, normale, grande — valant 70 %, 100 % et 130 % de l'estimation initiale, la taille normale étant sélectionnée au départ. Choisir une taille SHALL laisser la ligne estimée. Saisir un poids précis SHALL en faire une quantité donnée par l'utilisateur.

#### Scenario: Grande portion

- **WHEN** l'utilisateur choisit « grande » sur des frites estimées à 180 g
- **THEN** la ligne passe à 234 g et reste marquée comme estimée

#### Scenario: Retour à la portion normale

- **WHEN** l'utilisateur revient à « normale »
- **THEN** la ligne retrouve 180 g

#### Scenario: Poids précis

- **WHEN** l'utilisateur saisit 150 g sur cette ligne
- **THEN** la ligne affiche 150 g sans marque d'estimation
- **AND** les tailles de portion ne sont plus proposées pour cette ligne

#### Scenario: Poids invalide

- **WHEN** l'utilisateur saisit un poids nul ou négatif
- **THEN** la saisie est refusée et la quantité précédente est conservée

### Requirement: Les lignes incertaines sont signalées

Une ligne SHALL être signalée « à vérifier » lorsque l'IA a indiqué une confiance faible, ou lorsque son choix a été écarté par les contrôles. Ce signalement NE SHALL PAS empêcher de créer le plat.

#### Scenario: Confiance faible

- **WHEN** l'IA indique une confiance faible pour un ingrédient
- **THEN** sa ligne porte la mention « à vérifier »

#### Scenario: Création malgré un doute

- **WHEN** des lignes sont « à vérifier »
- **THEN** l'utilisateur peut tout de même créer le plat

### Requirement: L'aliment retenu se remplace

Sur chaque ligne, l'utilisateur SHALL pouvoir remplacer l'aliment retenu par un autre de ses candidats, ou par un aliment trouvé avec la recherche d'ingrédient habituelle, et supprimer la ligne. Remplacer l'aliment SHALL conserver la quantité et sa provenance.

#### Scenario: Autre candidat

- **WHEN** l'utilisateur ouvre les candidats de la ligne « merguez » et en choisit un autre
- **THEN** la ligne retient ce nouvel aliment, à la même quantité
- **AND** ses calories et les totaux sont recalculés

#### Scenario: Recherche habituelle

- **WHEN** aucun candidat ne convient et que l'utilisateur cherche l'aliment par son nom
- **THEN** l'aliment choisi remplace celui de la ligne

#### Scenario: Ligne non trouvée

- **WHEN** une ligne n'a pas d'aliment retenu
- **THEN** elle propose de choisir un aliment ou d'être supprimée

#### Scenario: Suppression

- **WHEN** l'utilisateur supprime une ligne
- **THEN** elle disparaît et les totaux sont recalculés

### Requirement: Un même aliment ne figure qu'une fois

Lorsque plusieurs ingrédients d'un même plat aboutissent au même aliment Ciqual, leurs quantités SHALL être additionnées sur une seule ligne. La ligne SHALL être marquée comme estimée dès qu'une des quantités additionnées l'est.

#### Scenario: Deux origines

- **WHEN** la mayonnaise vient à la fois de la sauce samouraï (21 g) et d'un ajout dans le sandwich (10 g)
- **THEN** le plat contient une seule ligne de mayonnaise de 31 g

#### Scenario: Mélange de provenances

- **WHEN** l'une des deux quantités vient de l'utilisateur et l'autre est estimée
- **THEN** la ligne est marquée comme estimée

### Requirement: L'utilisateur valide et le plat est créé

L'action « Valider » de l'écran de résultat SHALL enregistrer un plat maison portant le nom affiché et les lignes retenues, aux quantités affichées, pour une portion, puis ouvrir ce plat. Rien NE SHALL être enregistré avant cette validation. Les lignes sans aliment retenu NE SHALL PAS être enregistrées.

#### Scenario: Validation

- **WHEN** l'utilisateur valide le résultat du sandwich
- **THEN** un plat maison « Sandwich merguez frites » est créé avec les ingrédients et les quantités affichés
- **AND** le détail de ce plat s'ouvre

#### Scenario: Abandon

- **WHEN** l'utilisateur quitte l'écran de résultat sans valider
- **THEN** aucun plat n'est créé

#### Scenario: Plat comme les autres

- **WHEN** le plat a été créé
- **THEN** il se planifie, se modifie dans le formulaire de plat et alimente la liste de courses comme tout plat maison

#### Scenario: Nom vide

- **WHEN** le nom du plat est vide
- **THEN** l'action « Valider » est inactive

#### Scenario: Double validation

- **WHEN** l'utilisateur appuie deux fois de suite, très vite, sur « Valider »
- **THEN** le bouton est grisé dès le premier appui
- **AND** un seul plat est créé

#### Scenario: Aucune ligne exploitable

- **WHEN** aucune ligne n'a d'aliment retenu
- **THEN** l'action « Valider » est inactive

### Requirement: Un plat créé par l'IA se reconnaît et rappelle sa description

Un plat créé à partir d'une description SHALL conserver cette description. Dans la liste des plats, il SHALL porter l'icône de l'IA à côté de son nom, avec un libellé accessible ; un plat saisi à la main NE SHALL PAS la porter. Le détail du plat SHALL afficher la description donnée par l'utilisateur. Modifier le plat NE SHALL PAS effacer la description ni l'icône. Pour tout le reste, le plat SHALL se comporter comme un plat maison ordinaire.

#### Scenario: Liste des plats

- **WHEN** la liste contient un plat créé par l'IA et un plat saisi à la main
- **THEN** seul le premier porte l'icône de l'IA à côté de son nom

#### Scenario: Détail du plat

- **WHEN** l'utilisateur ouvre un plat créé à partir de « un sandwich avec une grande merguez sauce samouraï et une grosse frite »
- **THEN** le détail affiche cette description, telle qu'il l'a saisie

#### Scenario: Plat modifié

- **WHEN** l'utilisateur modifie le nom ou les ingrédients de ce plat et l'enregistre
- **THEN** le plat porte toujours l'icône de l'IA et sa description d'origine

#### Scenario: Plat saisi à la main

- **WHEN** l'utilisateur ouvre un plat créé par le formulaire
- **THEN** aucune description d'origine n'est affichée

### Requirement: La marque d'estimation suit le plat enregistré

Une ligne enregistrée avec une quantité estimée SHALL rester signalée comme telle dans le détail du plat. Modifier la quantité de cette ligne dans le formulaire SHALL retirer la marque.

#### Scenario: Détail du plat

- **WHEN** l'utilisateur consulte un plat créé à partir d'un texte, dont les frites étaient estimées
- **THEN** la ligne des frites est signalée comme estimée

#### Scenario: Correction ultérieure

- **WHEN** l'utilisateur modifie le plat et change la quantité des frites
- **THEN** la ligne n'est plus signalée comme estimée

#### Scenario: Plat créé à la main

- **WHEN** l'utilisateur consulte un plat saisi ingrédient par ingrédient
- **THEN** aucune ligne n'est signalée comme estimée

### Requirement: L'avancement de l'analyse est visible et annulable

Pendant l'analyse, l'écran SHALL indiquer l'étape en cours — compréhension du texte, recherche des aliments, choix des aliments — et NE SHALL PAS permettre de lancer une seconde analyse. L'utilisateur SHALL pouvoir annuler ; une analyse annulée NE SHALL rien afficher ni enregistrer.

#### Scenario: Étapes

- **WHEN** l'analyse est en cours
- **THEN** l'écran nomme l'étape en cours parmi les trois

#### Scenario: Double appui

- **WHEN** l'utilisateur appuie deux fois de suite, très vite, sur le bouton d'analyse
- **THEN** le bouton est grisé dès le premier appui
- **AND** une seule analyse démarre

#### Scenario: Annulation

- **WHEN** l'utilisateur annule pendant le choix des aliments
- **THEN** l'écran revient à la saisie, texte conservé, sans résultat

### Requirement: Seul le nécessaire est transmis à l'IA, et sur demande

L'application NE SHALL transmettre de données à l'IA qu'après l'action d'analyse. La première demande NE SHALL contenir que le texte saisi ; la seconde, que les ingrédients issus de ce texte et les noms des aliments candidats. Aucune NE SHALL contenir le prénom, la date de naissance, le sexe, le poids, la taille de l'utilisateur, ni son planning.

#### Scenario: Saisie sans analyse

- **WHEN** l'utilisateur tape un texte puis quitte l'écran sans lancer l'analyse
- **THEN** rien n'est transmis

#### Scenario: Contenu des demandes

- **WHEN** une analyse est lancée
- **THEN** les demandes ne contiennent aucune donnée du profil ni du planning

### Requirement: Un échec d'analyse s'explique et conserve le texte

Lorsqu'une analyse ne peut pas aboutir, l'écran SHALL afficher un message disant pourquoi et quoi faire, et SHALL conserver le texte saisi. Les cas distingués SHALL être : clé absente, clé refusée, trop de demandes, absence de réseau ou service indisponible, réponse inexploitable, et texte où aucun aliment n'a été reconnu.

#### Scenario: Hors ligne

- **WHEN** l'appareil n'a pas de réseau au moment de l'analyse
- **THEN** un message indique que l'analyse nécessite une connexion
- **AND** le texte est toujours dans le champ

#### Scenario: Clé refusée

- **WHEN** le service refuse la clé
- **THEN** un message indique que la clé est invalide et renvoie aux Réglages

#### Scenario: Trop de demandes

- **WHEN** le service répond qu'il y a trop de demandes
- **THEN** un message invite à réessayer plus tard

#### Scenario: Réponse inexploitable

- **WHEN** la décomposition reçue n'est pas lisible, ou qu'un ingrédient n'a ni texte de recherche ni poids strictement positif
- **THEN** un message indique que la réponse n'a pas pu être lue et invite à réessayer
- **AND** aucun résultat partiel n'est affiché

#### Scenario: Aucun aliment reconnu

- **WHEN** le texte ne décrit aucun aliment, par exemple « bonjour »
- **THEN** un message invite à décrire un repas

#### Scenario: Échec du choix

- **WHEN** la décomposition a réussi mais que la demande de choix échoue
- **THEN** l'utilisateur peut relancer l'analyse sans ressaisir son texte
