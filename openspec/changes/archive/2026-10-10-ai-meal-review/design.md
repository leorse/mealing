# Design

## Context

Voir `proposal.md` — Why. Exigences dans `specs/ai-meal-review/spec.md`. Documentation du service dans `docs/1min.app.md`.

État actuel :

- L'application est un site statique public (Cloudflare Workers, assets seuls), sans backend. Tout ce qui est dans le code ou le bundle est lisible par quiconque ouvre le site.
- `WeekPlanScreen` rend l'en-tête de semaine (`.week-header` : flèche, titre, flèche) et, par jour, `.day-column` > `.day-column-header` (nom du jour, total coloré). Les créneaux viennent de `useWeekSlots(weekStart)` ; chacun porte `mealType`, `freeLabel`, `caloriesOverride`, `isDeviation`, `recipeId`.
- `WeekPlan` (table `weekPlans`, index `weekStart`) n'est créé qu'à la première écriture d'un créneau (`ensureWeek`). `appMeta` (`key` → `value`) ne contient que des clés techniques.
- `SettingsScreen` est une coquille « À venir ».
- Le service 1min.AI : `POST https://api.1min.ai/api/chat-with-ai`, en-tête `API-KEY`, corps `{ type: 'UNIFY_CHAT_WITH_AI', model, promptObject: { prompt } }` ; la réponse non diffusée porte le texte dans `aiRecord.aiRecordDetail.resultObject` (tableau de chaînes). Erreurs 400, 401, 422, 429 au format `{ success: false, error: { code, message } }`.
- Vérifié : le service accepte les appels depuis un navigateur (pré-requête CORS : origine `*`, en-têtes `api-key, content-type` autorisés). Aucun relais serveur n'est nécessaire.
- Icônes fournies : `assets/ia.svg`, `assets/comment-ia.svg`.

## Goals / Non-Goals

**Goals**

- Une clé qui n'apparaît jamais dans le dépôt ni dans le bundle.
- Une réponse de l'IA exploitable de façon sûre : soit lue en entier, soit rejetée.
- Aucune migration Dexie.

**Non-Goals**

- Diffusion progressive de la réponse, conversation suivie, mémoire côté service, recherche web.
- Relais par un Worker.

## Decisions

### La clé est saisie dans les Réglages et reste sur l'appareil

Clé et modèle sont stockés dans `appMeta` (`aiApiKey`, `aiModel`), lus et écrits par un petit `settingsRepository`.

*Pourquoi pas dans le code* : le site est public ; une clé embarquée serait lisible par tous et consommerait le crédit du compte. *Pourquoi pas un relais Worker avec secret* : il cacherait la clé mais exposerait une adresse que n'importe qui pourrait appeler à la place de l'utilisateur, à moins d'y ajouter une authentification — hors de proportion pour une application personnelle sans compte.

*Conséquences* : la clé est à ressaisir sur chaque appareil ; elle est incluse dans une sauvegarde `exportAllData` puisqu'elle vit dans `appMeta` — la sauvegarde l'exclut explicitement. Champ de saisie de type mot de passe ; une fois enregistrée, l'écran n'affiche qu'un état « clé enregistrée » et ses quatre derniers caractères.

### Appel sans diffusion, réponse en JSON strict

`services/aiReview.ts` fait un seul `fetch` sur le point d'accès non diffusé et attend la réponse entière.

*Pourquoi sans diffusion* : il faut l'objet complet pour le valider ; afficher un texte qui s'écrit n'apporte rien à une note.

La consigne impose une réponse faite d'un seul objet JSON :

```json
{ "days": [ { "date": "2026-10-07", "score": 7, "comment": "…" } ], "summary": "…" }
```

`summary` n'est demandé que pour la semaine. La lecture : concaténer `resultObject`, retirer d'éventuelles balises de bloc de code, isoler du premier `{` au dernier `}`, `JSON.parse`, puis valider — chaque date demandée présente une fois, `score` entier de 0 à 10, `comment` chaîne non vide, `summary` non vide pour la semaine. Une seule anomalie rejette toute la réponse.

*Pourquoi tout ou rien* : enregistrer une partie d'une semaine laisserait des jours notés par deux demandes différentes sous un même bilan.

### La demande : consigne fixe, journées en JSON

Le `prompt` unique contient la consigne (rôle de nutritionniste, réponse en français, tutoiement comme le reste de l'application, 2 à 4 phrases par jour, note de 0 à 10, format JSON exact, rien d'autre que le JSON) suivie des données en JSON :

- `objectif` : calories cibles (`computeTargetCalories`), grammes de macronutriments (`computeMacroTargets`), but (`perte`, `maintien`, `prise`) ;
- `jours` : pour chaque jour, sa date, son nom, et ses repas par créneau — nom, kcal, `ecart: true` le cas échéant, et pour un plat maison la liste `ingrédient — grammes`.

Les ingrédients sont chargés par lots (`getIngredientsForRecipes`, `getByIds`), comme pour la liste de courses.

*Pourquoi les ingrédients* : « Bolognaise, 650 kcal » ne dit rien de l'équilibre ; la composition le dit. *Ce qui n'est pas transmis* : prénom, date de naissance, sexe, poids, taille — l'objectif calorique en est déjà le résumé utile.

La construction de la demande et la lecture de la réponse sont des fonctions pures, séparées du `fetch`, pour être vérifiables sans réseau.

