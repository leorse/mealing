# Tasks

> Le projet n'embarque pas de framework de test (`package.json` : `dev`, `build`, `lint`, `preview`).
> La vérification se fait donc par observation dans `npm run dev`, plus `npm run build` et `npm run lint`.

## 1. Rendre la zone de contenu défilable

- [x] 1.1 Ajouter `overflow-y: auto` à `.app-content` dans `src/index.css` et vérifier, sur `/recipes/new` avec 6 ingrédients ajoutés, que la zone de contenu défile et que le bouton « Créer » devient visible en bas de défilement
- [x] 1.2 Ajouter `flex-shrink: 0` aux enfants directs de `.screen` et vérifier, sur ce même formulaire, que les champs conservent leur hauteur au lieu de se tasser
- [x] 1.3 Vérifier que le bouton « Créer » est bien cliquable en fin de défilement, c'est-à-dire que le clic crée la recette au lieu d'activer un onglet de la barre de navigation

## 2. Vérifier la réserve sous la barre de navigation

- [x] 2.1 Contrôler que la réserve de bas de page de `.app-content` couvre la hauteur réelle de `.bottom-nav` (~3,3 rem), et l'ajuster si le dernier élément reste partiellement masqué
- [x] 2.2 Sur les écrans portant un bouton flottant (`.fab`, `bottom: 5.5rem`), vérifier qu'il ne masque aucun contenu en fin de défilement, et ajuster la réserve de ces écrans si nécessaire

## 3. Non-régression des écrans existants

- [x] 3.1 Vérifier sur `/planning` que la grille hebdomadaire continue de défiler horizontalement et que la coquille n'ajoute pas de défilement vertical imbriqué
- [x] 3.2 Parcourir les écrans courts (`/`, `/settings`, `/nutrition`) et vérifier qu'aucune barre de défilement n'apparaît et que la mise en page est inchangée
- [x] 3.3 Parcourir les écrans longs (`/recipes`, `/shopping`, `/ingredients/search`, profil) et vérifier que leur dernier élément est atteignable
- [x] 3.4 Vérifier le comportement sur un mobile réel, où `100dvh` varie avec la barre d'URL, et non uniquement en émulation de largeur

## 4. Contrôle final

- [x] 4.1 Exécuter `npm run lint` et `npm run build` et vérifier qu'ils passent sans nouvelle erreur
