# Tasks

## 1. Service de remplissage

- [x] 1.1 `buildWeekContext` (weekFill.ts) : paramètre `includeWeek` ; désactivé, ne garde que les jours avec créneau retenu. Vérifier par `npm run build` et relecture du contexte pour une semaine type.
- [x] 1.2 Charger les ingrédients des plats planifiés (via `loadReviewDays`) et les ajouter au contexte quand `includeWeek` ; repli sans ingrédients en cas d'erreur. Vérifier qu'un plat maison du lundi expose ses ingrédients dans le prompt.
- [x] 1.3 `buildFillPrompt` : ingrédients dans `describeDay`, règle de non-répétition si `includeWeek`, bloc « Indications pour cette demande » si non vide, 300 caractères max. Vérifier le prompt avec option activée/désactivée et indications vides/remplies.
- [x] 1.4 `requestProposals` : accepter `hints` et `includeWeek` et les transmettre. Vérifier `npm run lint` et `npm run build`.

## 2. Interface

- [x] 2.1 `WeekAiModal` : états `includeWeek` (vrai) et `hints`, passés à `propose` ; case à cocher avec mention du coût en crédits. Vérifier dans l'app : activée à chaque ouverture, rien d'envoyé au basculement.
- [x] 2.2 Zone de texte « Indications complémentaires » (300 car., exemple, compteur), classes CSS existantes, clair et sombre. Vérifier l'affichage dans les deux thèmes et la conservation du texte entre deux demandes.
- [x] 2.3 Mettre à jour `docs/architecture/domain-rules.md` (contenu de la demande de remplissage) et `docs/log.md`, puis `npm run lint` et `npm run build`.
