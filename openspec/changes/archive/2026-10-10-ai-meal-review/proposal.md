# Proposal

## Why

Le planning dit combien de calories contient une journée, pas si elle est équilibrée. Juger la qualité d'une journée ou d'une semaine — variété, excès, manques — demande un regard de nutritionniste que l'application n'a pas.

Une IA peut donner ce regard à la demande : une note et un commentaire par journée, et un bilan de la semaine.

## What Changes

- Au planning, chaque jour porte, à côté de son nom (« mer. 7 »), deux icônes :
  - une **icône IA** qui demande l'avis de l'IA sur cette journée ;
  - une **icône commentaire** qui ouvre l'avis reçu. Elle est **grisée** tant qu'il n'y a pas d'avis, **noire** dès qu'il y en a un.
- L'en-tête de la semaine porte les deux mêmes icônes, pour **toute la semaine** : l'IA note alors chaque jour garni et rédige un **bilan de la semaine**.
- L'IA reçoit la consigne de se comporter en nutritionniste et rend, **pour chaque jour, une note de 0 à 10 et un commentaire**. Qu'on demande une journée ou la semaine, la note est toujours par jour.
- Le **fond de la journée** prend une teinte allant du **rouge (0) au vert (10)** selon sa note.
- Pendant la requête, l'icône IA concernée **change de couleur en boucle** jusqu'à la réponse ; pour la semaine, celle de l'en-tête et celles de tous les jours envoyés.
- Les avis sont **conservés** et retrouvés au rechargement. Si les repas d'un jour changent après coup, son avis est signalé comme **dépassé** et sa teinte s'efface, jusqu'à une nouvelle demande.
- Les **Réglages** reçoivent une section « Avis de l'IA » : la clé d'accès 1min.AI et le modèle utilisé.
- Sans clé, ou en cas d'échec (clé refusée, quota, réseau, réponse illisible), un message explique quoi faire ; aucun avis existant n'est perdu.

**Changement de principe** : jusqu'ici aucune donnée ne quittait l'appareil, hors recherche Open Food Facts. Cette fonction envoie à 1min.AI, **uniquement sur demande explicite**, le contenu des journées concernées et l'objectif nutritionnel — jamais le prénom, la date de naissance, le poids ni la taille.

## Capabilities

### New Capabilities

- `ai-meal-review`: avis d'une IA nutritionniste sur les journées et la semaine du planning — demande, note, commentaire, teinte, conservation, réglages et données transmises.

### Modified Capabilities

<!-- Aucune : les exigences existantes de `meal-planning` restent vraies ; les icônes et la teinte sont décrites par la nouvelle capacité. -->

## Impact

- `src/services/aiReview.ts` (nouveau) : construction de la demande, appel de l'API 1min.AI (`POST https://api.1min.ai/api/chat-with-ai`, sans streaming), lecture et validation de la réponse.
- `src/db/schema.ts` : champs optionnels non indexés sur `WeekPlan` pour les avis. Aucune migration Dexie.
- `src/db/repositories/planningRepository.ts` : enregistrement des avis ; un repository de réglages pour la clé et le modèle (table `appMeta`).
- `src/screens/planning/WeekPlanScreen.tsx` : icônes, animation, teinte, fenêtre de commentaire.
- `src/components/` : fenêtre d'affichage d'un avis.
- `src/screens/settings/SettingsScreen.tsx` : remplace la coquille « À venir » par la section « Avis de l'IA ».
- `public/icons/common/` : `ia.svg` et `comment-ia.svg` (fournies dans `assets/`).
- `src/index.css` : icônes d'en-tête de jour, animation, onze teintes de note.
- `CLAUDE.md` et `docs/` : la règle « aucune donnée ne quitte l'appareil » gagne cette exception explicite ; routes, modèle, composants, icônes, journal.
- `docs/1min.app.md` : contient une clé d'API dans ses exemples ; à remplacer par un texte neutre avant tout commit.
- Hors périmètre : conversation suivie avec l'IA, recherche web, avis sur un plat isolé, clé embarquée dans l'application ou relais par un serveur.
