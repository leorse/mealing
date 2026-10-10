# on-device-food-embedding Specification

## Purpose

Permet de retrouver, sur l'appareil et sans serveur, les aliments Ciqual les plus proches d'un texte libre, grâce à un modèle d'embeddings téléchargé une fois et à des vecteurs Ciqual précalculés livrés avec l'application.

## Requirements

### Requirement: Les vecteurs Ciqual sont précalculés sur le poste de développement

Un outil de préparation SHALL vectoriser chaque aliment de la base Ciqual à partir de son nom et de sa catégorie, et produire deux fichiers livrés avec l'application : les vecteurs, un octet signé par dimension, et un manifeste. L'appareil NE SHALL PAS vectoriser la base Ciqual lui-même.

#### Scenario: Préparation complète

- **WHEN** le développeur lance la préparation sur une base de 3 281 aliments
- **THEN** le fichier de vecteurs contient 3 281 vecteurs de même dimension
- **AND** le manifeste liste 3 281 identifiants d'aliments

#### Scenario: Texte vectorisé

- **WHEN** l'aliment « Merguez, crue » de la catégorie « Viandes & Poissons » est vectorisé
- **THEN** le texte soumis au modèle contient son nom et sa catégorie, précédés du préfixe de requête du modèle

#### Scenario: Aucun calcul de la base sur l'appareil

- **WHEN** l'application prépare la recherche sémantique sur un appareil
- **THEN** elle charge les vecteurs livrés et ne vectorise aucun aliment Ciqual

### Requirement: Le manifeste décrit les vecteurs sans ambiguïté

Le manifeste SHALL porter un numéro de version entier, l'empreinte de la base Ciqual dont il est issu, l'identifiant du modèle, sa quantification, le préfixe utilisé, la dimension des vecteurs, leur nombre, et la liste des identifiants d'aliments dans l'ordre exact des vecteurs.

#### Scenario: Correspondance par position

- **WHEN** l'application lit le vecteur de rang 42
- **THEN** l'aliment correspondant est celui de rang 42 dans la liste du manifeste

#### Scenario: Fichier de vecteurs tronqué

- **WHEN** la taille du fichier de vecteurs ne vaut pas le nombre d'aliments multiplié par la dimension annoncés
- **THEN** la recherche sémantique est déclarée indisponible
- **AND** aucun résultat n'est renvoyé

### Requirement: La version augmente à chaque modification de la base

Relancer la préparation après une modification de la base Ciqual SHALL produire un manifeste dont le numéro de version est supérieur au précédent. Relancer la préparation sur une base inchangée NE SHALL PAS changer le numéro de version.

#### Scenario: Base modifiée

- **WHEN** un aliment est ajouté à la base puis que la préparation est relancée, le manifeste précédent étant en version 3
- **THEN** le nouveau manifeste est en version 4

#### Scenario: Base inchangée

- **WHEN** la préparation est relancée sans que la base ait changé
- **THEN** le numéro de version reste le même

### Requirement: La base et les vecteurs livrés sont toujours synchronisés

La construction de l'application SHALL échouer lorsque l'empreinte de la base Ciqual courante diffère de celle inscrite au manifeste, avec un message indiquant de relancer la préparation des vecteurs.

#### Scenario: Base modifiée sans nouvelle préparation

- **WHEN** la base Ciqual a été modifiée et que les vecteurs n'ont pas été recalculés
- **THEN** la construction s'arrête en erreur
- **AND** le message nomme la commande de préparation à relancer

#### Scenario: Base et vecteurs alignés

- **WHEN** les vecteurs ont été recalculés après la dernière modification de la base
- **THEN** la construction se poursuit normalement

### Requirement: Requêtes et base utilisent le même modèle

Les textes de recherche SHALL être vectorisés sur l'appareil avec le modèle, la quantification et le préfixe inscrits au manifeste. L'application NE SHALL PAS comparer une requête à des vecteurs produits avec un autre modèle, une autre quantification ou un autre préfixe.

#### Scenario: Modèle lu dans le manifeste

- **WHEN** l'application prépare la recherche sémantique
- **THEN** le modèle qu'elle charge est celui que nomme le manifeste, dans la quantification qu'il indique

#### Scenario: Modèle en cache différent

- **WHEN** le manifeste nomme un modèle ou une quantification différents de ceux déjà présents sur l'appareil
- **THEN** l'ancien modèle n'est pas utilisé
- **AND** le téléchargement du nouveau modèle est proposé

### Requirement: Le modèle se télécharge depuis Hugging Face, à la demande de l'utilisateur

