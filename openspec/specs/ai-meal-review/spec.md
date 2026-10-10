# ai-meal-review Specification

## Purpose
Permet de demander à une IA jouant le rôle d'une nutritionniste son avis sur une journée ou sur toute la semaine du planning : une note et un commentaire par jour, un bilan de la semaine, conservés et rendus visibles sur la grille.

## Requirements

### Requirement: Chaque jour porte une icône de demande et une icône de commentaire

Dans la grille du planning, chaque jour SHALL afficher, à côté de son nom, une icône IA qui déclenche la demande d'avis et une icône commentaire qui ouvre l'avis reçu. Ces icônes SHALL être distinctes des actions qui ajoutent, modifient ou suppriment un repas.

#### Scenario: Jour de la grille

- **WHEN** l'utilisateur consulte la semaine au planning
- **THEN** chaque jour affiche l'icône IA puis l'icône commentaire à côté de son nom

#### Scenario: Libellés accessibles

- **WHEN** un lecteur d'écran parcourt les icônes du mercredi 7
- **THEN** il annonce une action de demande d'avis et une action d'ouverture de l'avis, en nommant ce jour

#### Scenario: Jour sans repas

- **WHEN** un jour ne contient aucun repas
- **THEN** son icône IA est inactive

### Requirement: L'icône commentaire indique s'il existe un avis

L'icône commentaire SHALL être grisée et inactive tant que le jour n'a pas d'avis, et noire et active dès qu'il en a un. En thème sombre, « noire » SHALL s'entendre comme la couleur normale du texte.

#### Scenario: Aucun avis

- **WHEN** aucun avis n'a été demandé pour un jour
- **THEN** son icône commentaire est grisée
- **AND** un clic dessus n'ouvre rien

#### Scenario: Avis disponible

- **WHEN** un avis a été reçu pour un jour
- **THEN** son icône commentaire est de la couleur du texte
- **AND** un clic dessus ouvre l'avis

### Requirement: Un clic sur l'icône IA demande l'avis sur la journée

Un clic sur l'icône IA d'un jour SHALL envoyer cette journée à l'IA et, à la réponse, enregistrer pour ce jour une note entière de 0 à 10 et un commentaire. Une nouvelle demande SHALL remplacer l'avis précédent de ce jour.

#### Scenario: Première demande

- **WHEN** l'utilisateur clique sur l'icône IA du mercredi 7, qui contient des repas
- **THEN** la journée est envoyée à l'IA
- **AND** à la réponse, le mercredi 7 a une note de 0 à 10 et un commentaire

#### Scenario: Nouvelle demande

- **WHEN** l'utilisateur redemande l'avis sur un jour qui en a déjà un
- **THEN** le nouvel avis remplace l'ancien

#### Scenario: Les autres jours ne changent pas

- **WHEN** l'utilisateur demande l'avis sur un seul jour
- **THEN** les avis des autres jours sont inchangés

### Requirement: L'icône IA s'anime pendant la requête

Entre l'envoi de la demande et l'arrivée de la réponse ou de l'échec, l'icône IA concernée SHALL changer de couleur en boucle et NE SHALL PAS déclencher une seconde demande. Lorsque l'utilisateur a demandé à réduire les animations, l'icône SHALL signaler l'attente par un état fixe distinct.

#### Scenario: Requête en cours

- **WHEN** l'utilisateur a cliqué sur l'icône IA d'un jour et que la réponse n'est pas arrivée
- **THEN** l'icône change de couleur en boucle

#### Scenario: Double clic

- **WHEN** l'utilisateur clique de nouveau sur une icône IA en cours d'animation
- **THEN** aucune seconde demande n'est envoyée

#### Scenario: Fin de la requête

- **WHEN** la réponse arrive, ou que la demande échoue
- **THEN** l'icône retrouve son aspect normal

#### Scenario: Animations réduites

- **WHEN** le système demande de réduire les animations et qu'une requête est en cours
- **THEN** l'icône est d'une couleur fixe différente de son aspect normal, sans animation

### Requirement: Le fond d'une journée notée va du rouge au vert

Le fond d'un jour qui a un avis à jour SHALL prendre une teinte dépendant de sa note : rouge pour 0, verte pour 10, avec des teintes intermédiaires pour les notes entre les deux. Un jour sans avis SHALL garder son fond habituel. La teinte SHALL laisser le contenu du jour lisible en thème clair comme en thème sombre.

#### Scenario: Note la plus basse

- **WHEN** un jour a la note 0
- **THEN** son fond est teinté de rouge

#### Scenario: Note la plus haute

- **WHEN** un jour a la note 10
- **THEN** son fond est teinté de vert

#### Scenario: Note intermédiaire

- **WHEN** un jour a la note 5
- **THEN** son fond est d'une teinte située entre le rouge et le vert

