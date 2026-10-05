---
type: Design Guideline
title: Icônes
description: Emplacement, inventaire, techniques d'affichage, tailles, couleurs et accessibilité des icônes de Mealing.
resource: ../../public/icons
tags: [design, icons, svg, accessibility]
timestamp: 2026-10-04T00:00:00Z
---
# Icônes

L'interface s'appuie sur les icônes plus que sur le texte : navigation, bascules, champs et actions sont identifiés par une icône. Chaque icône est un **fichier SVG monochrome**, jamais une police d'icônes ni une bibliothèque.

## Emplacement

Servies depuis `public/icons/`, référencées par chemin absolu (`/icons/common/add.svg`).

| Dossier | Contenu | Fichiers |
|---|---|---|
| `nav/` | Barre de navigation | `home`, `planning`, `legume` (recettes), `caddie` (courses), `suivi`, `settings` |
| `common/` | Actions génériques | `add`, `edit`, `save`, `trash`, `chevron`, `heart`, `heart-filled` |
| `recipes/` | Domaine recettes | `recipe`, `ready-to-eat`, `person` (portions), `preparer` (préparation), `oven` (cuisson), `chef-hat` (difficulté) |

`assets/` contient les originaux et n'est pas servi. Une nouvelle icône va dans `public/icons/<domaine>/`, en minuscules avec tirets ; créer un dossier par nouveau domaine (`shopping/`, `nutrition/`…).

## Une icône, un sens

| Sens | Icône |
|---|---|
| Ajouter, créer | `common/add.svg` |
| Modifier | `common/edit.svg` |
| Enregistrer | `common/save.svg` |
| Supprimer, retirer | `common/trash.svg` |
| Courses | `nav/caddie.svg` |
| Favori | `common/heart.svg` (contour, `currentColor`) / `common/heart-filled.svg` (plein, `#e74c3c`) — via `FavoriteButton` |
| Déplier, replier | `common/chevron.svg` (pointe en bas, retournée à l'ouverture) |
| Portions | `recipes/person.svg` |
| Temps de préparation | `recipes/preparer.svg` |
| Temps de cuisson | `recipes/oven.svg` |
| Difficulté | `recipes/chef-hat.svg` |

Ne pas employer une seconde icône pour un sens déjà couvert, ni la même icône pour deux sens.

## Trois façons d'afficher

**1. `MaskIcon` — le choix par défaut.** Le SVG sert de masque sur un aplat de couleur : l'icône prend n'importe quelle couleur, quelle que soit celle du fichier.

```tsx
<MaskIcon src="/icons/common/add.svg" color="currentColor" size="1.2rem" />
```

- `color="currentColor"` pour suivre le texte du bouton, donc le thème. `color="#e74c3c"` pour une corbeille.
- `label` seulement si l'icône porte seule une information et n'est pas dans un bouton déjà étiqueté.

**2. `<img className="dark-invert">` — pour une icône noire affichée telle quelle.** La classe inverse l'image en thème sombre. Utilisée dans la barre de navigation, `.kind-toggle` et `.icon-field`.

```tsx
<img src="/icons/recipes/recipe.svg" alt="" className="dark-invert" />
```

**3. Classe CSS à masque — pour une icône dont la couleur dépend d'une valeur.** `.difficulty-icon` + `.difficulty-icon--EASY|MEDIUM|HARD` (composant `DifficultyIcon`).

Pour du code nouveau : `MaskIcon` dans un bouton ou partout où la couleur compte ; `<img className="dark-invert">` seulement pour reproduire un champ `.icon-field` ou une bascule `.kind-toggle` existants. Jamais d'`<img>` sans `dark-invert`, jamais de SVG collé en ligne dans le JSX.

## Tailles

| Contexte | Taille |
|---|---|
| Pastille du planning | `0.85rem` |
| Emplacement vide du planning | `1rem` |
| `.icon-button` dans une liste (défaut) | `1.1rem` |
| Dans `.button-primary`, à gauche du texte | `1.2rem` |
| `.detail-actions` | `1.4rem` |
| Navigation, `.icon-field`, `.ingredient-add`, option de difficulté | `1.5rem` |
| `.kind-toggle` | `1.75rem` |
| `.fab` | `2rem` |

## Couleurs

- Neutre : `currentColor`.
- Destructif : `#e74c3c`.
- Actif ou validé : `#2ecc71`.
- Niveaux : vert, orange, rouge (voir [foundations.md](foundations.md#couleurs-sémantiques)).

## Accessibilité

- Bouton ou lien sans texte : `aria-label` **et** `title`, en français, à l'infinitif (« Ajouter un ingrédient »). L'icône à l'intérieur reste décorative (`alt=""`, ou `MaskIcon` sans `label`).
- Icône qui remplace un libellé de champ (`.icon-field`) : `alt` et `title` portent le libellé (« Temps de cuisson (min) »).
- Bascule : `aria-pressed` quand le bouton reflète un état (pastille caddie) ; `aria-expanded` sur un chevron de dépliage.

## Emoji

Deux badges emploient un emoji (`🍱 Plat tout prêt`, `🌿 Healthy`). C'est toléré dans un `.badge` uniquement ; partout ailleurs, une icône SVG.

## Ajouter une icône

1. SVG monochrome, `viewBox` carré, sans dimensions imposées dans le dessin.
2. Le déposer dans `public/icons/<domaine>/nom-en-minuscules.svg`.
3. L'afficher avec `MaskIcon` à la taille du tableau.
4. Compléter l'inventaire ci-dessus.