Le modèle d'embeddings SHALL être téléchargé directement par l'appareil depuis Hugging Face, et NE SHALL PAS figurer dans les fichiers servis par l'application. Le téléchargement NE SHALL démarrer qu'après une action explicite de l'utilisateur, la taille approximative lui ayant été annoncée.

#### Scenario: Première utilisation

- **WHEN** l'utilisateur ouvre pour la première fois une fonction qui a besoin de la recherche sémantique
- **THEN** un écran de préparation annonce un téléchargement d'environ 120 Mo et propose de le lancer
- **AND** rien n'est téléchargé avant son accord

#### Scenario: Lancement de l'application

- **WHEN** l'utilisateur lance l'application sans ouvrir de fonction de recherche sémantique
- **THEN** le modèle n'est pas téléchargé

#### Scenario: Refus

- **WHEN** l'utilisateur quitte l'écran de préparation sans lancer le téléchargement
- **THEN** le reste de l'application fonctionne comme avant

### Requirement: Le téléchargement affiche sa progression

Pendant la préparation, l'application SHALL afficher une barre de progression reflétant les octets reçus sur le total attendu, ainsi que l'étape en cours. La barre SHALL rester accessible aux lecteurs d'écran.

#### Scenario: Téléchargement en cours

- **WHEN** 60 Mo ont été reçus sur environ 120 Mo
- **THEN** la barre est remplie à moitié
- **AND** l'écran indique les quantités reçue et totale

#### Scenario: Initialisation après téléchargement

- **WHEN** tous les fichiers sont reçus et que le modèle se charge en mémoire
- **THEN** l'écran indique que la préparation se termine, sans laisser croire à un blocage

#### Scenario: Lecteur d'écran

- **WHEN** un lecteur d'écran parcourt l'écran de préparation
- **THEN** il annonce une barre de progression et sa valeur

### Requirement: Le modèle et les vecteurs sont conservés sur l'appareil

Une fois téléchargés, le modèle et les vecteurs SHALL être conservés sur l'appareil et réutilisés sans nouveau téléchargement. L'application SHALL demander au système un stockage persistant au moment du téléchargement ; un refus NE SHALL PAS bloquer la fonction.

#### Scenario: Deuxième utilisation

- **WHEN** l'utilisateur rouvre la fonction après un premier téléchargement réussi
- **THEN** aucun écran de téléchargement n'apparaît
- **AND** la recherche est disponible après le seul chargement en mémoire

#### Scenario: Stockage persistant refusé

- **WHEN** le système refuse le stockage persistant
- **THEN** le téléchargement se poursuit et la recherche fonctionne

#### Scenario: Cache vidé par le système

- **WHEN** le système a effacé le modèle entre deux utilisations
- **THEN** l'écran de préparation réapparaît et propose de le télécharger de nouveau

### Requirement: La recherche sémantique fonctionne hors ligne

Dès lors que le modèle et les vecteurs sont présents sur l'appareil, la recherche sémantique SHALL fonctionner sans connexion.

#### Scenario: Recherche sans réseau

- **WHEN** l'appareil est hors ligne et que le modèle a déjà été téléchargé
- **THEN** une recherche sémantique renvoie ses candidats normalement

#### Scenario: Premier téléchargement sans réseau

- **WHEN** l'appareil est hors ligne et que le modèle n'a jamais été téléchargé
- **THEN** l'écran de préparation indique qu'une connexion est nécessaire

### Requirement: Un échec de préparation s'explique et se reprend

Lorsque le téléchargement ou le chargement du modèle échoue, l'application SHALL afficher un message disant pourquoi et proposer de réessayer. Une reprise NE SHALL PAS retélécharger les fichiers déjà reçus en entier. Les cas distingués SHALL être : absence de réseau, espace de stockage insuffisant, et appareil incapable d'exécuter le modèle.

#### Scenario: Coupure pendant le téléchargement

- **WHEN** le réseau est coupé à mi-téléchargement
- **THEN** un message indique que le téléchargement a été interrompu et propose de réessayer

#### Scenario: Reprise

- **WHEN** l'utilisateur réessaie après une coupure, deux fichiers sur quatre ayant été reçus en entier
- **THEN** seuls les fichiers manquants sont téléchargés

#### Scenario: Espace insuffisant

- **WHEN** l'appareil n'a pas la place de stocker le modèle
- **THEN** un message indique l'espace nécessaire

#### Scenario: Appareil incompatible

- **WHEN** l'appareil ne peut pas exécuter le modèle
- **THEN** un message indique que la recherche intelligente n'est pas disponible sur cet appareil
- **AND** le reste de l'application reste utilisable

