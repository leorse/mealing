---
type: Architecture
title: Vue d'ensemble de l'architecture
description: Pile technique, couches du code et sens des dépendances de la PWA Mealing.
resource: ../../src
tags: [architecture, pwa, react, dexie]
timestamp: 2026-10-04T00:00:00Z
---
# Vue d'ensemble

## Principe

PWA **local-first** : tout tourne dans le navigateur, les données restent dans IndexedDB, il n'y a ni backend ni compte. Le site est un ensemble de fichiers statiques servi par Cloudflare Workers.

## Pile technique

| Rôle | Outil |
|---|---|
| Interface | React 19, TypeScript 6, Vite 8 |
| Navigation | react-router-dom 7 (`createBrowserRouter`) |
| Données | Dexie 4 (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`) |
| État d'interface | Zustand 5 |
| Dates | date-fns 4 (locale `fr`) + [utils/date.ts](../../src/utils/date.ts) |
| PWA | vite-plugin-pwa (Workbox, `autoUpdate`) |
| Qualité | oxlint, `tsc -b` |
| Déploiement | Wrangler → Cloudflare Workers (assets statiques, repli SPA) |

Installés pour les écrans à venir, pas encore importés : `recharts` (graphiques), `pdf-lib` (export PDF), `@zxing/browser` (scan de code-barres), `framer-motion` (animations).

## Couches

```
src/
├── main.tsx          Démarrage : CSS global, seed Ciqual, rendu de <App>
├── App.tsx           <RouterProvider>
├── app/              Routeur, coquille (AppLayout), garde de profil
├── screens/<domaine>/  Un écran par fichier, export par défaut
├── components/       Composants partagés entre écrans
├── hooks/            Lectures réactives (useProfile, useWeekSlots)
├── store/            État d'interface Zustand (useUiStore)
├── services/         Logique pure et accès externes (nutrition, Open Food Facts, backup, IA)
│   └── embedding/    Client du worker de recherche intelligente, types des messages
├── workers/          embedding.worker.ts : modèle d'embeddings et vecteurs Ciqual, hors du fil d'interface
├── db/               schema.ts (tables + types), seed.ts, repositories/
├── utils/            date.ts
└── index.css         Tout le CSS de l'application
```

## Sens des dépendances

```
screens ─┬─> components ─┐
         ├─> hooks ──────┼─> db/repositories ─> db/schema (Dexie)
         ├─> store       │
         └─> services ───┘   (nutrition : pur, sans accès aux données)
```

- Un écran ou un composant n'importe **jamais** `db` : il passe par un repository. Seuls `db/seed.ts` et `services/backup.ts` manipulent `db` directement, parce qu'ils agissent sur toutes les tables.
- `services/nutrition.ts` est une suite de fonctions pures : on lui passe les données, il ne les charge pas.
- Les types du domaine (`Recipe`, `Ingredient`, `MealSlot`…) viennent tous de [db/schema.ts](../../src/db/schema.ts).

## Cycle d'une donnée

1. **Lecture** : `useLiveQuery(() => repository.fn(), [deps])`. Le composant se rafraîchit seul à chaque écriture dans les tables lues.
2. **Écriture** : un gestionnaire d'événement appelle une fonction de repository (`create`, `update`, `remove`, `addSlotForWeek`…). Aucun état à resynchroniser à la main.
3. **État d'interface** partagé entre écrans (semaine affichée, recherche d'ingrédient) : `useUiStore`. Il n'est pas persistant.

## Démarrage

[main.tsx](../../src/main.tsx) lance `ensureCiqualSeed()` sans l'attendre : au premier lancement, `public/seed/ciqual.json` est chargé dans la table `ingredients`, et une clé `ciqualSeededAt` dans `appMeta` empêche de recommencer. Ce JSON est généré depuis `assets/ciqual.sql` par `scripts/convert-ciqual.mjs`, exécuté automatiquement avant `dev` et `build`.

## Recherche intelligente (embeddings sur l'appareil)

Comportement spécifié dans la capacité OpenSpec `on-device-food-embedding`.

- **Vecteurs Ciqual** : précalculés sur le poste de développement (voir [commands.md](../workflow/commands.md) ; le manifeste est dans git, le binaire est recalculé là où il manque), servis en statique : `public/seed/ciqual-vectors.bin` (int8, `count × dim` octets) et `ciqual-index.json` (version, modèle, préfixe, identifiants dans l'ordre des vecteurs). L'appareil ne vectorise jamais la base.
- **Modèle** : `Xenova/multilingual-e5-small` en q8, téléchargé **depuis Hugging Face par l'appareil**, sur clic, par `@huggingface/transformers`. Il n'est pas dans les fichiers de l'application (trop lourd pour Cloudflare, 25 Mio par fichier).
- **Moteur WebAssembly** d'ONNX : servi par l'application depuis `/ort/` (copié par `scripts/copy-ort.mjs`), jamais depuis un CDN. C'est la variante simple (13,6 Mio) : la variante par défaut de la bibliothèque dépasse 25 Mio, et un greffon de `vite.config.ts` retire du build la copie que Vite embarquerait.
- **Worker** [workers/embedding.worker.ts](../../src/workers/embedding.worker.ts) : détient le modèle et les vecteurs, répond aux messages `status`, `prepare`, `search`, `remove`. Recherche = produit scalaire de la requête contre tous les vecteurs.
- **Client** [services/embedding/embeddingClient.ts](../../src/services/embedding/embeddingClient.ts) : `acquireEmbedding` (un écran consommateur ; le worker s'arrête au dernier retiré, ce qui libère ≈ 120 Mo), `getEmbeddingStatus`, `prepareEmbedding`, `searchFoods`, `removeEmbedding`. `searchFoods` rend des `Ingredient` lus par le repository.
- **Caches** (Cache API) : `transformers-cache` (modèle, géré par la bibliothèque), `mealing-embedding` (manifeste et vecteurs), `ort-engine` (moteur, règle Workbox `CacheFirst`). Une fois remplis, la recherche fonctionne hors ligne.
- **Stockage persistant** demandé au téléchargement ; un refus ne bloque rien. iOS peut purger le cache : la présence du modèle est retestée à chaque usage.

## PWA et réseau

- Manifest fourni tel quel dans [public/manifest.webmanifest](../../public/manifest.webmanifest) (`manifest: false` côté plugin). Couleur de thème `#2ECC71`.
- Workbox met en cache `js, css, html, png, svg, woff2`. Open Food Facts est en `NetworkFirst`, cache d'un jour.
- Trois origines réseau applicatives : Open Food Facts ([services/openFoodFacts.ts](../../src/services/openFoodFacts.ts)), 1min.AI ([services/aiClient.ts](../../src/services/aiClient.ts), seul point d'appel, utilisé par `aiReview.ts` et `dishFromText.ts`, sur clic explicite uniquement) et Hugging Face (téléchargement du modèle par le worker, sur clic). La clé 1min.AI est saisie dans les Réglages et reste dans `appMeta` ; elle n'est jamais dans le bundle.
- Les `.wasm`, `.bin` et `.json` ne sont pas précachés : ils ne sont demandés que par qui utilise la recherche intelligente.
