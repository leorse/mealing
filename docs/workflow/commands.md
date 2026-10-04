---
type: Workflow
title: Commandes et cycle de développement
description: Commandes npm, vérifications avant de conclure, déploiement Cloudflare Workers et cycle OpenSpec.
resource: ../../package.json
tags: [workflow, npm, deploy, openspec]
timestamp: 2026-10-04T00:00:00Z
---
# Commandes et cycle de développement

## Commandes

| Commande | Effet |
|---|---|
| `npm install` | Installe les dépendances (Node 20+) |
| `npm run dev` | Régénère le seed Ciqual puis lance Vite sur `http://localhost:5173` |
| `npm run lint` | oxlint (règles React, TypeScript, oxc) |
| `npm run build` | Régénère le seed, `tsc -b`, puis `vite build` dans `dist/` |
| `npm run preview` | Sert `dist/` en local |
| `npm run seed:ciqual` | `assets/ciqual.sql` → `public/seed/ciqual.json` |
| `npm run deploy` | Build puis `wrangler deploy` |

Poste Windows : shell PowerShell, Python disponible sous `py`. `deploy.bat` enchaîne le déploiement par double-clic.

## Vérifier avant de conclure

Il n'y a **pas de tests automatisés**. Un changement est vérifié par :

1. `npm run lint` — aucune erreur.
2. `npm run build` — le typage (`tsc -b`) passe.
3. Pour un changement visuel : contrôle dans le navigateur, en thème clair **et** sombre, à largeur mobile.

Dire explicitement ce qui a été vérifié et ce qui ne l'a pas été.

## Déploiement

Site statique sur **Cloudflare Workers** ([wrangler.toml](../../wrangler.toml)) : `dist/` servi comme assets, `not_found_handling = "single-page-application"` pour que les routes du routeur fonctionnent au rechargement. Ne déployer que sur demande explicite.

Le service worker est en `autoUpdate` : une nouvelle version remplace l'ancienne au prochain chargement.

## OpenSpec

Le comportement livré est décrit par capacité dans [openspec/specs/](../../openspec/specs/) : `app-shell-layout`, `meal-planning`, `recipe-authoring`, `theming`. Les changements passés sont dans `openspec/changes/archive/`.

Cycle d'un changement de comportement :

1. `/opsx:propose` — proposition, design, deltas de spec et tâches dans `openspec/changes/<nom>/`.
2. `/opsx:apply` — réalisation tâche par tâche.
3. `/opsx:archive` — report des deltas dans les specs et archivage.

Règles :

- Avant de modifier un comportement existant, lire la spec de la capacité concernée : ses scénarios sont les cas à ne pas casser.
- Les artefacts OpenSpec s'écrivent en français, exigences en `SHALL`, scénarios en `WHEN` / `THEN`.
- Une retouche sans effet sur le comportement (refactor, style conforme aux specs) n'a pas besoin d'une proposition.

## Git

Branche de travail courante `PWA`, branche principale `main`. Messages de commit courts, en français. Ne pas commiter ni pousser sans demande.
