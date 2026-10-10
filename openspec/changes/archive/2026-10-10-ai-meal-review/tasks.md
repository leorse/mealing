# Tasks

> Pas de framework de test : les fonctions pures se vérifient par script, les écrans par observation dans `npm run dev`. Puis `npm run lint` et `npm run build`.
> Avant de coder : lire `docs/design/components.md`, `docs/design/icons.md` et `docs/1min.app.md`.
> Aucune clé d'API ne doit apparaître dans le code, les tests, la documentation ni les messages de commit.

## 1. Préalables

- [x] 1.1 Remplacer la clé présente dans les exemples de `docs/1min.app.md` par `YOUR_API_KEY`, ajouter le frontmatter OKF au fichier et le lier depuis `docs/index.md` ; vérifier qu'aucune chaîne de 64 caractères hexadécimaux ne subsiste dans le dépôt
- [x] 1.2 Copier `assets/ia.svg` et `assets/comment-ia.svg` dans `public/icons/common/` et les ajouter à `docs/design/icons.md`

## 2. Réglages

- [x] 2.1 Créer un `settingsRepository` (clé et modèle dans `appMeta`, lecture, écriture, effacement) et exclure la clé de `exportAllData` ; vérifier qu'une sauvegarde exportée ne la contient pas
- [x] 2.2 Remplacer la coquille de `SettingsScreen` par la section « Avis de l'IA » : clé en champ mot de passe, modèle en liste avec valeur par défaut, phrase sur les données transmises, enregistrement et effacement ; vérifier que la clé n'est jamais réaffichée en clair
- [x] 2.3 Passer `/settings` à « Fait » dans `docs/architecture/routing.md` et décrire le stockage dans `docs/architecture/data-model.md`

## 3. Demande et réponse

- [x] 3.1 Créer dans `src/services/aiReview.ts` la construction de la demande (consigne et journées en JSON, objectif sans donnée personnelle) et la signature d'une journée, en fonctions pures ; vérifier par script le contenu produit pour un jour mêlant plat maison, plat tout prêt et écart
- [x] 3.2 Ajouter la lecture de la réponse (extraction du JSON, validation tout ou rien : dates demandées, note entière de 0 à 10, commentaire, bilan pour la semaine) ; vérifier par script une réponse valide, une réponse entourée de texte ou de balises de code, une note hors bornes, un jour manquant
- [x] 3.3 Ajouter l'appel au service (`POST /api/chat-with-ai`, en-tête `API-KEY`, sans diffusion) et la traduction des échecs en cas distincts : clé absente, 401, 429, réseau ou autre statut, réponse inexploitable
- [x] 3.4 Décrire dans `docs/architecture/domain-rules.md` ce qui est transmis, le format attendu et la règle « dépassé »

## 4. Conservation

- [x] 4.1 Ajouter à `WeekPlan` les champs optionnels des avis par date et du bilan, sans toucher à `db.version(1).stores(...)` ; vérifier que l'application démarre sur une base existante
- [x] 4.2 Ajouter au repository de planning l'enregistrement des avis d'une demande (jours, et bilan pour la semaine) en une écriture, et un hook `useWeekPlan` en lecture seule ; vérifier qu'une demande d'un jour ne touche pas les autres

## 5. Planning

- [x] 5.1 Ajouter les deux icônes à l'en-tête de chaque jour et à l'en-tête de la semaine, avec `aria-label` et `title` nommant le jour ; vérifier qu'elles tiennent dans une colonne de 150 px sans chasser le nom ni le total
- [x] 5.2 Brancher l'icône IA d'un jour : demande, état en cours, enregistrement, icône inactive pour un jour vide ou pendant une requête ; vérifier qu'un second clic n'envoie rien
- [x] 5.3 Brancher l'icône IA de la semaine : une seule requête pour les jours garnis, animation de l'en-tête et de ces jours, enregistrement des avis et du bilan
- [x] 5.4 Ajouter l'animation de couleur de l'icône en cours et son repli fixe sous `prefers-reduced-motion`
- [x] 5.5 Ajouter les onze classes de teinte et les appliquer aux jours dont l'avis est à jour ; vérifier la lisibilité des repas aux notes 0, 5 et 10, en thème clair et sombre
- [x] 5.6 Griser l'icône commentaire sans avis et la rendre active avec ; même règle pour celle de l'en-tête avec le bilan

## 6. Fenêtre d'avis

- [x] 6.1 Créer `AiReviewModal` : avis d'un jour (jour, note sur 10, commentaire, mention « dépassé »), bilan de la semaine (texte et notes par jour), mention d'avis indicatif, fermeture par bouton et Échap
- [x] 6.2 Y afficher les messages d'échec, avec renvoi aux Réglages quand la clé est absente ou refusée ; vérifier qu'un échec laisse l'avis précédent consultable
- [x] 6.3 Ajouter le composant et les nouvelles classes à `docs/design/components.md`

## 7. Principe et contrôle d'ensemble

- [x] 7.1 Réécrire la règle 9 de `CLAUDE.md` et le passage correspondant de `docs/architecture/overview.md` : deux appels réseau autorisés, Open Food Facts et, sur clic explicite, 1min.AI
- [x] 7.2 Avec une clé réelle saisie dans les Réglages : demander un jour, puis la semaine ; vérifier notes, teintes, commentaires, bilan, conservation au rechargement, et l'état « dépassé » après ajout d'un repas
- [x] 7.3 Vérifier chaque échec : sans clé, avec une clé fausse, hors ligne
- [x] 7.4 Exécuter `npm run lint` et `npm run build` sans nouvelle erreur, puis ajouter une ligne à `docs/log.md`
