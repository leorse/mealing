# Tasks

> Le projet n'embarque pas de framework de test. La vérification se fait par observation dans `npm run dev`, plus `npm run lint` et `npm run build`.
> Avant de coder : lire `docs/design/recipe-form.md`, `docs/design/components.md` et `docs/design/icons.md`.

## 1. Modèle et écritures

- [x] 1.1 Ajouter à `MealSlot`, dans `src/db/schema.ts`, le champ optionnel non indexé d'état des articles (désactivé / supprimé), sans toucher à `db.version(1).stores(...)`, et vérifier que l'application démarre sur une base existante sans erreur Dexie
- [x] 1.2 Ajouter au repository de planning la lecture de tous les créneaux marqués, toutes dates confondues, et vérifier qu'elle renvoie un créneau marqué d'une semaine passée
- [x] 1.3 Ajouter la fonction qui marque ou démarque un créneau en vidant son état d'articles, la brancher sur la pastille de `WeekPlanScreen`, et vérifier que la pastille du planning se comporte comme avant
- [x] 1.4 Ajouter la fonction qui pose un état sur des articles de plusieurs créneaux en une transaction, avec démarquage du créneau quand son dernier article est supprimé ; vérifier dans les outils du navigateur le contenu du créneau après chaque cas
- [x] 1.5 Ajouter la fonction qui vide la liste (tous les créneaux marqués démarqués, états vidés, en une transaction) et vérifier qu'aucun créneau n'est supprimé
- [x] 1.6 Vider l'état des articles d'une entrée quand `MealPickerModal` l'enregistre avec une autre recette, et vérifier qu'il est conservé quand seules les calories changent
- [x] 1.7 Documenter le champ et les nouvelles fonctions dans `docs/architecture/data-model.md` et vérifier que les liens du fichier restent valides

## 2. Construction de la liste

- [x] 2.1 Créer `src/services/shopping.ts` : fonction pure qui produit les occurrences (créneaux marqués, hors écarts et recettes disparues) avec leurs lignes, quantité égale à celle de la recette, état actif ou désactivé, articles supprimés exclus ; vérifier par `npm run build` et sur un jeu saisi à la main (deux plats à 100 g de tomates → 200 g)
- [x] 2.2 Ajouter la dérivation de la vue par ingrédient : une ligne par ingrédient triée par nom, somme des quantités actives, provenance avec `×N`, détail par occurrence, plats tout prêts à part ; vérifier qu'un ingrédient commun à deux plats donne une seule ligne
- [x] 2.3 Ajouter la dérivation de la vue par plat : un bloc par occurrence trié par date puis par repas ; vérifier qu'un plat marqué deux fois donne deux blocs
- [x] 2.4 Déplacer les libellés de repas de `WeekPlanScreen` dans un module partagé et vérifier que le planning s'affiche à l'identique
- [x] 2.5 Créer `src/hooks/useShoppingList.ts` (lecture seule, chargements groupés) et vérifier que la liste se met à jour seule quand on bascule une pastille dans un autre onglet du navigateur
- [x] 2.6 Décrire les règles de la liste (source sans borne de date, quantité, états, effet sur la pastille) dans `docs/architecture/domain-rules.md`

## 3. Écran

- [x] 3.1 Remplacer la coquille de `ShoppingListScreen` : `.screen`, titre, bascule `.mode-toggle` « Par ingrédient / Par plat », sans sélecteur de semaine ; vérifier qu'un plat marqué sur une autre semaine apparaît
- [x] 3.2 Rendre la ligne d'article : bouton de courses à gauche, nom et provenance, quantité, corbeille rouge à droite ; vérifier que les deux boutons sont des cibles distinctes et atteignables au doigt à largeur mobile
- [x] 3.3 Rendre la vue par ingrédient : lignes d'article, bouton chevron de dépliage, détail par occurrence avec date complète, section « Plats tout prêts » ; vérifier que déplier ne change aucun état
- [x] 3.4 Rendre la vue par plat : un `.card` par occurrence avec nom, date, repas et ses deux boutons, lignes d'ingrédients, et bloc sans ingrédients pour un plat tout prêt
- [x] 3.5 Afficher l'état vide renvoyant au planning quand aucun plat n'est marqué, et vérifier qu'une entrée dont la recette a été supprimée ne provoque aucune erreur
- [x] 3.6 Ajouter à `src/index.css` les classes de ligne, le bouton de courses de la liste (règles communes avec la pastille du planning factorisées), l'état désactivé et la variante destructive du bouton principal, en couleurs système et sémantiques uniquement ; vérifier la lisibilité en thème clair et sombre
- [x] 3.7 Si une icône de chevron est nécessaire, l'ajouter dans `public/icons/common/`, l'afficher par `MaskIcon`, et compléter `docs/design/icons.md`
- [x] 3.8 Compléter `docs/design/components.md` avec les nouvelles classes et passer `/shopping` à « Fait » dans `docs/architecture/routing.md`

## 4. Désactiver et réactiver

- [x] 4.1 Brancher le bouton de courses d'une provenance dans le détail déplié ; vérifier que la ligne garde la quantité restante et que la provenance est barrée dans le résumé
- [x] 4.2 Brancher le bouton de courses d'une ligne d'ingrédient entière ; vérifier que l'ingrédient apparaît grisé dans chaque bloc de la vue par plat, et qu'un second clic rétablit la quantité totale
- [x] 4.3 Brancher le bouton de courses d'un plat entier et d'un ingrédient isolé dans la vue par plat ; vérifier que la vue par ingrédient ne compte plus ces quantités
- [x] 4.4 Vérifier qu'une désactivation n'ouvre aucune confirmation, ne fait disparaître aucune ligne, et laisse la pastille du planning verte

## 5. Supprimer et vider

- [x] 5.1 Brancher la corbeille d'une provenance et d'une ligne d'ingrédient entière ; vérifier que l'article disparaît des deux vues, qu'il soit actif ou grisé
- [x] 5.2 Brancher la corbeille d'un plat entier ; vérifier que le bloc disparaît, que le repas est toujours au planning et que sa pastille y est grisée
- [x] 5.3 Vérifier que supprimer un à un tous les ingrédients d'un plat fait disparaître le bloc et grise la pastille
- [x] 5.4 Vérifier que rallumer la pastille d'un plat supprimé, ou éteindre puis rallumer celle d'un plat amputé, ramène le plat complet, boutons verts
- [x] 5.5 Ajouter le bouton « Tout supprimer » avec `ConfirmModal`, masqué quand la liste est vide ; vérifier que « Non » ne change rien, que « Oui » vide la liste, articles grisés compris, et que tous les repas restent au planning, pastilles grisées
- [x] 5.6 Poser `aria-pressed` sur les boutons de courses, un `aria-label` et un `title` explicites sur chaque bouton sans texte, et vérifier l'usage au clavier (Tab, Entrée, Espace)

## 6. Contrôle d'ensemble

- [x] 6.1 Sur un planning mêlant une recette marquée deux fois, une recette partageant un ingrédient, un plat tout prêt, un écart et un plat marqué sur une semaine passée : parcourir chaque scénario de `specs/shopping-list/spec.md` et vérifier le résultat attendu
- [x] 6.2 Désactiver et supprimer des articles, recharger, ajouter un plat, remplacer la recette d'une entrée ; vérifier que les états sont conservés ou oubliés comme spécifié
- [x] 6.3 Exécuter `npm run lint` et `npm run build` sans nouvelle erreur, puis ajouter une ligne à `docs/log.md`
