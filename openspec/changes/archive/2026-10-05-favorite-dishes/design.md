# Design

## Context

Voir `proposal.md` — Why. Exigences dans `specs/dish-catalog/spec.md` et `specs/meal-planning/spec.md`.

État actuel :

- `Recipe` (table `recipes`, index `name, difficulty, isHealthy`) porte `kind: 'RECIPE' | 'PREPARED'`. `recipeRepository.update` réécrit les champs de `RecipeInput` sans toucher aux autres.
- `RecipeListScreen` rend chaque plat en `.recipe-list-item` : un lien vers le détail (`.recipe-list-link`) et une corbeille `.icon-button`, côte à côte.
- `MealPickerModal` charge `recipeRepository.list()` (tri par nom) et filtre en mémoire ; chaque résultat est un `button.picker-result` avec une note à droite (« tout prêt » / « recette »).
- `assets/heart.svg` est un contour (trait de 2, sans remplissage). Rendu par `MaskIcon`, il ne peut pas apparaître « rempli » : le masque ne garde que le trait.
- Le mot « recette » s'affiche dans `AppLayout.tsx`, `RecipeListScreen.tsx`, `RecipeDetailScreen.tsx`, `RecipeFormScreen.tsx` et `MealPickerModal.tsx` (repérés par `graft grep "[Rr]ecette" --in src/`).

## Goals / Non-Goals

**Goals**

- Un geste d'un clic pour marquer un plat, sans quitter la liste.
- Les favoris à portée immédiate dans la fenêtre du planning.
- Un vocabulaire unique à l'écran.

**Non-Goals**

- Renommer le code et les adresses : `Recipe`, `recipeRepository`, `screens/recipes/`, `/recipes` restent tels quels. Ce sont des noms techniques invisibles dans l'application installée ; les renommer toucherait une trentaine de fichiers et les specs existantes, pour aucun effet à l'écran.
- Un cœur sur l'écran de détail, un tri ou un filtre par favori dans la liste des plats.

## Decisions

### Le favori est un booléen optionnel non indexé sur le plat

`Recipe` reçoit `isFavorite?: boolean`. Absent vaut non favori.

*Pourquoi non indexé* : la fenêtre du planning charge déjà tous les plats et trie en mémoire ; aucun index n'est nécessaire, donc `db.version(1).stores(...)` reste inchangé et il n'y a pas de migration.

*Pourquoi hors de `RecipeInput`* : le formulaire ne connaît pas le favori. Comme `update` ne réécrit que les champs fournis, modifier un plat conserve son favori sans rien faire. Une fonction dédiée `setFavorite(id, isFavorite)` du repository fait la bascule et ne touche pas `updatedAt` : marquer n'est pas modifier le plat.

### Deux fichiers d'icône : contour et plein

`public/icons/common/heart.svg` (copie du contour fourni) et `heart-filled.svg` (même tracé, rempli). Les deux sont rendus par `MaskIcon` : contour en `currentColor`, plein en `#e74c3c`.

*Pourquoi deux fichiers* : un masque CSS ne sait pas remplir un contour. Garder un seul tracé décliné en deux variantes assure que les deux cœurs ont exactement la même silhouette.

*Alternative écartée* : un SVG en ligne avec `fill` piloté par CSS — contraire à la règle « pas de SVG collé dans le JSX », et seul cas de l'application.

### Le cœur est un bouton à part dans la ligne de la liste

Dans `.recipe-list-item`, le cœur s'insère entre le lien et la corbeille, en `.icon-button`, avec `aria-pressed` et un `aria-label` qui nomme le plat (« Ajouter Bolognaise aux favoris » / « Retirer Bolognaise des favoris »).

*Pourquoi hors du lien* : un bouton dans un lien est invalide et obligerait à bloquer la navigation. Deux éléments frères, comme la corbeille aujourd'hui.

*Ordre* : cœur puis corbeille, le geste anodin avant le geste destructeur, à droite comme sur une entrée du planning.

### Le tri des favoris se fait dans la fenêtre, à l'affichage

`MealPickerModal` trie la liste filtrée : favoris d'abord, puis nom (`localeCompare` en français). Le repository garde son tri par nom.

*Pourquoi à l'affichage* : le tri ne vaut que pour cette fenêtre ; la liste des plats reste alphabétique. Le filtre de recherche s'applique avant le tri, donc les favoris correspondants restent en tête.

### Le cœur est aussi un bouton dans la fenêtre du planning

Chaque résultat devient une ligne de deux boutons frères : `button.picker-result` (choisir le plat) et le cœur en `.icon-button` (basculer le favori), même rendu et mêmes libellés accessibles que dans la liste des plats.

*Pourquoi deux boutons frères* : un bouton dans un bouton est invalide, et un clic sur le cœur ne doit pas choisir le plat.

*L'ordre est figé pendant que la fenêtre est ouverte* : il est calculé au chargement des plats, à l'ouverture. Marquer un plat met son cœur à jour aussitôt mais ne le déplace pas ; le nouvel ordre vaut à la prochaine ouverture. Sinon la ligne sauterait en tête sous le doigt, et le plat qu'on s'apprêtait à choisir changerait de place.

*Mise à jour* : la fenêtre charge aujourd'hui les plats une fois, sans lecture réactive. Après `setFavorite`, elle met à jour le plat dans son état local plutôt que de recharger, ce qui préserve l'ordre figé.

Un composant `FavoriteButton` (cœur + `aria-pressed` + libellé) sert aux deux écrans plutôt que d'être recopié.

### Le vocabulaire est remplacé texte par texte

Chaque chaîne affichée ou annoncée contenant « recette » est réécrite. Correspondances retenues :

| Avant | Après |
|---|---|
| Recettes (onglet, titre) | Plats |
| Nouvelle recette | Nouveau plat maison |
| Recette maison (bascule du formulaire) | Plat maison |
| Rechercher une recette… | Rechercher un plat… |
| Aucune recette — créez-en une d'abord. | Aucun plat — créez-en un d'abord. |
| Créer une recette | Créer un plat |
| Supprimer cette recette ? | Supprimer ce plat ? |
| Recette introuvable. | Plat introuvable. |
| Recette (bascule du planning) | Plat |
| Aucune recette enregistrée — créez-en une dans l'onglet Recettes. | Aucun plat enregistré — créez-en un dans l'onglet Plats. |
| Aucune recette ne correspond. | Aucun plat ne correspond. |
| note « recette » dans la fenêtre du planning | « maison » |

Les commentaires du code et les identifiants ne changent pas.

## Risks / Trade-offs

- **Code et écran divergent** (« Recipe » dans le code, « plat » à l'écran) → noté dans `docs/` (vocabulaire) pour qu'un agent ne réintroduise pas « recette » dans un texte. 
- **Trois cibles dans une ligne de liste** (lien, cœur, corbeille) → `.icon-button` de taille habituelle ; la ligne de liste est plus large qu'une case du planning, où trois cibles tiennent déjà.
- **Specs existantes** : `meal-planning` parle encore de « recette » dans d'autres exigences (calories, modification d'une entrée). Seules les exigences qui nomment un libellé d'écran (le mode « Recette ») sont modifiées ; le reste décrit le comportement, pas le texte affiché.
