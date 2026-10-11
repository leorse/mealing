# Proposal

## Why

Remplir une semaine de repas reste un travail manuel, créneau par créneau, alors que l'application sait déjà transformer une description en plat chiffré (capacité `dish-from-text`, analyse par lot). Il manque l'étape d'avant : laisser l'IA proposer les plats des créneaux vides, en tenant compte de l'objectif nutritionnel et des goûts de l'utilisateur.

## What Changes

- **Le bouton IA de l'en-tête de semaine ouvre une fenêtre à deux onglets** au lieu de lancer directement le bilan : « Bilan » (la demande actuelle, inchangée dans son effet) et « Remplir la semaine ». Le bouton devient actif même sur une semaine vide, puisqu'on peut la remplir.
- **Onglet « Remplir la semaine »** : une grille de 7 jours × 3 repas (petit-déjeuner, déjeuner, dîner ; pas la collation). Un créneau vide est vert — l'IA y proposera un plat — et se grise d'un appui pour l'exclure. Un créneau déjà garni est gris et verrouillé.
- **Première validation : l'IA propose un plat par créneau vert** (nom et description avec quantités), d'après l'objectif calorique, les repas déjà planifiés de la semaine et les préférences culinaires. La liste s'affiche ; chaque proposition peut être supprimée.
- **Seconde validation : les plats sont créés et placés au planning**. Les descriptions passent par l'analyse par lot existante (décomposition, recherche Ciqual sur l'appareil, tri), puis chaque plat est enregistré comme plat maison issu de l'IA et ajouté à son créneau, sans étape intermédiaire.
- **Préférences culinaires dans les Réglages** : un texte libre (« pas de champignons, plats simples, pas de fromage râpé… ») enregistré sur l'appareil et joint aux consignes de l'IA lors du remplissage.

Aucun changement cassant pour les données. Changement de geste : le bilan de la semaine demande désormais deux appuis (ouvrir la fenêtre, puis demander).

## Capabilities

### New Capabilities

- `ai-week-fill` : remplissage des créneaux vides d'une semaine par l'IA — choix des créneaux, proposition des plats, relecture, création des plats et ajout au planning, préférences culinaires.

### Modified Capabilities

- `ai-meal-review` : l'exigence « La semaine entière se demande depuis son en-tête » change — l'icône IA de l'en-tête ouvre une fenêtre à onglets d'où le bilan se demande, et n'est plus inactive sur une semaine vide.

## Impact

- **Code** : nouveau composant `WeekAiModal` (onglets, grille, liste des propositions), nouveau service `services/weekFill.ts` (consigne, lecture des propositions, création des plats), [WeekPlanScreen.tsx](../../../src/screens/planning/WeekPlanScreen.tsx) (bouton d'en-tête), [SettingsScreen.tsx](../../../src/screens/settings/SettingsScreen.tsx) et `settingsRepository` (préférences), `planningRepository` (ajout groupé de plats et de créneaux en une transaction).
- **Réutilisé tel quel** : `analyze` de [dishFromText.ts](../../../src/services/dishFromText.ts), le client 1min.AI, le worker d'embedding et `EmbeddingSetup`.
- **Données** : une clé `appMeta` de plus (`foodPreferences`), incluse dans les sauvegardes. Aucune table, aucun index, aucune version de schéma.
- **Réseau** : trois demandes à 1min.AI par remplissage (proposition, décomposition, tri), sur clic. Les préférences culinaires et les noms des repas déjà planifiés de la semaine sont transmis ; jamais le profil.
- **Documentation** : `docs/architecture/domain-rules.md`, `data-model.md`, `docs/design/components.md`, `docs/log.md`.
