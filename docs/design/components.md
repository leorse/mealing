---
type: Reference
title: Catalogue des composants et des classes
description: Composants React partagés et classes CSS réutilisables, avec leur usage attendu.
resource: ../../src/components
tags: [design, components, css]
timestamp: 2026-10-04T00:00:00Z
---
# Composants et classes

Avant de créer une classe ou un composant, chercher ici. Pour retrouver une classe dans le CSS : recherche dans [src/index.css](../../src/index.css) ; pour retrouver ses usages dans le code : `graft grep "nom-de-classe"`.

## Composants React partagés

Dans [src/components/](../../src/components/), export par défaut.

| Composant | Props | Usage |
|---|---|---|
| `MaskIcon` | `src`, `color`, `size?` (`1.1rem`), `label?` | Icône SVG recolorable. Voir [icons.md](icons.md) |
| `DifficultyIcon` | `difficulty` | Toque colorée avec libellé accessible (Facile, Moyen, Élaboré) |
| `ConfirmModal` | `open`, `message`, `onConfirm`, `onCancel` | Question fermée Non / Oui |
| `IngredientPickerModal` | `open`, `existingIngredientIds`, `onConfirm`, `onCancel` | Recherche d'un ingrédient + quantité |
| `MealPickerModal` | `open`, `slotDate`, `mealType`, `slot?`, `onClose` | Ajout ou modification d'une entrée du planning (recette ou écart) |
| `FavoriteButton` | `name`, `isFavorite`, `onToggle` | Cœur d'un plat en `.icon-button`, `aria-pressed` ; liste des plats et fenêtre du planning |
| `HoldToDeleteButton` |, `label` | Suppression par appui maintenu de 700 ms |

`IconNumberField` et `DifficultyPicker` sont pour l'instant **locaux** à `RecipeFormScreen.tsx`. Dès qu'un second écran en a besoin, les déplacer dans `src/components/` au lieu de les recopier.

## Boutons

