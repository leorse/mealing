---
type: Design Guideline
title: Fondations CSS
description: Couleurs, thème clair et sombre, rayons, espacements, typographie et règles d'écriture du CSS de Mealing.
resource: ../../src/index.css
tags: [design, css, theming, colors]
timestamp: 2026-10-04T00:00:00Z
---
# Fondations CSS

## Organisation

- **Un seul fichier** : [src/index.css](../../src/index.css), importé dans `main.tsx`. Pas de CSS modules, pas de préprocesseur, pas de Tailwind, pas de bibliothèque de composants.
- Pas de variables CSS : les valeurs ci-dessous sont écrites en clair. Les reprendre à l'identique, ne pas en inventer de voisines.
- Pas de `style` en ligne dans le JSX. Seule exception : [MaskIcon](../../src/components/MaskIcon.tsx), dont taille et couleur sont des props.
- Ajouter une règle près des règles du même bloc, avec un commentaire en français qui dit **pourquoi** quand la raison n'est pas évidente.

## Nommage

- `bloc` puis `bloc--variante` : `.button-primary--neutral`, `.meal-slot--empty`, `.modal-card--picker`, `.day-total--over`.
- Éléments d'un bloc par préfixe : `.picker-result`, `.picker-result-note`, `.ingredient-row-name`.
- État posé par le code : `.active` (choix courant d'une bascule, lien de navigation), `.selected` (ligne choisie dans une liste), `.holding` (appui maintenu), `.off` (article désactivé), `.open` (élément déplié).
- Une variante liée à une valeur du modèle reprend cette valeur : `.difficulty-icon--EASY`, `.difficulty-picker-option--HARD`.

## Thème clair et sombre

`color-scheme: light dark` sur `:root` : le thème suit le système, sans bascule dans l'application. Exigences dans [openspec/specs/theming/spec.md](../../openspec/specs/theming/spec.md).

| Besoin | Valeur |
|---|---|
| Fond d'une surface (fenêtre, barre) | `canvas` |
| Texte | `canvasText`, ou `inherit` |
| Bordure de champ, de zone | `1px solid color-mix(in srgb, canvasText 20%, transparent)` |
| Séparateur discret | `color-mix(in srgb, canvasText 10%, transparent)` |
| Fond léger d'un élément rempli | `color-mix(in srgb, canvasText 6%, transparent)` |
| Fond d'un bouton neutre, d'une pastille | `color-mix(in srgb, canvasText 12 à 18%, transparent)` |
| Bordure en pointillé d'un emplacement vide | `1px dashed color-mix(in srgb, canvasText 25%, transparent)` |
| Texte secondaire | `opacity` entre `0.6` et `0.75`, pas de gris codé |
| Champ de saisie | `background: none; color: inherit; font: inherit;` |

Des règles anciennes emploient encore `#ddd` pour les bordures. **Ne pas en ajouter** : toute nouvelle bordure utilise `color-mix`. Jamais de `#fff` ou `#000` pour un fond ou un texte de surface.

## Couleurs sémantiques

Trois teintes, pas une de plus :

| Teinte | Valeur | Sens |
|---|---|---|
| Vert | `#2ecc71` | Action principale, confirmation, choix actif, total dans l'objectif, « healthy », difficulté facile |
| Orange | `#f39c12` | Attention, total sous l'objectif, difficulté moyenne |
| Rouge | `#e74c3c` | Suppression, annulation, dépassement, difficulté élevée |

- Sur un fond plein vert ou rouge, le texte est `#fff`.
- Version atténuée d'un état actif : même teinte en bordure et en texte, fond `color-mix(in srgb, <teinte> 12%, transparent)` (18 à 25 % pour une pastille ou une ligne sélectionnée).
- Le vert est aussi la couleur de thème de la PWA (`#2ECC71` dans `index.html` et le manifest).

## Rayons

| Rayon | Usage |
|---|---|
| `6px` | Petit champ en ligne (quantité d'un ingrédient) |
| `8px` | Champs, boutons, options de bascule, créneaux |
| `10px` | Élément de liste, zone encadrée (`fieldset`) |
| `12px` | Cartes, fenêtres modales, colonnes de jour |
| `999px` | Badges |
| `50%` | Pastilles et bouton flottant |

## Espacements

En `rem`. Les `px` sont réservés aux bordures, aux rayons et aux largeurs maximales.

- Entre les blocs d'un écran : `0.75rem` (porté par `.screen`).
- Entre éléments d'un groupe : `0.5rem` ; libellé et son champ : `0.25rem`.
- Remplissage : champ `0.6rem 0.75rem`, carte `1.25rem`, fenêtre modale `1.5rem`, zone encadrée `0.75rem`, bouton principal `0.7rem`.

## Typographie

- Police système : `system-ui, -apple-system, sans-serif`. Aucune police embarquée.
- Tailles : `1rem` bouton principal, `0.95rem` recherche, `0.9rem` libellés et états vides, `0.85rem` métadonnées, `0.75rem` badges et notes, `0.7rem` étiquette de créneau.
- Graisses : `600` pour un nom, une valeur, un bouton ; `700` pour le grand chiffre de l'accueil.
- Un titre `<h1>` par écran, sans classe.

## Mouvement et tactile

- Toute animation a son repli sous `@media (prefers-reduced-motion: reduce)`.
- Une durée partagée entre CSS et code est notée des deux côtés (`HOLD_MS = 700` et `700ms`) : les modifier ensemble.
- Cible tactile d'un bouton d'icône : au moins `2.25rem` de côté, sauf dans la grille dense du planning.
