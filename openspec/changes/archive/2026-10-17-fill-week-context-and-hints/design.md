# Design

## Context

`buildWeekContext` fournit déjà à `buildFillPrompt` les repas planifiés (nom, calories, écart) de la semaine ; `requestProposals` lit les préférences des Réglages au dernier moment. La composition des plats maison est disponible via `loadReviewDays` (aiReview), déjà utilisée pour l'avis de l'IA. Voir proposal.md pour la motivation.

## Goals / Non-Goals

**Goals:**
- Donner à l'IA assez de matière (ingrédients) et une consigne explicite pour ne pas répéter ce qui est déjà dans la semaine.
- Permettre une consigne ponctuelle sans toucher aux Réglages.

**Non-Goals:**
- Envoyer des repas d'une autre semaine.
- Persister l'option ou le texte (ni Dexie, ni export).
- Vérifier après coup que l'IA a respecté la consigne.

## Decisions

- **État dans `WeekAiModal`** (`useState`) : `includeWeek` (vrai) et `hints` (vide), hors de `selected` ; ils survivent aux allers-retours grille/résultats puisque le composant reste monté, et disparaissent à la fermeture. *Alternative* : stockage dans les Réglages — rejeté, la consigne est ponctuelle.
- **Contexte de semaine** : `buildWeekContext` reçoit `includeWeek`. Activée : tous les jours, chaque repas enrichi des ingrédients obtenus par `loadReviewDays` (appel asynchrone dans `propose`, avant `requestProposals`). Désactivée : seuls les jours avec un créneau retenu, sans ingrédients. *Alternative* : ne rien envoyer du tout — rejeté, l'IA perdrait la charge calorique déjà prévue dans la journée.
- **Prompt** : `describeDay` ajoute les ingrédients quand ils sont présents ; si `includeWeek`, une règle demande de ne reproposer aucun plat ni ingrédient principal déjà présent dans la semaine ni dans ses propres propositions. Les indications forment un bloc distinct des préférences (« Indications pour cette demande, à respecter strictement »), tronquées à 300 caractères côté service aussi.
- **Réutilisation d'UI** : case à cocher et `textarea` avec les classes existantes du formulaire de recette (écran de référence) ; compteur de caractères comme pour les préférences des Réglages.
- **Confidentialité** : les ingrédients sont des noms d'aliments, pas des données personnelles ; la règle « rien de personnel » reste valable. Les indications sont un texte libre envoyé uniquement à la validation, comme les préférences.

## Risks / Trade-offs

- [Prompt plus long, donc plus de crédits] → assumé, signalé à côté de l'option, désactivable.
- [Texte libre contenant des données personnelles] → limité à 300 caractères, avec mention que le texte est transmis à l'IA.
- [Échec du chargement des compositions] → repli sur nom et calories seuls, sans bloquer la demande.
