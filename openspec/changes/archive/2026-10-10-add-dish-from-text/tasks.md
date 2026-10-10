# Tasks

Il n'y a pas de tests automatisés dans ce projet : chaque tâche se vérifie par `npm run lint`, `npm run build` et le contrôle manuel indiqué.

## 1. Dépendance et faisabilité

- [x] 1.1 Ajouter `@huggingface/transformers` à `package.json` ; vérifier que `npm install` puis `npm run build` passent
- [x] 1.2 Relever la taille des fichiers `.wasm` du moteur ONNX fournis par la bibliothèque et retenir une variante dont chaque fichier fait moins de 25 Mio ; noter la variante et les tailles dans `docs/log.md`
- [x] 1.3 Copier ces `.wasm` dans `dist/` au build (dossier `ort/`) et pointer `env.backends.onnx.wasm.wasmPaths` dessus ; vérifier dans l'onglet Réseau qu'aucune requête ne part vers jsDelivr

## 2. Préparation des vecteurs (poste de développement)

- [x] 2.1 Écrire `scripts/embed-ciqual.mjs` : lit `assets/ciqual.sql`, vectorise `query: <nom> (<catégorie>)` avec `Xenova/multilingual-e5-small` en q8, regroupement `mean`, normalisé ; écrit `public/seed/ciqual-vectors.bin` (int8) et `public/seed/ciqual-index.json` (D2). Vérifier : le binaire fait `count × dim` octets et `ids.length === count`
- [x] 2.2 Gérer la version par empreinte : SHA-256 de `ciqual.sql`, `version + 1` si elle change, aucune écriture sinon. Vérifier : deux lancements de suite laissent les fichiers identiques ; une ligne ajoutée au SQL incrémente la version
- [ ] 2.3 Ajouter le script `embed:ciqual` à `package.json`, lancer la préparation et commiter les deux fichiers produits ; vérifier `version: 1` et `count: 3281`
- [x] 2.4 Ajouter à `scripts/convert-ciqual.mjs` le contrôle `sha256(ciqual.sql) === sourceHash`, en échec avec un message nommant `npm run embed:ciqual` ; vérifier que `npm run build` échoue après modification du SQL et repasse après revectorisation
- [x] 2.5 Documenter `embed:ciqual` et le contrôle de synchronisation dans `docs/workflow/commands.md` ; vérifier que la commande documentée s'exécute telle qu'écrite

## 3. Worker et client d'embedding

- [x] 3.1 Créer `src/workers/embedding.worker.ts` avec les messages `status`, `prepare`, `search`, `remove` (D6) et les types partagés dans `src/services/embedding/types.ts` ; vérifier que le worker est émis comme fragment séparé par `npm run build`
- [x] 3.2 Implémenter `prepare` : lecture du manifeste, chargement des vecteurs dans le cache `mealing-embedding`, contrôle de taille du binaire, chargement du modèle nommé au manifeste avec progression agrégée en octets, `navigator.storage.persist()` et `estimate()` ; vérifier dans la console la suite des messages `progress` jusqu'à `ready`
- [x] 3.3 Implémenter `search` : vectorisation des textes avec le préfixe du manifeste, produit scalaire contre les vecteurs int8, `topK` trié, liste vide pour un texte vide ; vérifier à la main que « merguez grillée », « frites », « mayonnaise » et « pain baguette » renvoient des fiches pertinentes en tête
- [x] 3.4 Implémenter `status` et `remove` (présence et taille du modèle en cache, suppression du modèle et du cache des vecteurs) ; vérifier dans l'onglet Application que les caches apparaissent puis disparaissent
- [x] 3.5 Traduire les échecs en codes `OFFLINE`, `QUOTA`, `UNSUPPORTED`, `INTERRUPTED` ; vérifier `OFFLINE` et `INTERRUPTED` en coupant le réseau avant et pendant le téléchargement, puis que la reprise ne retélécharge pas les fichiers complets
- [x] 3.6 Écrire `src/services/embedding/embeddingClient.ts` : worker unique partagé, fonctions à promesses, résultats périmés ignorés, `terminate()` au dernier consommateur ; vérifier que quitter l'écran libère le worker (onglet Sources)
- [x] 3.7 Ajouter à `ingredientRepository` l'ajout des aliments Ciqual manquants quand `ciqualIndexVersion` est en retard (`bulkAdd` des identifiants absents seulement, D5) et la résolution des candidats par `getByIds` ; vérifier en supprimant un aliment Ciqual de la base puis en préparant la recherche : il revient, et une portion corrigée ailleurs est intacte
- [x] 3.8 Ajouter la règle `runtimeCaching` `CacheFirst` pour les `.wasm` du moteur dans `vite.config.ts` ; vérifier qu'une recherche fonctionne hors ligne après un premier usage, sur le build servi par `npm run preview`

## 4. Préparation accompagnée et Réglages

