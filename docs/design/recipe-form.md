---
type: Pattern
title: Écran de référence — création de recette
description: Anatomie de l'écran de création et de modification de recette, modèle à suivre pour tout nouvel écran ou formulaire.
resource: ../../src/screens/recipes/RecipeFormScreen.tsx
tags: [design, pattern, form, recipes]
timestamp: 2026-10-04T00:00:00Z
---
# Écran de référence : création de recette

[RecipeFormScreen.tsx](../../src/screens/recipes/RecipeFormScreen.tsx) sert les routes `/recipes/new` et `/recipes/:id/edit`. C'est le modèle visuel et structurel de l'application : en cas de doute sur un nouvel écran, faire comme lui.

## Anatomie, de haut en bas

| # | Élément | Balisage | Ce qu'il faut retenir |
|---|---|---|---|
| 1 | Racine | `<form className="screen" onSubmit={handleSubmit}>` | L'écran entier est le formulaire |
| 2 | Titre | `<h1>` | Dit l'action : « Nouvelle recette », « Nouveau plat tout prêt », « Modifier » |
| 3 | Type | `.kind-toggle`, deux boutons à icône | Choix structurant, proposé **à la création seulement** |
| 4 | Nom, description | `<label>` + `input` / `textarea rows={2}` | Libellé texte au-dessus du champ |
| 5 | Portions | `IconNumberField` (`.icon-field`) + `person.svg` | L'icône remplace le libellé |
| 6 | Temps de préparation, de cuisson | `IconNumberField` + `preparer.svg`, `oven.svg` | Champs facultatifs, vides par défaut |
| 7 | Difficulté | `DifficultyPicker` (`.difficulty-picker`) | Trois toques, la teinte dit le niveau |
| 8 | Ingrédients | `<fieldset className="ingredient-picker">` + `<legend>` | Bouton `.ingredient-add`, `.empty-state`, puis `.ingredient-list` |
| 9 | Sélection d'un ingrédient | `IngredientPickerModal` | La recherche se fait dans une fenêtre, pas dans la page |
| 10 | Validation | `.button-primary` avec `MaskIcon` + texte | Dernier élément de l'écran |

Pour un plat tout prêt, les blocs 6 à 9 laissent place à un `fieldset.ingredient-picker` « Valeurs nutritionnelles par portion » : quatre `<label>` numériques, le champ obligatoire marqué d'un `*` dans son libellé.

## Principes à reproduire

**Structure**
- Une colonne, un bloc par ligne, espacés par le `gap` de `.screen`. Pas de grille, pas de colonnes côte à côte hormis les bascules.
- Du général au particulier : identité, puis paramètres, puis sous-liste, puis validation.
- Le contenu s'adapte au choix fait en haut : les champs sans objet disparaissent, ils ne sont pas grisés.
- Un groupe de champs ou une sous-liste s'encadre dans un `fieldset.ingredient-picker` avec `legend`.

**Icônes plutôt que texte**
- Une donnée chiffrée courante (portions, durées) : icône à gauche, champ à droite, libellé dans `alt` et `title`.
- Un choix parmi deux ou trois : boutons à icône de largeur égale, `aria-label` + `title` sur chacun.
- Une action : `MaskIcon` dans le bouton. Voir [icons.md](icons.md).

**Bouton de validation**

| Mode | Classe | Icône | Texte |
|---|---|---|---|
| Création | `button-primary` | `common/add.svg` | « Créer » |
| Modification | `button-primary button-primary--neutral` | `common/save.svg` | « Enregistrer » |

Icône en `currentColor`, `1.2rem`. Un seul bouton principal par écran, toujours en bas.

**Sous-liste éditable**
- Bouton d'ajout en tête, message `.empty-state` quand la liste est vide (« Aucun ingrédient ajouté. »).
- Une ligne : nom qui prend la place (`.ingredient-row-name`), champ de quantité étroit, unité en texte, corbeille rouge en `.icon-button`.
- Ajout par fenêtre modale ; modification de la quantité directement dans la ligne ; retrait immédiat.

## État et logique

- Un `useState` par champ. Un nombre facultatif est typé `number | ''`, avec `onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))}` ; `''` devient `undefined` à l'enregistrement.
- Validation par les attributs HTML (`required`, `min`). Pas de bibliothèque de formulaire, pas de messages d'erreur maison.
- `isEdit = Boolean(id)`. En modification, un `useEffect` sur `[id]` charge l'entité par le repository et remplit les états.
- `handleSubmit` : `e.preventDefault()`, calcul des valeurs dérivées par `services/nutrition`, appel de `create` ou `update`, puis `navigate` vers le détail.
- Les sous-composants propres à l'écran (`IconNumberField`, `DifficultyPicker`) sont déclarés au-dessus du composant principal, dans le même fichier.

## Écrans voisins, mêmes règles

- **Liste** ([RecipeListScreen.tsx](../../src/screens/recipes/RecipeListScreen.tsx)) : `<h1>`, `.search-input`, `.empty-state`, `.recipe-list`, `.fab` pour créer, `ConfirmModal` pour supprimer. Données par `useLiveQuery`, filtrage en mémoire.
- **Détail** ([RecipeDetailScreen.tsx](../../src/screens/recipes/RecipeDetailScreen.tsx)) : `<h1>`, `.recipe-badges`, sections `.card` + `.card-label`, `.nutrition-table`, puis `.detail-actions` (modifier, supprimer). `useLiveQuery` rend `undefined` pendant le chargement (ne rien afficher) et `null` si l'entité n'existe pas (« … introuvable. »).

## Liste de contrôle d'un nouvel écran

- [ ] Racine `.screen` (ou `form.screen`), un seul `<h1>`.
- [ ] Uniquement des classes existantes ; toute classe nouvelle est justifiée et ajoutée à [components.md](components.md).
- [ ] Lisible en thème clair **et** sombre : aucune couleur de surface codée en dur.
- [ ] Icônes prises dans `public/icons/`, tailles du tableau de [icons.md](icons.md).
- [ ] Chaque bouton sans texte a `aria-label` et `title` ; chaque `<button>` a son `type`.
- [ ] Action principale en bas (`.button-primary`) ou flottante (`.fab`), pas les deux.
- [ ] État vide prévu (`.empty-state`).
- [ ] Textes en français, libellés d'action à l'infinitif, typographie française (« … », espaces avant `?`).
- [ ] Tient dans 480 px de large et reste atteignable au défilement jusqu'au dernier élément.
- [ ] Données lues et écrites par les repositories.
