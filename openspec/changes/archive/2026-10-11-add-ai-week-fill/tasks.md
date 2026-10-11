# Tasks

Il n'y a pas de tests automatisés dans ce projet : chaque tâche se vérifie par `npm run lint`, `npm run build` et le contrôle manuel indiqué.

## 1. Préférences culinaires

- [x] 1.1 Ajouter à `settingsRepository` la clé `foodPreferences` avec `getFoodPreferences` et `saveFoodPreferences` (texte vide → clé supprimée), hors de `SECRET_META_KEYS` ; vérifier que la valeur survit à un rechargement et figure dans l'export de `backup.ts`
- [x] 1.2 Ajouter à `SettingsScreen` le `fieldset` « Préférences culinaires » : `textarea` de 1 000 caractères au plus avec exemple, note sur la transmission à 1min.AI, enregistrement par le bouton existant ; vérifier la saisie, l'effacement et la limite, en thème clair et sombre à largeur mobile
- [x] 1.3 Documenter la clé dans `docs/architecture/data-model.md` ; vérifier que les fonctions citées existent

## 2. Service de remplissage

- [x] 2.1 Créer `src/services/weekFill.ts` avec les types (`FillSlot`, `Proposal`) et `buildFillPrompt` (créneaux numérotés par jour nommé et repas, objectif, semaine complète jour par jour — tous les repas planifiés, collation et écarts compris, total du jour, créneaux vides écartés —, préférences si non vides, consignes de D2) ; vérifier le message tracé avec et sans préférences, qu'un jour sans créneau retenu y figure avec ses repas, et qu'il ne contient aucune donnée de profil ni date
- [x] 2.2 Écrire `parseProposals` : enveloppe illisible → `AiError`, créneau absent, en double ou incomplet → « sans proposition », numéro inconnu ignoré, aucune proposition valide → `INVALID_RESPONSE` ; vérifier chaque cas avec des réponses fabriquées
- [x] 2.3 Écrire `requestProposals` (lecture des préférences au moment de l'appel, `chat` avec `AbortSignal`, trace « Remplissage ») ; vérifier qu'une seule requête part vers 1min.AI
- [x] 2.4 Ajouter `planningRepository.addGeneratedMeals(weekStart, dishes)` : une transaction sur `recipes`, `recipeIngredients`, `weekPlans`, `mealSlots` créant les plats (avec `sourceText` et lignes `isEstimated`) puis leurs créneaux (`portions: 1`, `isDeviation: false`, `caloriesOverride`, sans `includeInShopping`) ; vérifier qu'une erreur en cours de route n'écrit rien
- [x] 2.5 Écrire `generate` : dédoublonnage des propositions de même nom et de même description, `analyze` par tranches de `MAX_DISHES_PER_ANALYSIS`, conversion des résultats (lignes avec aliment seulement, `isEstimated` forcé, nom de la proposition, calories par `computeRecipeNutrition`, `isHealthyFromItems`), appel d'`addGeneratedMeals`, retour des propositions restées sans plat ; reprise du `checkpoint` d'un `ChoiceStepError` tant que les textes n'ont pas changé. Vérifier avec des réponses simulées : huit propositions dont une en échec → sept plats et sept créneaux ; deux propositions identiques → un plat, deux créneaux
- [x] 2.6 Documenter le flux, le contrat de la demande de proposition et les règles de création dans `docs/architecture/domain-rules.md` (section « Remplissage de la semaine ») ; vérifier que les noms cités existent

## 3. Fenêtre à onglets et bilan

- [x] 3.1 Extraire le verrou `once` de `DishFromTextScreen` dans `src/hooks/useOnce.ts` après `graft callers once` ; vérifier que le double clic sur « Analyser » et « Valider » de l'écran « Décrire un plat » n'envoie toujours qu'une demande
- [x] 3.2 Créer `src/components/WeekAiModal.tsx` avec les deux onglets (`.mode-toggle`), l'onglet initial selon que la semaine a des repas, la fermeture par Échap, et l'onglet Bilan (explication, bouton « Demander le bilan » inactif sans repas) ; vérifier qu'ouvrir la fenêtre et changer d'onglet n'envoie rien
- [x] 3.3 Brancher le bouton d'en-tête de `WeekPlanScreen` sur la fenêtre (actif même sur une semaine vide, inactif pendant une demande d'avis, nouveaux `aria-label` et `title`) après `graft callers review` ; vérifier que le bilan demandé depuis l'onglet se comporte comme avant : fenêtre fermée, icônes animées, avis et bilan enregistrés, message sans clé