- [x] 4.1 Créer le composant `EmbeddingSetup` (annonce de la taille, bouton de téléchargement, barre de progression avec `role="progressbar"` et valeurs ARIA, étape en cours, messages d'échec avec « Réessayer ») en réutilisant les classes existantes de `src/index.css` ; vérifier en thème clair et sombre à largeur mobile
- [x] 4.2 Ajouter la section « Recherche intelligente » à `SettingsScreen` : état, taille occupée, téléchargement, suppression avec `ConfirmModal` ; vérifier que la suppression libère la place sans toucher aux plats ni au planning
- [x] 4.3 Mettre à jour `CLAUDE.md` (règle 9 : trois origines, Hugging Face pour le seul modèle), `docs/architecture/overview.md` (worker, caches, démarrage), `docs/architecture/data-model.md` (clé `ciqualIndexVersion`, nouvelle fonction du repository) et `docs/design/components.md` si une classe partagée a été créée ; ajouter une ligne à `docs/log.md`

## 5. Client 1min.AI partagé

- [ ] 5.1 Lancer `graft callers requestReview --depth all` et `graft callers AiReviewError --depth all`, puis extraire l'appel réseau dans `src/services/aiClient.ts` (`chat({ apiKey, model, prompt, signal })`, `AiError`, `AiErrorCode`) ; `aiReview.ts` réexporte les anciens noms. Vérifier : l'avis de l'IA sur un jour et sur une semaine fonctionne comme avant, y compris le message sans clé

## 6. Service « texte → plat »

- [x] 6.1 Créer `src/services/dishFromText.ts` avec les types (`DishResult`, `DishLine`) et `buildDecomposePrompt(texts)` pour une liste de descriptions numérotées (consigne : objet JSON seul, contrat D9, priorité aux quantités de l'utilisateur, vocabulaire Ciqual, décomposition des aliments composés, aucune valeur nutritionnelle) ; vérifier le message tracé avec une puis trois descriptions
- [x] 6.2 Écrire `parseDecomposition` avec la validation à deux niveaux : enveloppe illisible → échec de toute l'analyse ; plat absent, en double ou à ingrédient invalide → ce plat seul en `FAILED` ; `items` vide → `NO_FOOD` ; clés inattendues ignorées. Vérifier à la main : réponse valide à trois plats, réponse entourée de texte, deuxième plat avec un `grams` nul (les deux autres passent), plat manquant, réponse contenant des calories
- [x] 6.3 Écrire `expandComposites` : `parts` → lignes au prorata, ratios renormalisés, somme égale au poids de l'aliment composé, origine rappelée, provenance héritée ; vérifier le cas « sauce samouraï 30 g → 21 / 6 / 3 g » et le cas « 50 g » donné par l'utilisateur
- [x] 6.4 Écrire `buildChoicePrompt` (listes de candidats écrites une fois par texte de recherche distinct, avec identifiant et nom ; puis les plats et leurs ingrédients) et `parseChoices` (liste de plats : nom et un identifiant ou `null` par ingrédient). Vérifier dans le message tracé qu'un texte de recherche commun à deux plats n'a qu'une liste de candidats, et qu'aucune donnée de profil ni valeur nutritionnelle n'apparaît
- [x] 6.5 Écrire `applyChoices` : appartenance de l'identifiant aux candidats de l'ingrédient, repli sur le premier candidat avec `needsReview` pour un identifiant hors liste ou inventé, un ingrédient oublié ou cité deux fois, `null` → ligne non trouvée, quantités inchangées, passage en unités quand `count` est donné et que l'aliment a une unité propre ; vérifier chaque cas avec des réponses fabriquées
- [x] 6.6 Écrire `mergeSameIngredient` (somme par aliment à l'intérieur d'un plat, estimé dès qu'une part l'est) ; vérifier le cas « mayonnaise 21 g + 10 g » et que deux plats contenant le même aliment gardent chacun leur ligne
- [x] 6.7 Écrire `analyze(texts)` enchaînant les six étapes (D9) : résultats dans l'ordre des descriptions, textes de recherche dédoublonnés avant le worker, rapport d'étape, `AbortSignal`, relance du seul appel 2 quand la décomposition est déjà là. Vérifier de bout en bout avec une description (« un sandwich avec une grande merguez sauce samouraï et une grosse frite »), puis depuis la console avec trois descriptions dont une sans aliment : deux plats `OK`, un `FAILED`, et seulement deux requêtes vers 1min.AI dans l'onglet Réseau
- [x] 6.8 Documenter le flux, les deux contrats JSON et les règles de quantité dans `docs/architecture/domain-rules.md` (section « Plat décrit en texte libre ») ; vérifier que les noms de fonctions cités existent

## 7. Écran « Décrire un plat »

- [x] 7.1 Ajouter la route `/recipes/describe` et `src/screens/recipes/DishFromTextScreen.tsx` (structure et classes de l'écran de référence), plus le second bouton flottant sur `RecipeListScreen` avec `aria-label` et `title` ; vérifier la navigation et mettre à jour `docs/architecture/routing.md`
- [x] 7.2 État de saisie : `textarea` (sans dictée ni reconnaissance vocale), exemple, bouton d'analyse inactif sur texte vide, renvoi aux Réglages sans clé, `EmbeddingSetup` si le modèle manque (texte conservé) ; vérifier chaque garde
- [x] 7.3 Appeler `analyze([texte])` et lire le seul résultat rendu (un résultat `FAILED` s'affiche comme un échec d'analyse). État d'analyse : étape en cours parmi les trois, bouton verrouillé, annulation ramenant à la saisie avec le texte ; vérifier en annulant pendant chaque étape
- [x] 7.4 État de résultat : nom modifiable, lignes (libellé compris, aliment retenu, quantité avec `≈` et « estimé », calories, « à vérifier »), totaux par `computeRecipeNutrition`, avertissement d'approximation tant qu'une ligne est estimée, rappel du texte ; vérifier en clair et en sombre à largeur mobile
- [x] 7.5 Ajustement des quantités : tailles petite / normale / grande (0,7 / 1 / 1,3 de l'estimation initiale, classe `.selected`), champ de poids qui retire la marque d'estimation, refus des poids nuls ou négatifs ; vérifier 180 g → 234 g → 180 g → 150 g
- [x] 7.6 Remplacement et suppression : fenêtre des candidats d'une ligne, repli vers `IngredientPickerModal`, suppression de ligne, fusion si l'aliment choisi est déjà présent ; vérifier que la quantité et sa provenance sont conservées
- [x] 7.7 Messages d'échec par code (`NO_KEY`, `UNAUTHORIZED`, `RATE_LIMITED`, `NETWORK`, `INVALID_RESPONSE`, `NO_FOOD`), texte conservé, relance possible après un échec du choix ; vérifier hors ligne, avec une clé fausse et avec le texte « bonjour »
- [x] 7.8 Ajouter à `src/index.css` les seules classes manquantes (marque d'estimation, sélecteur de taille, barre de progression si absente), en couleurs système et `color-mix`, et les décrire dans `docs/design/components.md`

## 8. Validation, création du plat et marque d'estimation

- [x] 8.1 Ajouter `isEstimated?: boolean` à `RecipeIngredient`, `RecipeIngredientInput` et `DraftIngredient` (champ non indexé, pas de nouvelle version Dexie) ; vérifier que `npm run build` passe et que l'export / import de `backup.ts` conserve le champ
- [x] 8.2 Extraire le calcul de `isHealthy` de `handleSubmit` (`RecipeFormScreen`) dans une fonction pure de `services/nutrition.ts`, après `graft callers` ; brancher « Valider » sur `recipeRepository.create` (plat maison, une portion, lignes avec `unitCount` et `isEstimated`) puis ouvrir `/recipes/<id>` ; `updateQuantity` du formulaire retire `isEstimated`. Vérifier : rien n'est en base avant la validation, le plat créé s'ouvre, se modifie dans le formulaire, et la création classique par `/recipes/new` est inchangée
- [x] 8.3 Afficher la marque d'estimation dans `RecipeDetailScreen` ; vérifier sur un plat issu d'un texte, puis qu'elle disparaît après correction de la quantité
- [x] 8.4 Mettre à jour `docs/architecture/data-model.md` (`RecipeIngredient.isEstimated`) et ajouter une ligne à `docs/log.md`

## 10. Retours d'usage

- [x] 10.1 Griser « Analyser » et « Valider » dès le clic et ignorer un second clic (verrou lu sans attendre le rendu) ; vérifier qu'un double clic rapide n'envoie qu'une demande de décomposition et ne crée qu'un plat
- [x] 10.2 Ajouter `Recipe.sourceText` (non indexé) et `RecipeInput.sourceText`, écrit à la validation d'un plat décrit ; afficher l'icône de l'IA à côté du nom dans `RecipeListScreen` et la description d'origine dans `RecipeDetailScreen` ; vérifier qu'un plat du formulaire n'a ni l'une ni l'autre, et que modifier un plat décrit les conserve
- [x] 10.3 Mettre à jour `docs/architecture/data-model.md`, `docs/architecture/domain-rules.md` et `docs/log.md`

## 9. Vérification d'ensemble

- [x] 9.1 `npm run lint` puis `npm run build` sans erreur
- [ ] 9.2 Parcours complet sur le build servi par `npm run preview`, à largeur mobile, en clair et en sombre : premier téléchargement avec barre de progression, analyse du sandwich, ajustement, validation, planification du plat, présence dans la liste de courses
- [x] 9.3 Contrôle réseau sur ce parcours : seules origines contactées = l'application, `huggingface.co` (et son CDN de fichiers) pendant le téléchargement, `api.1min.ai` pendant l'analyse ; aucune requête ne contient de donnée du profil
- [x] 9.4 `openspec validate add-dish-from-text --strict` sans erreur
