---
type: Index
title: Base de connaissance Mealing
description: Point d'entrée du bundle OKF décrivant l'architecture, le design et les méthodes de travail de l'application Mealing.
tags: [mealing, index]
timestamp: 2026-10-04T00:00:00Z
---
# Base de connaissance Mealing

Bundle au format OKF (Open Knowledge Format v0.1) : un fichier par concept, frontmatter YAML (`type` obligatoire), liens Markdown ordinaires, un `index.md` par dossier pour descendre progressivement.

Mealing est une PWA local-first de planification des repas et de suivi nutritionnel. Les directives courtes sont dans [CLAUDE.md](../CLAUDE.md) ; ici se trouve le détail.

## Domaines

| Dossier | Contenu |
|---|---|
| [architecture/](architecture/index.md) | Couches, modèle de données, routes et écrans, règles métier |
| [design/](design/index.md) | Fondations CSS, mise en page, composants, icônes, écran de référence |
| [workflow/](workflow/index.md) | Recherche avec graft, commandes, conventions de code |

## Autres sources du dépôt

- [openspec/specs/](../openspec/specs/) — comportement livré, par capacité (`app-shell-layout`, `meal-planning`, `recipe-authoring`, `theming`).
- [spec.md](../spec.md) — vision cible complète du produit (peut être en avance sur le code).
- [log.md](log.md) — historique des évolutions de cette base.
