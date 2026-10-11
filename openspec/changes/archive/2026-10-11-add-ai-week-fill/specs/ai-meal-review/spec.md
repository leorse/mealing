# Spec Delta

## MODIFIED Requirements

### Requirement: La semaine entière se demande depuis son en-tête

L'en-tête de la semaine SHALL porter une icône IA et une icône commentaire. Un clic sur cette icône IA SHALL ouvrir une fenêtre à onglets, dont l'onglet « Bilan » porte l'action de demande. Cette action SHALL envoyer en une seule demande tous les jours de la semaine qui contiennent des repas, et enregistrer à la réponse une note et un commentaire pour chacun de ces jours, ainsi qu'un bilan de la semaine. La fenêtre SHALL se fermer dès la demande envoyée.

#### Scenario: Ouverture de la fenêtre

- **WHEN** l'utilisateur clique sur l'icône IA de la semaine
- **THEN** une fenêtre s'ouvre avec un onglet « Bilan »
- **AND** aucune demande n'est encore envoyée

#### Scenario: Semaine garnie

- **WHEN** l'utilisateur demande le bilan depuis l'onglet « Bilan », cinq jours de la semaine contenant des repas
- **THEN** ces cinq jours reçoivent chacun leur note et leur commentaire
- **AND** un bilan de la semaine est enregistré

#### Scenario: Jours vides

- **WHEN** la semaine envoyée comporte deux jours sans repas
- **THEN** ces deux jours ne sont pas notés

#### Scenario: Animation de la semaine

- **WHEN** la demande de la semaine est en cours
- **THEN** la fenêtre est fermée
- **AND** l'icône IA de l'en-tête et celles de tous les jours envoyés changent de couleur en boucle

#### Scenario: Semaine vide

- **WHEN** aucun jour de la semaine ne contient de repas
- **THEN** l'icône IA de la semaine reste active et ouvre la fenêtre
- **AND** l'action de demande de l'onglet « Bilan » est inactive, avec la mention qu'il n'y a rien à noter

#### Scenario: Avis de jour remplacés

- **WHEN** l'utilisateur demande la semaine alors que certains jours ont déjà un avis
- **THEN** les avis de tous les jours envoyés sont remplacés par les nouveaux

#### Scenario: Demande déjà en cours

- **WHEN** une demande d'avis est en cours, pour un jour ou pour la semaine
- **THEN** l'icône IA de la semaine est inactive
