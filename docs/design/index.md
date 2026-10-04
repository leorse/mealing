---
type: Index
title: Design
description: Système visuel de Mealing, tiré de l'écran de création de recette, pour garder toute l'application cohérente.
tags: [design, css, index]
timestamp: 2026-10-04T00:00:00Z
---
# Design

Le système visuel n'est pas une bibliothèque : c'est l'ensemble des classes de [src/index.css](../../src/index.css) telles que l'écran de création de recette les emploie. Tout nouvel écran s'y conforme.

| Fichier | À lire pour |
|---|---|
| [foundations.md](foundations.md) | Couleurs, thème clair/sombre, rayons, espacements, typographie, règles d'écriture du CSS |
| [layout.md](layout.md) | Coquille, zone de défilement, `.screen`, barre de navigation, bouton flottant |
| [components.md](components.md) | Catalogue des classes et des composants React réutilisables |
| [icons.md](icons.md) | Où ranger une icône, comment l'afficher, quelle taille, quelle couleur |
| [recipe-form.md](recipe-form.md) | L'écran de référence décortiqué, et la liste de contrôle d'un nouvel écran |

Ordre conseillé pour créer un écran : [recipe-form.md](recipe-form.md), puis [components.md](components.md) et [icons.md](icons.md) au besoin.