#### Scenario: Jour sans avis

- **WHEN** un jour n'a pas d'avis
- **THEN** son fond est celui d'un jour ordinaire

### Requirement: L'avis d'un jour s'ouvre dans une fenêtre

Un clic sur l'icône commentaire active d'un jour SHALL ouvrir une fenêtre affichant le jour concerné, sa note sur 10 et le commentaire de l'IA, sans quitter le planning.

#### Scenario: Lecture d'un avis

- **WHEN** l'utilisateur clique sur l'icône commentaire du mercredi 7, noté 7
- **THEN** une fenêtre affiche « mercredi 7 », la note 7/10 et le commentaire

#### Scenario: Fermeture

- **WHEN** l'utilisateur ferme la fenêtre
- **THEN** le planning est tel qu'il était

### Requirement: La semaine entière se demande depuis son en-tête

L'en-tête de la semaine SHALL porter une icône IA et une icône commentaire. Un clic sur cette icône IA SHALL envoyer en une seule demande tous les jours de la semaine qui contiennent des repas, et enregistrer à la réponse une note et un commentaire pour chacun de ces jours, ainsi qu'un bilan de la semaine.

#### Scenario: Semaine garnie

- **WHEN** l'utilisateur clique sur l'icône IA de la semaine, dont cinq jours contiennent des repas
- **THEN** ces cinq jours reçoivent chacun leur note et leur commentaire
- **AND** un bilan de la semaine est enregistré

#### Scenario: Jours vides

- **WHEN** la semaine envoyée comporte deux jours sans repas
- **THEN** ces deux jours ne sont pas notés

#### Scenario: Animation de la semaine

- **WHEN** la demande de la semaine est en cours
- **THEN** l'icône IA de l'en-tête et celles de tous les jours envoyés changent de couleur en boucle

#### Scenario: Semaine vide

- **WHEN** aucun jour de la semaine ne contient de repas
- **THEN** l'icône IA de la semaine est inactive

#### Scenario: Avis de jour remplacés

- **WHEN** l'utilisateur demande la semaine alors que certains jours ont déjà un avis
- **THEN** les avis de tous les jours envoyés sont remplacés par les nouveaux

### Requirement: Le bilan de la semaine s'ouvre depuis l'en-tête

L'icône commentaire de l'en-tête SHALL être grisée tant qu'aucun bilan n'existe pour la semaine affichée, et noire ensuite. Un clic SHALL ouvrir une fenêtre affichant le bilan et, pour rappel, la note de chaque jour noté.

#### Scenario: Aucun bilan

- **WHEN** la semaine n'a jamais été demandée en entier
- **THEN** l'icône commentaire de l'en-tête est grisée, même si des jours ont un avis

#### Scenario: Lecture du bilan

- **WHEN** l'utilisateur clique sur l'icône commentaire de l'en-tête après une demande de la semaine
- **THEN** une fenêtre affiche le bilan de la semaine et la note de chaque jour noté

#### Scenario: Autre semaine

- **WHEN** l'utilisateur passe à une semaine qui n'a pas de bilan
- **THEN** l'icône commentaire de l'en-tête est grisée

### Requirement: Les avis sont conservés

Les notes, les commentaires et le bilan SHALL être enregistrés sur l'appareil et retrouvés après rechargement de l'application et après changement de semaine.

#### Scenario: Rechargement

- **WHEN** l'utilisateur recharge l'application après avoir reçu un avis
- **THEN** le jour concerné a toujours sa teinte et son commentaire

#### Scenario: Retour sur une semaine

- **WHEN** l'utilisateur change de semaine puis revient
- **THEN** les avis et le bilan de la semaine sont toujours là

### Requirement: Un avis devient dépassé quand la journée change

Lorsque les repas d'un jour sont modifiés après la réception de son avis, cet avis SHALL être signalé comme dépassé : le fond du jour perd sa teinte, et la fenêtre de l'avis indique qu'il porte sur une version antérieure de la journée. L'avis SHALL rester lisible jusqu'à une nouvelle demande.

#### Scenario: Repas ajouté après l'avis

- **WHEN** l'utilisateur ajoute un repas à un jour déjà noté
- **THEN** le fond de ce jour redevient ordinaire
- **AND** son icône commentaire reste active

#### Scenario: Lecture d'un avis dépassé

- **WHEN** l'utilisateur ouvre l'avis d'un jour modifié depuis
- **THEN** la fenêtre affiche l'avis et signale que la journée a changé depuis

#### Scenario: Nouvelle demande

- **WHEN** l'utilisateur redemande l'avis sur ce jour
- **THEN** le nouvel avis est à jour et le fond reprend une teinte

#### Scenario: Journée inchangée

