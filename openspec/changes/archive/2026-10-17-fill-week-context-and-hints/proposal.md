# Proposal

## Why

Quand l'utilisateur ne demande que les dîners, l'IA lui reproppose parfois le plat déjà prévu ou proposé le midi : elle ne reçoit aujourd'hui que le nom et les calories des repas déjà planifiés, sans leur composition, et rien ne lui demande explicitement de ne pas les répéter. Par ailleurs, les préférences des Réglages sont permanentes : il n'existe aucun moyen de donner une consigne ponctuelle (« pas de riz cette semaine », « sans poisson »).

## What Changes

- Une option « Tenir compte du reste de la semaine », **activée par défaut**, dans l'onglet « Remplir la semaine » : activée, la demande transmet toute la semaine avec la composition (ingrédients) des plats déjà planifiés et demande de ne reproposer aucun plat ni ingrédient principal déjà présent. Elle coûte davantage de crédits, assumé.
- Désactivée, la demande se limite aux jours qui contiennent un créneau retenu (nom et calories, sans composition) et ne porte pas la consigne de non-répétition sur la semaine.
- Une zone de texte « Indications complémentaires » (optionnelle, 300 caractères au plus) dans l'onglet : son contenu est transmis en plus des préférences des Réglages et à respecter strictement.
- Ces deux réglages sont propres à la demande en cours : ils ne sont pas enregistrés.

## Capabilities

### New Capabilities

### Modified Capabilities
- `ai-week-fill`: la transmission de la semaine devient optionnelle et enrichie de la composition des plats ; une consigne ponctuelle peut s'ajouter aux préférences.

## Impact

- `src/components/WeekAiModal.tsx` : option et zone de texte dans la grille, valeurs transmises à la demande.
- `src/services/weekFill.ts` : contexte de semaine (ingrédients, jours limités), `buildFillPrompt` (consigne de non-répétition, indications), `requestProposals`.
- `src/services/aiReview.ts` : `loadReviewDays` réutilisée pour charger les compositions.
- `src/index.css` : éventuellement une classe pour la zone de texte (réutiliser l'existante en priorité).
- `docs/` (domain-rules) et `docs/log.md` ; pas de changement de schéma Dexie.
