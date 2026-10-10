# Mealing — directives pour l'agent

PWA **local-first** de planification des repas et de suivi nutritionnel.
React 19 + TypeScript + Vite, données dans IndexedDB (Dexie), aucun backend, déploiement statique sur Cloudflare Workers. Interface et commentaires **en français**.

Ce fichier ne contient que l'essentiel. Le détail est dans la base de connaissance [docs/](docs/index.md) (format OKF : un fichier Markdown par concept, frontmatter YAML, `index.md` par dossier). **Lire le fichier concerné avant de travailler sur son sujet**, pas tout le dossier.

## Où trouver quoi

| Je dois… | Lire |
|---|---|
| Comprendre les couches et le flux de données | [docs/architecture/overview.md](docs/architecture/overview.md) |
| Toucher au schéma, aux tables, aux repositories | [docs/architecture/data-model.md](docs/architecture/data-model.md) |
| Ajouter un écran ou une route | [docs/architecture/routing.md](docs/architecture/routing.md) |
| Calculs nutritionnels, dates, règles du planning | [docs/architecture/domain-rules.md](docs/architecture/domain-rules.md) |
| Écrire du CSS (couleurs, rayons, thème) | [docs/design/foundations.md](docs/design/foundations.md) |
| Mettre en page un écran | [docs/design/layout.md](docs/design/layout.md) |
| Réutiliser un composant ou une classe | [docs/design/components.md](docs/design/components.md) |
| Ajouter ou afficher une icône | [docs/design/icons.md](docs/design/icons.md) |
| Construire un formulaire ou un écran complet | [docs/design/recipe-form.md](docs/design/recipe-form.md) — **écran de référence** |
| Chercher dans le code | [docs/workflow/graft.md](docs/workflow/graft.md) |
| Lancer, vérifier, déployer, OpenSpec | [docs/workflow/commands.md](docs/workflow/commands.md) |
| Conventions de code | [docs/workflow/conventions.md](docs/workflow/conventions.md) |

## Règles non négociables

1. **Recherche dans le code : graft d'abord.** `graft ask`, `graft grep`, `graft skeleton`, `graft callers`, `graft map` (ou les outils MCP `graft_*`). Pas de grep/lecture de fichiers entiers pour localiser du code TS/TSX. Avant de modifier un symbole : `graft callers <symbole>`. Seule exception : `src/index.css`, non indexé.
2. **L'écran de création de recette est la référence visuelle** ([RecipeFormScreen.tsx](src/screens/recipes/RecipeFormScreen.tsx)). Tout nouvel écran reprend sa structure, ses classes et ses icônes.
3. **Un seul fichier CSS** : [src/index.css](src/index.css). Classes simples `bloc` / `bloc--variante`, état par `.active` / `.selected`. Pas de CSS modules, pas de Tailwind, pas de bibliothèque UI, pas de `style` en ligne (hors `MaskIcon`). Réutiliser une classe existante avant d'en créer une.
4. **Clair et sombre, toujours.** Couleurs système (`canvas`, `canvasText`) et `color-mix(in srgb, canvasText N%, transparent)` pour fonds et bordures. Ne plus ajouter de `#ddd`.
5. **Trois couleurs sémantiques seulement** : vert `#2ecc71` (action principale, validé, facile), orange `#f39c12` (attention, moyen), rouge `#e74c3c` (danger, dépassement, suppression).
6. **Icônes en SVG** depuis `public/icons/`, affichées par `MaskIcon` (recolorable) ; tout bouton sans texte porte `aria-label` et `title`.
7. **Les écrans ne touchent jamais `db` directement** : passer par `src/db/repositories/`. Lecture réactive avec `useLiveQuery`, et une requête lue par `useLiveQuery` n'écrit jamais.
8. **Un jour civil est une chaîne `AAAA-MM-JJ` locale** : uniquement via [src/utils/date.ts](src/utils/date.ts). Jamais `toISOString().slice(0, 10)` ni `new Date('AAAA-MM-JJ')`.
9. **Aucune donnée ne quitte l'appareil sans demande explicite.** Trois origines réseau autorisées : Open Food Facts (recherche d'aliments), 1min.AI (avis de l'IA sur le planning et analyse d'un plat décrit, uniquement sur clic, sans donnée personnelle — voir [domain-rules.md](docs/architecture/domain-rules.md)) et Hugging Face (téléchargement du modèle de recherche intelligente, sur clic ; rien n'y est envoyé). Aucune clé d'API dans le code, la doc ni les commits : elle se saisit dans les Réglages.
10. **Vérifier avant de conclure** : `npm run lint` puis `npm run build`. Il n'y a pas de tests automatisés.

## Pièges connus

- `spec.md` décrit la **cible** du produit ; `openspec/specs/` décrit le **comportement réellement livré**. En cas de conflit, le code et OpenSpec priment.
- `_bmad-output/project-context.md` est **obsolète** (ancienne version React Native + Spring Boot) : ne pas s'en servir. `mealing-backend/` et `tools/` sont des restes de cette époque.
- `assets/ciqual.sql` et les vecteurs de recherche vont ensemble : après toute modification du SQL, `npm run embed:ciqual` puis commiter `public/seed/ciqual-index.json`, sinon `dev` et `build` échouent. `ciqual-vectors.bin` n'est pas dans git : il est recalculé au premier `dev` ou `build` d'un poste où il manque (quelques minutes).
- Neuf écrans sont encore des coquilles « À venir » (voir [routing.md](docs/architecture/routing.md)). `framer-motion`, `recharts`, `pdf-lib` et `@zxing/browser` sont installés mais pas encore utilisés.
- Sur ce poste Windows, Python se lance avec `py`.

## Tenir la base à jour

Quand un changement rend un fichier de `docs/` faux (nouvelle classe CSS partagée, nouvelle table, nouvelle route, nouvelle icône), corriger ce fichier dans le même changement et ajouter une ligne à [docs/log.md](docs/log.md).
