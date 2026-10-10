---
type: Design Guideline
title: Mise en page
description: Coquille applicative, zone de défilement unique, conteneur d'écran, barre de navigation et bouton flottant.
resource: ../../src/app/AppLayout.tsx
tags: [design, layout, css]
timestamp: 2026-10-04T00:00:00Z
---
# Mise en page

Exigences dans [openspec/specs/app-shell-layout/spec.md](../../openspec/specs/app-shell-layout/spec.md).

## Coquille

```
.app-shell      colonne, hauteur 100dvh
├── main.app-content   seul conteneur de défilement vertical, padding 1rem
│   └── <écran>        .screen
└── nav.bottom-nav     fixe en bas
```

- **Un seul défilement vertical**, celui de `.app-content`. Un écran ne pose pas son propre `overflow-y`, sauf une liste bornée dans une fenêtre modale.
- `.app-content` réserve `4.5rem` en bas pour la barre de navigation, et `9.5rem` dès qu'un `.fab` est présent (`:has(.fab)`). Ne pas compenser à la main dans un écran.
- Les éléments d'un écran gardent leur hauteur naturelle (`flex-shrink: 0`) : le dépassement défile, il ne tasse rien.

## Conteneur d'écran

| Classe | Usage |
|---|---|
| `.screen` | Racine de tout écran : colonne, `gap: 0.75rem`, largeur max `480px`, centrée |
| `.screen.screen--wide` | Écran pleine largeur qui gère son propre défilement interne (planning) |

- La racine est un `<div className="screen">`, ou un `<form className="screen">` quand l'écran entier est un formulaire.
- Mobile d'abord : tout doit tenir dans 480 px de large. Pas de points de rupture dans le CSS actuel.
- Dans `.screen`, un `<label>` devient automatiquement une colonne « texte au-dessus, champ en dessous », et ses `input`, `textarea`, `select` sont stylés sans classe.

## Écran pleine largeur

Le planning sert de modèle : `.screen--wide` > `.week-header` puis `.week-grid-scroll` (défilement **horizontal** seulement, marges négatives pour aller bord à bord) > `.week-grid` (7 colonnes d'au moins `150px`).

## Barre de navigation

`.bottom-nav` : fixe, fond `canvas`, bordure haute, six liens répartis. Lien inactif à `opacity: 0.5`, actif à `1` (classe `.active` posée par `NavLink`). Icône `.nav-icon` de `1.5rem`, sans libellé visible ; le libellé est dans `aria-label`.

## Bouton flottant

`.fab` : disque vert de `3.25rem`, à `1.25rem` du bord droit et `5.5rem` du bas, icône blanche de `2rem`. Réservé à **l'action de création principale d'un écran de liste**. Une seconde façon de créer se place au-dessus en `.fab.fab--second` (disque neutre à bordure, `9.5rem` du bas) : c'est le cas de « Décrire un plat » sur la liste des plats. Pas plus de deux.

```tsx
<Link to="/recipes/new" className="fab" aria-label="Créer une recette">
  <MaskIcon src="/icons/common/add.svg" color="currentColor" size="2rem" />
</Link>
```

## Fenêtres modales

`.modal-overlay` (plein écran, voile noir à 50 %, `z-index: 1000`) centre une `.modal-card`. Détail dans [components.md](components.md#fenêtres-modales).