### Les avis vivent sur la semaine, sans nouvelle table

`WeekPlan` reçoit deux champs optionnels non indexés :

- `aiReviews?: Record<string, { score: number; comment: string; reviewedAt: string; signature: string }>`, par date ;
- `aiSummary?: { text: string; reviewedAt: string }`.

*Pourquoi sur `WeekPlan`* : pas de table à créer, donc pas de `db.version(2)` ; les avis se chargent avec la semaine et suivent le changement de semaine. Une demande n'est possible que sur un jour garni, donc la semaine existe déjà en base.

*Alternative écartée* : la table `dailyLogs`, prévue pour le journal de consommation — autre sujet, et son usage futur resterait à démêler.

Un hook `useWeekPlan(weekStart)` (lecture seule, `getWeek`) fournit avis et bilan à l'écran.

### « Dépassé » se déduit d'une signature de la journée

La signature d'un jour est une chaîne calculée sur ses créneaux triés : créneau, nom, calories, écart, identifiant du plat. Elle est enregistrée avec l'avis ; à l'affichage, l'avis est à jour si la signature courante est identique.

*Pourquoi une signature plutôt qu'un marquage à chaque écriture* : ajout, modification et suppression de repas passent par plusieurs fonctions ; une comparaison à la lecture ne peut pas en oublier une, et rouvrir un repas sans le changer ne dépasse rien. La modification des ingrédients d'un plat ne change pas la signature : limite acceptée.

### Onze teintes par classe, du rouge au vert

`.day-column--score-0` … `--score-10` : fond `color-mix(in srgb, <teinte> 16%, transparent)`, où `<teinte>` va de `#e74c3c` à `#2ecc71` en passant par `#f39c12` à mi-parcours, par `color-mix` entre ces trois couleurs. La bordure de la colonne prend la teinte à 45 %.

*Pourquoi des classes et non un style en ligne* : règle du projet (pas de `style` dans le JSX). *Pourquoi passer par l'orange* : un mélange direct rouge-vert donne un brun terne ; les trois couleurs sémantiques existantes donnent un dégradé lisible sans introduire de nouvelle couleur. *Pourquoi 16 %* : la teinte se lit sur fond clair comme sombre sans gêner le texte, comme les fonds atténués existants.

Le total de calories du jour garde sa propre couleur (dans l'objectif, au-dessous, au-dessus) : deux informations distinctes.

### Icônes : deux boutons dans l'en-tête, animation par classe

`ia.svg` et `comment-ia.svg` sont copiées dans `public/icons/common/` et rendues par `MaskIcon` en `currentColor`, dans des `.icon-button` compacts placés à droite du nom du jour ; mêmes boutons dans `.week-header`, à côté du titre.

- En cours : classe `.ai-button.loading`, animation `@keyframes` faisant tourner la couleur entre vert, orange et rouge ; sous `prefers-reduced-motion`, couleur fixe verte. Le bouton est `disabled` pendant la requête et porte `aria-busy`.
- Commentaire : `disabled` et opacité réduite sans avis ; couleur du texte avec avis.

L'état « en cours » est local à l'écran : l'ensemble des dates en attente, plus un drapeau pour la semaine. Une seule requête à la fois par cible ; une demande de semaine en cours rend inactives les icônes des jours envoyés.

### Une fenêtre unique pour lire un avis ou une erreur

`AiReviewModal` (`.modal-overlay` > `.modal-card`) : titre (jour ou « Bilan de la semaine »), note en grand sur 10, commentaire, mention « La journée a changé depuis cet avis » si dépassé ; pour la semaine, le bilan puis la liste des jours avec leur note. Un seul bouton « Fermer », fermeture par Échap.

La même fenêtre affiche les messages d'échec, avec un lien vers les Réglages quand la clé est en cause.

### Les Réglages : une section, la coquille disparaît

`SettingsScreen` devient un formulaire `.screen` : titre, puis un `fieldset.ingredient-picker` « Avis de l'IA » avec la clé (champ mot de passe), le modèle (`select`), une phrase disant ce qui est transmis et à qui, et un bouton principal « Enregistrer ». Un bouton secondaire efface la clé.

Liste de modèles : une sélection courte tirée de la documentation, en constante — par défaut `gpt-4o-mini`, puis quelques modèles plus capables. Le modèle est une simple chaîne envoyée telle quelle : la liste se complète sans autre changement.

## Risks / Trade-offs

- **Clé lisible sur l'appareil** (IndexedDB en clair) → inhérent à une application sans serveur ; la clé ne quitte l'appareil que vers 1min.AI, et n'est pas dans les sauvegardes.
- **Réponse non conforme d'un modèle** → rejet complet et message ; la consigne exige le JSON seul, et la lecture tolère les balises de code et le texte autour.
- **Coût et délai** d'une demande de semaine → une seule requête pour les sept jours plutôt que sept.
- **Avis d'une IA pris pour un avis médical** → la fenêtre porte une mention courte : avis indicatif, ne remplace pas un professionnel de santé.
- **Service indisponible ou modifié** → l'appel est isolé dans `services/aiReview.ts` ; le reste de l'application n'en dépend pas.
- **Principe « local-first » entamé** → envoi sur clic explicite seulement, données minimales, et la règle du projet est réécrite pour nommer cette exception.
- **Clé présente dans `docs/1min.app.md`** → à remplacer par un texte neutre avant tout commit, et à révoquer si elle est réelle.
