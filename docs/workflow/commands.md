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
| `npm run dev` | Régénère le seed Ciqual, copie le moteur ONNX, puis lance Vite sur `http://localhost:5173` |
| `npm run lint` | oxlint (règles React, TypeScript, oxc) |
| `npm run build` | Régénère le seed, copie le moteur ONNX, `tsc -b`, puis `vite build` dans `dist/` |
| `npm run preview` | Sert `dist/` en local |
| `npm run seed:ciqual` | `assets/ciqual.sql` → `public/seed/ciqual.json`. Échoue si le manifeste des vecteurs ne vient pas de ce SQL ; recalcule le fichier de vecteurs s'il manque sur le poste |
| `npm run embed:ciqual` | Vectorise `assets/ciqual.sql` → `public/seed/ciqual-vectors.bin` + `ciqual-index.json`. Plusieurs minutes ; télécharge le modèle (≈ 120 Mo) au premier lancement |
| `npm run copy:ort` | Copie le moteur WebAssembly d'ONNX de `node_modules` vers `public/ort/` (ignoré par git) |
| `npm run deploy` | Build puis `wrangler deploy` |

Poste Windows : shell PowerShell, Python disponible sous `py`. `deploy.bat` enchaîne le déploiement par double-clic.

## Base Ciqual et vecteurs de recherche

La recherche intelligente compare les requêtes à des vecteurs **précalculés** des aliments Ciqual, produits par `npm run embed:ciqual`. Deux fichiers, deux statuts :

- `public/seed/ciqual-index.json` (manifeste) est **versionné dans git** : il porte la version et l'empreinte, qui doivent être les mêmes sur tous les postes.
- `public/seed/ciqual-vectors.bin` est **ignoré par git**. Sur un poste où il manque (ou n'a pas la taille annoncée), `seed:ciqual` — donc le premier `dev` ou `build` — le recalcule à la version du manifeste. Cela prend quelques minutes et télécharge le modèle depuis Hugging Face la première fois.

- Le manifeste `ciqual-index.json` porte une `version` et l'empreinte SHA-256 de `ciqual.sql` (fins de ligne normalisées).
- `embed:ciqual` ne fait rien si l'empreinte n'a pas changé ; sinon il revectorise tout et incrémente la version.
- `embed:ciqual` recalcule aussi quand le fichier de vecteurs manque, **sans changer la version** : même base, même modèle, mêmes vecteurs.
- `seed:ciqual` (donc `dev` et `build`) compare l'empreinte du SQL à celle du manifeste et **échoue** en cas d'écart : relancer `npm run embed:ciqual`, puis commiter le manifeste.
- Modèle, quantification, préfixe et regroupement sont des constantes en tête de `scripts/embed-ciqual.mjs`, recopiées au manifeste ; l'appareil vectorise ses requêtes avec les valeurs du manifeste. Les changer revectorise et incrémente la version.

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