## 4. Onglet « Remplir la semaine »

- [x] 4.1 Grille 7 × 3 : en-têtes de jours, intitulés de repas, cases `button` avec `aria-pressed` et `aria-label`, vertes par défaut pour un créneau vide, grises et `disabled` pour un créneau garni (plat ou écart), bascule au doigt, compteur de créneaux retenus, message « rien à remplir » sur une semaine pleine ; vérifier le cas « petits-déjeuners du jeudi et du vendredi écartés » et la lisibilité en clair et en sombre
- [x] 4.2 Validation de la grille : verrou, renvoi aux Réglages sans clé, `EmbeddingSetup` si le modèle manque (créneaux conservés), puis `requestProposals` avec étape affichée et annulation ; vérifier qu'aucune demande ne part avant la fin du téléchargement et qu'un double clic n'en envoie qu'une
- [x] 4.3 Liste des propositions : ordre jours puis repas, jour, repas, nom, description, suppression par corbeille, message pour les créneaux sans proposition, retour à la grille avec ses créneaux, bouton de création inactif sur liste vide ; vérifier la suppression et le retour
- [x] 4.4 Création : verrou, `generate` avec libellé d'étape (compréhension, recherche, choix, ajout au planning), annulation tant que l'écriture n'a pas commencé, fermeture si tout a réussi, sinon liste réduite aux propositions sans plat avec message ; vérifier qu'une annulation et une coupure de réseau ne créent rien et gardent la liste
- [x] 4.5 Messages d'échec par code (`NO_KEY`, `UNAUTHORIZED`, `RATE_LIMITED`, `NETWORK`, `INVALID_RESPONSE`) pour la proposition et pour la création, relance possible sans nouvelle proposition ; vérifier hors ligne et avec une clé fausse
- [x] 4.6 Ajouter à `src/index.css` les classes de la grille (`.fill-grid`, `.fill-cell`, états `.selected` et `:disabled`), en couleurs système et `color-mix`, et décrire `WeekAiModal` et ces classes dans `docs/design/components.md`

## 6. Retours d'usage

- [x] 6.1 Bouton « Résultats » sur la grille, visible dès qu'une proposition a été reçue, qui ramène à la liste (suppressions comprises) sans nouvelle demande ; bouton de demande renommé « Nouvelle proposition » dans ce cas ; créneaux sans proposition rattachés à la liste. Vérifier qu'aller-retour grille → résultats n'envoie rien et qu'une nouvelle demande remplace la liste

## 5. Vérification d'ensemble

- [x] 5.1 `npm run lint` puis `npm run build` sans erreur
- [x] 5.2 Parcours complet à largeur mobile, en clair et en sombre : préférences saisies, semaine partiellement garnie, grille ajustée, proposition, suppression d'une proposition, création, repas présents au planning avec leurs calories, plats présents dans la liste avec l'icône de l'IA et leur description d'origine, aucun repas marqué pour les courses
- [x] 5.3 Contrôle réseau sur ce parcours : trois requêtes vers `api.1min.ai`, sans prénom, date de naissance, sexe, poids ni taille ; les préférences n'apparaissent que dans la demande de proposition
- [x] 5.4 `openspec validate add-ai-week-fill --strict` sans erreur ; ajouter une ligne à `docs/log.md`
