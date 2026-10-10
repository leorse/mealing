---
type: Log
title: Journal de la base de connaissance
description: Historique chronologique des évolutions de la base de connaissance Mealing.
tags: [log]
timestamp: 2026-10-04T00:00:00Z
---
# Journal

Une ligne par changement, la plus récente en haut.

- **2026-10-10** — Vecteurs Ciqual : `ciqual-vectors.bin` sorti de git et recalculé par `seed:ciqual` quand il manque, à version constante ; seul `ciqual-index.json` est versionné.
- **2026-10-10** — Origine des plats : `Recipe.sourceText`, icône `ia` dans la liste des plats, description d'origine au détail ; verrou anti double clic de l'écran « Décrire un plat ».
- **2026-10-10** — Plat décrit en texte libre : `services/dishFromText.ts` (analyse par lot), `services/aiClient.ts` (client 1min.AI partagé), route `/recipes/describe`, `DishFromTextScreen`, `CandidatePickerModal`, `RecipeIngredient.isEstimated`, `isHealthyFromItems`, classes `.fab--second`, `.badge--warn`, `.dish-line`.
- **2026-10-10** — Recherche intelligente sur l'appareil : dépendance `@huggingface/transformers` 4.3.1, worker d'embedding, `services/embedding/`, scripts `embed:ciqual` et `copy:ort`, contrôle d'empreinte dans `convert-ciqual.mjs`, `addMissingCiqual`, `EmbeddingSetup`, section des Réglages, classe `.progress-bar`, règle 9 de CLAUDE.md (trois origines). Moteur ONNX : variante `ort-wasm-simd-threaded` (13,6 Mio) servie depuis `/ort/` ; les variantes `asyncify` (25,6 Mio), `jsep` (27,0 Mio) et `jspi` (16,0 Mio) ne sont pas livrées, les deux premières dépassant les 25 Mio par fichier de Cloudflare.
- **2026-10-08** — Ingrédient libre : aliments personnels (`listCustom`, `create`, `update`), `lacksNutrition` et brouillon `Per100gDraft` dans `services/nutrition.ts`, composants `NutritionFields` et `IngredientNutritionModal`, classes `.picker-free`, `.nutrition-fields`.
- **2026-10-06** — Avis de l'IA : règle réseau de CLAUDE.md réécrite, `services/aiReview.ts`, `settingsRepository`, `WeekPlan.aiReviews`, `AiReviewModal`, écran Réglages, icônes `ia` / `comment-ia`, classes `.ai-button`, `.day-column--score-*`.
- **2026-10-06** — Saisie à l'unité : `unitCount`, `setPortion`, `ensureCiqualPortions`, `services/portions.ts`, classes `.quantity-note`, `.picker-unit`, `.picker-unit-editor`.
- **2026-10-06** — Portions estimées : colonnes `portion_g` / `portion_label` dans `ciqual.sql`, champs `portionG` / `portionLabel` sur `Ingredient`.
- **2026-10-05** — Recherche d'ingrédient : règles de classement dans domain-rules, `services/ingredientSearch.ts`.
- **2026-10-05** — Plats favoris et vocabulaire : « plat » à l'écran (règle dans conventions), `Recipe.isFavorite`, `setFavorite`, composant `FavoriteButton`, icônes `heart` / `heart-filled`, classe `.picker-result-row`.
- **2026-10-04** — Liste de courses : règles métier, champ `shoppingItemStates`, nouvelles fonctions du repository de planning, classes `.shopping-*`, `.shop-toggle`, `.button-primary--danger`, icône `chevron`.
- **2026-10-04** — Création du bundle : architecture, design (fondé sur l'écran de création de recette), workflow (graft, commandes, conventions).