- **WHEN** l'utilisateur ouvre puis referme la modification d'un repas sans rien changer
- **THEN** l'avis du jour reste à jour

### Requirement: L'IA reçoit le rôle de nutritionniste et le contenu des journées

Chaque demande SHALL donner à l'IA la consigne de répondre en nutritionniste, en français, par une note entière de 0 à 10 et un commentaire pour chaque jour transmis, plus un bilan lorsqu'il s'agit de la semaine. Elle SHALL transmettre, pour chaque jour, ses repas par créneau avec leur nom, leurs calories, la mention d'écart le cas échéant et, pour un plat maison, ses ingrédients et leurs quantités, ainsi que l'objectif calorique quotidien, la répartition visée des macronutriments et l'objectif de poids.

#### Scenario: Journée transmise

- **WHEN** l'utilisateur demande l'avis sur un jour contenant un plat maison au déjeuner et un écart au dîner
- **THEN** la demande contient le plat avec ses ingrédients et ses calories, l'écart signalé comme tel, et l'objectif calorique du jour

#### Scenario: Demande d'une journée

- **WHEN** l'utilisateur demande l'avis sur un seul jour
- **THEN** seule cette journée est transmise, et aucun bilan n'est demandé

### Requirement: Rien n'est transmis sans demande, ni au-delà du nécessaire

L'application NE SHALL transmettre de données à l'IA qu'à la suite d'un clic sur une icône IA. Elle NE SHALL PAS transmettre le prénom, la date de naissance, le sexe, le poids ni la taille de l'utilisateur, ni des jours autres que ceux demandés.

#### Scenario: Consultation sans demande

- **WHEN** l'utilisateur consulte le planning, ouvre un avis ou change de semaine sans cliquer sur une icône IA
- **THEN** aucune donnée n'est transmise à l'IA

#### Scenario: Données personnelles

- **WHEN** une demande est envoyée
- **THEN** elle ne contient ni prénom, ni date de naissance, ni sexe, ni poids, ni taille

### Requirement: La clé d'accès et le modèle se règlent dans les Réglages

L'écran Réglages SHALL permettre de saisir, modifier et effacer la clé d'accès au service d'IA, et de choisir le modèle utilisé parmi une liste, avec un modèle par défaut. La clé SHALL être conservée sur l'appareil uniquement, NE SHALL PAS figurer dans les fichiers de l'application, et SHALL être masquée à l'affichage.

#### Scenario: Saisie de la clé

- **WHEN** l'utilisateur saisit sa clé dans les Réglages et l'enregistre
- **THEN** les demandes d'avis suivantes utilisent cette clé
- **AND** la clé est toujours en place après rechargement

#### Scenario: Clé masquée

- **WHEN** l'utilisateur rouvre les Réglages
- **THEN** la clé enregistrée n'est pas affichée en clair

#### Scenario: Effacement

- **WHEN** l'utilisateur efface la clé
- **THEN** les demandes d'avis ne sont plus possibles tant qu'une clé n'est pas saisie

#### Scenario: Choix du modèle

- **WHEN** l'utilisateur choisit un autre modèle et l'enregistre
- **THEN** les demandes suivantes utilisent ce modèle

### Requirement: Un échec est expliqué et ne détruit rien

Lorsqu'une demande ne peut pas aboutir, l'application SHALL afficher un message disant pourquoi et quoi faire, et SHALL laisser intacts les avis existants. Les cas distingués SHALL être : clé absente, clé refusée, trop de demandes, absence de réseau ou service indisponible, et réponse inexploitable.

#### Scenario: Clé absente

- **WHEN** l'utilisateur clique sur une icône IA sans avoir saisi de clé
- **THEN** aucune demande n'est envoyée
- **AND** un message l'invite à saisir sa clé dans les Réglages

#### Scenario: Clé refusée

- **WHEN** le service refuse la clé
- **THEN** un message indique que la clé est invalide et renvoie aux Réglages

#### Scenario: Trop de demandes

- **WHEN** le service répond qu'il y a trop de demandes
- **THEN** un message invite à réessayer plus tard

#### Scenario: Hors ligne

- **WHEN** l'appareil n'a pas de réseau au moment de la demande
- **THEN** un message indique que l'avis de l'IA nécessite une connexion

#### Scenario: Réponse inexploitable

- **WHEN** la réponse de l'IA ne contient pas, pour chaque jour demandé, une note entière de 0 à 10 et un commentaire
- **THEN** un message indique que la réponse n'a pas pu être lue et invite à réessayer
- **AND** aucun avis n'est enregistré ni modifié

#### Scenario: Avis précédent préservé

- **WHEN** une nouvelle demande échoue pour un jour qui avait déjà un avis
- **THEN** l'ancien avis est toujours consultable