### Requirement: Une recherche renvoie les aliments les plus proches, classés

Pour un texte de recherche, la recherche sémantique SHALL renvoyer les aliments Ciqual dont le vecteur est le plus proche de celui du texte, du plus proche au plus éloigné, avec leur score de proximité, dans la limite du nombre demandé (dix par défaut). Plusieurs textes SHALL pouvoir être soumis en une seule demande, chacun recevant sa propre liste.

#### Scenario: Recherche d'un ingrédient

- **WHEN** le texte « merguez grillée » est recherché
- **THEN** dix aliments sont renvoyés, classés par proximité décroissante
- **AND** des fiches de merguez figurent parmi les premiers

#### Scenario: Plusieurs textes

- **WHEN** quatre textes de recherche sont soumis ensemble
- **THEN** quatre listes de dix candidats sont renvoyées, dans l'ordre des textes

#### Scenario: Texte vide

- **WHEN** un texte de recherche est vide ou ne contient que des espaces
- **THEN** sa liste de candidats est vide

#### Scenario: Aliments personnels

- **WHEN** une recherche sémantique est effectuée
- **THEN** seuls des aliments Ciqual sont renvoyés, jamais un aliment personnel ni un aliment importé

### Requirement: Le calcul ne bloque pas l'interface

La vectorisation des requêtes et la comparaison aux vecteurs Ciqual SHALL s'exécuter hors du fil d'interface : pendant une recherche, l'application SHALL rester réactive au défilement et aux appuis.

#### Scenario: Recherche en cours

- **WHEN** une recherche sémantique de dix textes est en cours
- **THEN** l'utilisateur peut faire défiler l'écran et annuler

#### Scenario: Écran quitté

- **WHEN** l'utilisateur quitte l'écran pendant une recherche
- **THEN** le calcul est abandonné et son résultat n'est pas utilisé

### Requirement: Les candidats existent toujours dans la base de l'appareil

Lorsque le manifeste livré est d'une version plus récente que celle enregistrée sur l'appareil, l'application SHALL ajouter à la base de l'appareil les aliments Ciqual qui lui manquent avant de renvoyer des candidats, sans modifier les aliments déjà présents. Un candidat introuvable dans la base de l'appareil NE SHALL PAS être renvoyé.

#### Scenario: Nouvelle version de la base

- **WHEN** l'application livrée contient douze aliments Ciqual de plus que la base de l'appareil
- **THEN** ces douze aliments sont ajoutés à la base de l'appareil
- **AND** ils peuvent être renvoyés comme candidats

#### Scenario: Aliments existants préservés

- **WHEN** des aliments manquants sont ajoutés
- **THEN** une portion corrigée par l'utilisateur sur un aliment existant est inchangée

#### Scenario: Aliment introuvable

- **WHEN** un vecteur désigne un aliment absent de la base de l'appareil
- **THEN** cet aliment ne figure pas dans les candidats

### Requirement: L'état de la recherche intelligente se gère dans les Réglages

L'écran Réglages SHALL indiquer si le modèle est présent sur l'appareil, la place qu'il occupe, et permettre de le télécharger ou de le supprimer. La suppression SHALL libérer la place du modèle sans toucher aux aliments, aux plats ni au planning.

#### Scenario: Modèle absent

- **WHEN** l'utilisateur ouvre les Réglages sans avoir téléchargé le modèle
- **THEN** la section indique que la recherche intelligente n'est pas installée et propose de la télécharger

#### Scenario: Modèle présent

- **WHEN** le modèle est sur l'appareil
- **THEN** la section indique sa taille et propose de le supprimer

#### Scenario: Suppression

- **WHEN** l'utilisateur supprime le modèle après confirmation
- **THEN** la place est libérée
- **AND** les plats, les aliments et le planning sont inchangés

### Requirement: Aucune donnée de l'utilisateur n'est envoyée pour la recherche sémantique

La recherche sémantique NE SHALL transmettre aucun texte de recherche, aucun aliment ni aucune donnée de l'utilisateur à un service distant. Les seuls échanges réseau SHALL être le téléchargement du modèle depuis Hugging Face et celui des fichiers statiques de l'application.

#### Scenario: Recherche

- **WHEN** une recherche sémantique est effectuée
- **THEN** aucune requête réseau ne contient le texte recherché

#### Scenario: Aucun service de l'application

- **WHEN** l'application est déployée
- **THEN** son hébergement ne sert que des fichiers statiques, sans base de données ni traitement côté serveur
