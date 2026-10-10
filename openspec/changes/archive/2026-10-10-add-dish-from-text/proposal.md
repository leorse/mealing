# Proposal

## Why

Créer un plat demande aujourd'hui de chercher chaque ingrédient un par un et d'en connaître le poids, ce que l'utilisateur ignore presque toujours pour un repas pris dehors (« un sandwich avec une grande merguez sauce samouraï et une grosse frite »). Une description en langage naturel suffit pourtant à une IA pour proposer les ingrédients et leurs quantités, à condition que les valeurs nutritionnelles restent celles de Ciqual et que rien ne soit hébergé côté serveur.

Le fournisseur d'IA de l'application (1min.AI) n'offre pas de modèle d'embeddings : rapprocher un ingrédient décrit librement d'un aliment Ciqual impose donc de faire la vectorisation sur l'appareil.

## What Changes

- **Recherche sémantique d'aliments sur l'appareil** : un modèle d'embeddings multilingue (`Xenova/multilingual-e5-small`, quantifié q8, environ 120 Mo) est téléchargé depuis Hugging Face par l'appareil, mis en cache, et sert à vectoriser les textes de recherche. Les vecteurs des aliments Ciqual sont précalculés sur le poste de développement et livrés comme fichiers statiques.
- **Outil de préparation** (poste de développement) : un script vectorise la base Ciqual et produit le fichier de vecteurs (int8) et son manifeste (version, modèle, liste ordonnée des aliments). Le build échoue si la base et les vecteurs ne sont plus synchronisés.
- **Téléchargement accompagné** : préparation lancée par l'utilisateur à la première utilisation, avec taille annoncée, barre de progression, demande de stockage persistant et reprise après échec. L'état du modèle se consulte et se supprime dans les Réglages.
- **Plat décrit en texte libre** : un nouvel écran où l'utilisateur saisit la description de son repas. Deux appels à l'IA encadrent la recherche sémantique locale : décomposition en ingrédients avec quantités, puis tri par l'IA des candidats trouvés sur l'appareil, qui renvoie le plat avec un identifiant d'aliment par ingrédient.
- **Plusieurs plats par analyse, dès maintenant** : l'analyse prend une liste de descriptions et rend une liste de plats, avec une seule demande de décomposition et une seule demande de choix quel qu'en soit le nombre. L'écran de ce changement n'en soumet qu'une ; la génération d'une semaine de plats (changement futur) réutilisera l'analyse telle quelle.
- **Quantités estimées ou données** : une quantité indiquée par l'utilisateur prime toujours ; une quantité estimée est signalée comme telle et s'ajuste (petite / normale / grande portion, ou poids précis).
- **Valeurs nutritionnelles calculées par l'application**, à partir des grammes et des valeurs Ciqual pour 100 g. L'IA ne fournit jamais de valeur nutritionnelle.
- **Le résultat s'affiche avec la liste des ingrédients ; l'utilisateur valide** et le plat maison est créé. Il se modifie ensuite dans le formulaire de plat existant.
- **Troisième appel réseau autorisé** : Hugging Face, pour le seul téléchargement du modèle (aucune donnée de l'utilisateur n'y est envoyée). La règle 9 de `CLAUDE.md` passe de deux à trois origines.

Aucun changement cassant : aucune table ni index nouveau, aucun écran existant modifié dans son comportement actuel.

## Capabilities

### New Capabilities

- `on-device-food-embedding` : recherche sémantique d'aliments Ciqual exécutée sur l'appareil — préparation et versionnement des vecteurs, téléchargement et cache du modèle, vectorisation des requêtes, classement des candidats hors du fil d'interface.
- `dish-from-text` : création d'un plat à partir d'une description libre — décomposition par l'IA, rapprochement avec Ciqual, contrôles, calcul nutritionnel local, relecture et ajustement des quantités, validation qui crée le plat.

### Modified Capabilities

Aucune. `dish-from-text` réutilise la clé et le modèle réglés par `ai-meal-review` et crée un plat maison au sens de `recipe-authoring`, sans changer leurs exigences.

## Impact

- **Dépendance nouvelle** : `@huggingface/transformers` (exécution ONNX en WebAssembly dans le navigateur, et en Node pour le script de préparation).
- **Nouveaux fichiers statiques** : `public/seed/ciqual-vectors.bin` (≈ 1,26 Mo), `public/seed/ciqual-index.json` (manifeste), fichiers WebAssembly du moteur ONNX servis depuis l'application.
- **Code** : nouveau Web Worker d'embedding, nouveaux services (`services/embedding/`, `services/dishFromText.ts`), client 1min.AI extrait de [aiReview.ts](../../../src/services/aiReview.ts) pour être partagé, nouvel écran et nouvelle route `/recipes/describe`, entrée depuis la liste des plats, section « Recherche intelligente » dans les Réglages, champ optionnel non indexé `RecipeIngredient.isEstimated`.
- **Scripts** : `scripts/embed-ciqual.mjs` (nouveau), contrôle de synchronisation ajouté à `scripts/convert-ciqual.mjs`.
- **Service worker** : mise en cache des vecteurs et du moteur WebAssembly hors précache.
- **Stockage sur l'appareil** : environ 120 Mo de plus une fois le modèle téléchargé.
- **Réseau** : nouvelle origine `huggingface.co` ; deux requêtes 1min.AI par plat décrit, sur clic uniquement.
- **Documentation** : `CLAUDE.md` (règle 9), `docs/architecture/` (overview, data-model, domain-rules, routing), `docs/workflow/commands.md`, `docs/log.md`.