| Classe | Aspect | Usage |
|---|---|---|
| `.button-primary` | Plein vert, texte blanc, icône + texte | Action principale d'un écran, en bas. **Création** |
| `.button-primary.button-primary--neutral` | Fond gris translucide | Même place, pour **enregistrer une modification** |
| `.button-primary.button-primary--danger` | Plein rouge, texte blanc | Action destructive d'ensemble (« Tout supprimer »), toujours suivie d'un `ConfirmModal` |
| `.shop-toggle` | Disque `2.25rem`, gris, vert en `.active` | Bouton de courses d'un article ; mêmes teintes que la pastille du planning |
| `.icon-button` | Sans fond ni bordure | Action secondaire par icône seule (modifier, supprimer, retirer) |
| `.fab` | Disque vert flottant | Création depuis une liste (voir [layout.md](layout.md#bouton-flottant)) |
| `.button-row` | Rangée de boutons ou liens à bordure, largeur égale | Actions secondaires côte à côte |
| `.detail-actions` | Rangée d'`.icon-button` | Actions d'un écran de détail |
| `.ingredient-add` | Carré `2.25rem` à bordure | Bouton « + » en tête d'une zone encadrée |
| `.modal-button--yes` / `--no` | Plein vert / plein rouge | Boutons d'une fenêtre modale |

Tout `<button>` qui ne soumet pas porte `type="button"`.

## Bascules

| Classe | Usage |
|---|---|
| `.kind-toggle` | Choix exclusif par **icônes** ; l'option active a une bordure verte |
| `.mode-toggle` | Choix exclusif par **texte** ; l'option active est pleine verte |
| `.difficulty-picker` + `.difficulty-picker-option--<NIVEAU>` | Choix à trois niveaux ; l'option active prend la teinte de son niveau |

Toutes : boutons de largeur égale (`flex: 1`), `gap: 0.5rem`, état porté par `.active`.

## Champs

| Classe | Usage |
|---|---|
| `<label>` dans `.screen` | Champ standard, sans classe |
| `.icon-field` + `.icon-field-icon` | Champ numérique précédé d'une icône qui remplace le libellé |
| `.search-input` | Champ de recherche d'un écran de liste |
| `.checkbox-label` | Libellé en ligne pour une case à cocher |
| `.ingredient-picker` | `<fieldset>` encadré avec `<legend>`, pour grouper des champs ou une sous-liste |
| `.picker-search`, `.picker-quantity` | Champs d'une fenêtre de sélection |

## Listes et contenu

| Classe | Usage |
|---|---|
| `.recipe-list` > `.recipe-list-item` > `.recipe-list-link` | Liste d'éléments cliquables avec action à droite |
| `.recipe-name`, `.recipe-meta` | Titre et ligne de métadonnées d'un élément |
| `.recipe-badges` | Ligne de badges et d'informations d'un détail |
| `.badge`, `.badge--healthy` | Étiquette en pilule, variante verte |
| `.ingredient-list` > `.ingredient-row` (+ `.ingredient-row-name`) | Lignes éditables : nom, quantité, unité, retrait |
| `.card` + `.card-label` | Bloc encadré avec petit intitulé |
| `.nutrition-table` | Tableau de valeurs, première colonne à gauche, les autres à droite |
| `.macro-row` > `.macro-item` (`.macro-value`, `.macro-label`) | Trois valeurs côte à côte |
| `.empty-state` | Message d'absence de contenu, centré et atténué |

Ces noms datent des recettes mais servent de modèle générique : pour une autre liste, **réutiliser les mêmes classes** tant que l'aspect est identique, plutôt que de les dupliquer sous un autre nom.

## Fenêtres modales

```tsx
<div className="modal-overlay">
  <div className="modal-card modal-card--picker" role="dialog" aria-modal="true" aria-label="…">
    …
    <div className="modal-actions">
      <button type="button" className="modal-button modal-button--no" onClick={onCancel}>Annuler</button>
      <button type="button" className="modal-button modal-button--yes" disabled={!canConfirm} onClick={confirm}>Ajouter</button>
    </div>
  </div>
</div>
```

- `.modal-card` : `320px` max. `.modal-card--picker` : `380px` max, hauteur bornée, seule `.picker-results` défile.
- Refus à gauche (rouge), validation à droite (verte), désactivée tant que la saisie est incomplète.
- Liste de choix : `.picker-results` > `.picker-result-list` > `button.picker-result` (`.selected`, `disabled`), note à droite en `.picker-result-note`.
- Comportement commun : `if (!open) return null;`, fermeture par Échap, focus sur le champ de recherche à l'ouverture, remise à zéro de l'état à chaque ouverture (comparaison `open !== wasOpen` pendant le rendu, pas dans un effet).

Un résultat de fenêtre suivi d'une action (cœur) : `li.picker-result-row` contient le `button.picker-result` et le bouton d'action, frères.

## Supprimer : quel geste

| Contexte | Geste |
|---|---|
| Élément enregistré, depuis une liste ou un détail | `.icon-button` corbeille rouge → `ConfirmModal` « Supprimer … ? » |
| Grille dense (planning) | `HoldToDeleteButton` |
| Ligne d'un formulaire non encore enregistré | `.icon-button` corbeille rouge, retrait immédiat |
| Article de la liste de courses | `.icon-button` corbeille rouge, immédiat (se rattrape en rallumant la pastille au planning) |
| Vider une liste entière | `.button-primary--danger` → `ConfirmModal` |

## Liste de courses

| Classe | Usage |
|---|---|
| `.shopping-list` > `.shopping-item` | Liste d'articles encadrés (vue par ingrédient) |
| `.card.shopping-card` | Bloc d'un plat (vue par plat) |
| `.shopping-row` | Ligne : `.shop-toggle`, `.shopping-row-text` (`.shopping-row-name`, `.shopping-row-note`), `.shopping-row-quantity`, corbeille `.icon-button` |
| `.shopping-row.off` | Article désactivé : texte atténué et barré, boutons intacts |
| `.shopping-detail` | Sous-liste en retrait : occurrences d'un ingrédient, ou ingrédients d'un plat |
| `.shopping-struck` | Provenance désactivée dans le résumé d'une ligne |
| `.shopping-expand` (+ `.open`) | Chevron de dépliage, retourné quand la ligne est ouverte |

Une ligne à deux gestes place le geste réversible à gauche et le geste définitif à droite, comme une entrée du planning.

## Planning

Classes propres à la grille : `.week-header`, `.week-grid`, `.day-column`, `.day-name`, `.day-total--ok|warn|over`, `.meal-group`, `.meal-slot--filled|empty`, `.meal-entry`, `.meal-entry-name`, `.meal-entry-shop`, `.meal-entry-delete`, `.meal-slot-type`, `.meal-slot-kcal`.
