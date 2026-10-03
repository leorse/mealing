# Proposal

## Why

Supprimer une entrée du planning se fait aujourd'hui en un clic, sans filet. Dans une grille de sept colonnes où chaque entrée porte désormais trois commandes rapprochées, un appui malencontreux efface un repas sans prévenir et sans retour en arrière possible.

Le risque avait été noté lors de la mise en place de la suppression, avec deux remèdes envisagés : agrandir la cible, ou passer par une fenêtre de confirmation. Un appui maintenu en est un troisième, meilleur ici : il ne coûte aucune surface dans une grille déjà dense, n'ajoute pas de fenêtre par-dessus une page qui en ouvre déjà une, et rend le geste volontaire sans le rendre pénible.

## What Changes

- La suppression d'une entrée du planning demande un **appui maintenu** et non plus un clic.
- Pendant l'appui, le disque de l'icône **se remplit progressivement**, montrant la progression vers la suppression.
- Relâcher avant la fin **annule** : rien n'est supprimé et le disque revient à son état initial.
- La suppression ne s'effectue qu'une fois le remplissage terminé.
- **BREAKING** du point de vue de l'usage : un simple clic sur l'icône de suppression ne supprime plus rien.

## Capabilities

### New Capabilities

<!-- Aucune : le geste de suppression appartient déjà à la capacité de planning. -->

### Modified Capabilities

- `meal-planning`: la suppression d'une entrée passe d'un clic à un appui maintenu, avec retour visuel de progression.

## Impact

- `src/screens/planning/WeekPlanScreen.tsx` : gestion de l'appui, de son annulation et du déclenchement.
- `src/index.css` : animation de remplissage du disque de suppression.
- `src/db/repositories/planningRepository.ts` : `deleteSlot` inchangé, seul son déclencheur change.
- Aucun impact sur les données : rien n'est ajouté au schéma.
- Non concernées : la pastille de courses et la zone de modification, qui restent sur un clic simple — elles sont réversibles, la suppression ne l'est pas.
