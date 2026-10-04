---
type: Convention
title: Conventions de code
description: Style TypeScript et React, nommage, commentaires et textes d'interface à respecter dans Mealing.
resource: ../../src
tags: [workflow, conventions, typescript, react]
timestamp: 2026-10-04T00:00:00Z
---
# Conventions de code

## Langue

- **Identifiants en anglais** (`addIngredient`, `quantityG`, `isHealthy`).
- **Textes d'interface et commentaires en français**, typographie française : `…`, `«  »`, espace avant `?` et `:`.
- **Valeurs d'énumération en majuscules anglaises** (`'RECIPE'`, `'EASY'`, `'LUNCH'`), traduites à l'affichage par une table locale (`DIFFICULTY_LABELS`, `MEAL_TYPES`).

## Fichiers et nommage

| Élément | Règle | Exemple |
|---|---|---|
| Écran | `src/screens/<domaine>/<Nom>Screen.tsx`, export par défaut | `RecipeFormScreen.tsx` |
| Composant partagé | `src/components/<Nom>.tsx`, export par défaut | `MaskIcon.tsx` |
| Hook | `src/hooks/use<Nom>.ts`, export nommé | `useWeekSlots.ts` |
| Repository | `src/db/repositories/<agrégat>Repository.ts`, fonctions nommées | `recipeRepository.ts` |
| Service | `src/services/<sujet>.ts`, fonctions nommées | `nutrition.ts` |
| Unité dans un nom | Suffixe explicite | `quantityG`, `prepTimeMin`, `calories100g`, `heightCm` |
| Booléen | Préfixe `is` / `can` | `isEdit`, `isPickerOpen`, `canConfirm` |
| Constante de module | `MAJUSCULES_SOULIGNÉES` | `HOLD_MS`, `MIN_QUERY_LENGTH` |

## TypeScript

- Les types du domaine viennent de `db/schema.ts`. Dériver plutôt que redéclarer : `Recipe['kind']`, `NonNullable<Recipe['difficulty']>`, `Omit<Ingredient, 'id' | 'createdAt'>`.
- Props d'un composant : interface `<Nom>Props` juste au-dessus, ou type en ligne pour un petit composant local.
- Les `id` sont optionnels dans les interfaces (absents avant insertion) : `entité.id!` après lecture en base.
- Pas de `any`. Garde de type pour filtrer les `null` : `.filter((d): d is X => d !== null)`.

## React

- Composants fonction, `function` nommée, pas de classe.
- État local par `useState` ; état partagé entre écrans dans `useUiStore` ; données par `useLiveQuery`. Pas de contexte React, pas de cache de requêtes.
- Les gestionnaires sont des fonctions nommées dans le composant (`handleSubmit`, `addIngredient`, `confirmDelete`).
- Classes conditionnelles par gabarit : ``className={`picker-result ${isSelected ? 'selected' : ''}`}``.
- Effets : seulement pour un effet de bord réel (chargement, focus, écouteur clavier), avec nettoyage ou drapeau `cancelled` pour une requête asynchrone. Un état à remettre à zéro sur changement de prop s'ajuste **pendant le rendu** (voir `IngredientPickerModal`).
- `react/rules-of-hooks` est en erreur ; un fichier de composant n'exporte que des composants (constantes tolérées).

## Données

- Aucun import de `db` hors de `src/db/` et `services/backup.ts`.
- Une fonction lue par `useLiveQuery` n'écrit pas.
- Identifiant : `crypto.randomUUID()` dans le repository. Horodatage : `new Date().toISOString()`. Jour civil : `utils/date.ts`.
- Les calculs nutritionnels passent par `services/nutrition.ts`.

## Commentaires

Peu nombreux, en français, et uniquement pour dire **pourquoi** : une contrainte, un piège évité, un choix non évident. Voir les commentaires de `utils/date.ts`, `HoldToDeleteButton.tsx` et `index.css` pour le ton. Pas de commentaire qui paraphrase le code. Un `/** … */` d'une ligne au-dessus d'une fonction exportée dont le rôle n'est pas évident.

## Dépendances

Ne pas ajouter de dépendance sans demande. Pour les besoins à venir, celles déjà installées sont à employer : `recharts` (graphiques), `pdf-lib` (PDF), `@zxing/browser` (code-barres), `framer-motion` (animations), `date-fns` (formatage des dates).
