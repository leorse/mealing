# Proposal

## Why

Les dates du planning sont construites en heure locale puis converties en chaîne via `toISOString()`, qui travaille en UTC. Dès que l'heure locale et l'heure UTC ne tombent pas le même jour, la conversion recule d'une journée.

En France, entre minuit et 2 h du matin, le lundi de la semaine en cours est calculé comme le dimanche précédent. Le planning cherche alors un plan de semaine qui n'existe pas et affiche une grille entièrement vide, alors que les repas sont bien en base. Le décalage se propage à la navigation : les flèches sautent de sept jours depuis une base fausse, si bien qu'aucune semaine ne peut plus afficher quoi que ce soit.

Constaté en conditions réelles : l'application cherchait `2026-09-27` alors que la base contenait `2026-09-28` et `2026-09-21`, avec huit créneaux intacts.

Le même mécanisme casse en permanence, et pas seulement la nuit, pour tout fuseau à décalage négatif.

## What Changes

- Une date se convertit en chaîne à partir de ses composantes **locales**, sans passer par UTC.
- Une chaîne de date se relit comme une date **locale**, et non comme minuit UTC.
- Le planning ouvre la semaine contenant aujourd'hui, à toute heure du jour et de la nuit, dans n'importe quel fuseau.
- Aucune reprise de données : les plans de semaine déjà enregistrés portent des dates correctes et redeviennent visibles dès la correction.

Pas de changement cassant.

## Capabilities

### New Capabilities

<!-- Aucune : le défaut touche une capacité existante. -->

### Modified Capabilities

- `meal-planning`: la semaine affichée est celle qui contient la date du jour, indépendamment de l'heure et du fuseau.

## Impact

- `src/utils/date.ts` : conversion et lecture des dates en composantes locales.
- `src/store/useUiStore.ts`, `src/components/MealPickerModal.tsx`, `src/screens/planning/WeekPlanScreen.tsx` : les trois endroits qui reconstruisent une `Date` à partir d'une chaîne ISO.
- Aucun changement de schéma ni de données enregistrées.
