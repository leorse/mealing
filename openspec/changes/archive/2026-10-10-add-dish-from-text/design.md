# Design

## Context

Voir [proposal.md](proposal.md) pour la motivation. Ce qui existe et contraint l'approche :

- **Ciqual est déjà sur l'appareil**, dans la table IndexedDB `ingredients` (3 281 aliments, `source: 'CIQUAL'`). `assets/ciqual.sql` est converti en `public/seed/ciqual.json` par [convert-ciqual.mjs](../../../scripts/convert-ciqual.mjs) à chaque `dev` et `build`, puis chargé une seule fois par [seed.ts](../../../src/db/seed.ts). Il n'y a donc pas de base SQL à embarquer : la « base Ciqual allégée » du besoin est cette table.
- **Les aliments n'ont pas de code Ciqual** : leur clé est un UUID stable, fixé dans `ciqual.sql`. La « liste des codes » du besoin est la liste de ces identifiants.
- **Le « groupe » Ciqual** est le champ `category` (catégories de l'application : « Viandes & Poissons », « Légumes »…).
- **Le client 1min.AI existe** dans [aiReview.ts](../../../src/services/aiReview.ts) (`requestReview`, un seul appelant : `WeekPlanScreen`). Requête non diffusée, réponse dans `aiRecord.aiRecordDetail.resultObject`, erreurs typées `NO_KEY` / `UNAUTHORIZED` / `RATE_LIMITED` / `NETWORK` / `INVALID_RESPONSE`. Clé et modèle dans `appMeta` via `settingsRepository`.
- **Le formulaire de plat** ([RecipeFormScreen.tsx](../../../src/screens/recipes/RecipeFormScreen.tsx)) sait déjà afficher des lignes, changer une quantité, compter en unités et calculer la nutrition (`computeRecipeNutrition`).
- **Hébergement** : fichiers statiques sur Cloudflare Workers ([wrangler.toml](../../../wrangler.toml)), 25 Mio maximum par fichier — d'où le modèle (118 Mo) hors de l'application.
- **Précache du service worker** : `js, css, html, png, svg, woff2` seulement ([vite.config.ts](../../../vite.config.ts)). Ni JSON, ni binaire, ni WebAssembly.
- **Règle 9 de `CLAUDE.md`** : deux origines réseau autorisées aujourd'hui.

## Goals / Non-Goals

**Goals:**

- Une recherche sémantique réutilisable (`texte → candidats Ciqual`), indépendante de l'écran qui s'en sert.
- Un flux « texte → plat » dont chaque étape est une fonction pure testable à la main, les effets (réseau, worker) étant isolés.
- Zéro logique et zéro stockage côté serveur.
- Aucune nouvelle version du schéma Dexie.

**Non-Goals:**

- Remplacer la recherche d'ingrédient par nom (`ingredient-search`) par la recherche sémantique.
- Vectoriser les aliments personnels ou importés d'Open Food Facts.
- Dictée ou reconnaissance vocale, photo du repas, historique des descriptions.
- Enregistrer un repas directement au planning ou au journal : le résultat est un plat.
- Générer une semaine de plats, et tout écran affichant plusieurs plats analysés : changement futur. Seul le service est prévu pour, pas l'interface.
- Accélération WebGPU, exécution multi-fil du modèle.

## Decisions

### D1 — Bibliothèque : `@huggingface/transformers`, moteur WebAssembly

`pipeline('feature-extraction', <modèle>, { dtype: 'q8' })`, regroupement `mean`, normalisation activée. La même bibliothèque sert dans le navigateur (onnxruntime-web) et dans le script Node (onnxruntime-node), ce qui garantit même tokeniseur, même regroupement, même préfixe.

*Alternatives écartées* : onnxruntime-web seul (il faudrait réécrire tokeniseur et regroupement) ; WebLLM / WebGPU (support mobile inégal, gain inutile pour quelques phrases courtes).

**Les fichiers `.wasm` du moteur sont servis par l'application**, pas par jsDelivr (comportement par défaut de la bibliothèque) : `env.backends.onnx.wasm.wasmPaths` pointe vers un dossier copié dans `dist/` au build. Raison : ne pas ajouter une quatrième origine réseau. À vérifier à l'implémentation : chaque fichier fait moins de 25 Mio ; retenir la variante sans JSEP/WebGPU si la variante par défaut dépasse.

### D2 — Format des vecteurs

- `public/seed/ciqual-vectors.bin` : `Int8Array` brut, `count × dim` octets, ligne par ligne (3 281 × 384 = 1 259 904 octets).
- Quantification : vecteur normalisé (norme 1) × 127, arrondi, borné à [−127, 127]. Pas de facteur d'échelle par vecteur : le classement par produit scalaire avec une requête normalisée en flottants reste celui du cosinus à l'erreur d'arrondi près.
- `public/seed/ciqual-index.json` :

```json
{
  "version": 1,
  "sourceHash": "sha256 de assets/ciqual.sql",
  "model": "Xenova/multilingual-e5-small",
  "dtype": "q8",
  "prefix": "query: ",
  "pooling": "mean",
  "dim": 384,
  "count": 3281,
  "ids": ["105738b5-…", "…"]
}
```

*Alternative écartée* : float32 (5 Mo) — quatre fois plus lourd pour un gain de classement négligeable à cette échelle.

### D3 — Texte vectorisé et préfixe

Côté base : `query: <nom> (<catégorie>)`. Côté requête : `query: <texte de recherche>`. Le même préfixe `query: ` des deux côtés, comme demandé : e5 recommande `query:` pour la similarité symétrique entre textes courts de même nature, ce qui est le cas (nom d'aliment contre nom d'aliment). Le préfixe est lu dans le manifeste, jamais écrit en dur dans le worker.

### D4 — Version et synchronisation

- `scripts/embed-ciqual.mjs` calcule le SHA-256 de `ciqual.sql`. Si l'empreinte diffère de celle du manifeste existant : revectorisation complète et `version + 1`. Sinon : sortie sans rien écrire.
- `convert-ciqual.mjs` (lancé par `predev` et `prebuild`) compare l'empreinte de `ciqual.sql` à `sourceHash` et **échoue** en cas d'écart, en nommant `npm run embed:ciqual`. La vectorisation elle-même n'est pas mise dans `prebuild` : elle dure plusieurs minutes et télécharge le modèle.
- Les deux fichiers de vecteurs sont **commités** : le build de déploiement ne doit pas dépendre de Hugging Face.

*Alternative écartée* : numéro de version tenu à la main dans deux fichiers — c'est précisément l'oubli que l'empreinte rend impossible.

### D5 — Base de l'appareil en retard sur le manifeste

`ensureCiqualSeed` ne charge Ciqual qu'une fois : un appareil déjà installé ne reçoit pas les aliments ajoutés ensuite. Nouvelle clé `appMeta` `ciqualIndexVersion`. Si elle est absente ou inférieure à `manifest.version` : chargement de `ciqual.json`, `bulkAdd` des seuls identifiants absents (jamais de `bulkPut`, qui écraserait les portions corrigées, cf. le commentaire de `ensureCiqualPortions`), puis écriture de la version. Fait par une fonction de `ingredientRepository` appelée à la préparation de la recherche, pas au lancement de l'application.

Les candidats sont résolus par `ingredientRepository.getByIds` ; un identifiant introuvable est écarté.

### D6 — Web Worker d'embedding

`src/workers/embedding.worker.ts`, créé par `new Worker(new URL(…, import.meta.url), { type: 'module' })`. Il détient le modèle et les vecteurs ; le fil d'interface ne voit que des messages :

| Message | Réponse |
|---|---|
| `status` | `{ modelCached, sizeBytes }` |
| `prepare` | flux `progress { loaded, total, stage }`, puis `ready` ou `error { code }` |
| `search { texts, topK }` | `{ results: { id, score }[][] }` |
| `remove` | `done` |

Façade `src/services/embedding/embeddingClient.ts` : fonctions à promesses, un seul worker partagé, `terminate()` quand le dernier écran consommateur se démonte (libère la mémoire du modèle, ≈ 120 Mo). Annulation d'une recherche : le résultat est ignoré côté client (identifiant de requête), le worker n'étant pas interrompu pour quelques dizaines de millisecondes.

Recherche : produit scalaire de la requête contre les 3 281 lignes, tri partiel des `topK`. Environ 1,3 million de multiplications par requête : pas d'index approché nécessaire.

**Écart assumé avec le besoin** : le *calcul nutritionnel* reste sur le fil d'interface, par `computeRecipeNutrition` — c'est une somme sur une dizaine de lignes, déjà utilisée ainsi par le formulaire. Le worker ne porte que ce qui est coûteux.

### D7 — Téléchargement, cache, stockage

- **Modèle** : cache géré par la bibliothèque (Cache API, `env.useBrowserCache = true`, `env.allowLocalModels = false`). Présence testée en interrogeant ce cache pour le fichier ONNX du modèle nommé au manifeste. Progression : `progress_callback`, octets agrégés sur tous les fichiers.
- **Reprise** : la bibliothèque met en cache fichier par fichier ; un fichier interrompu est repris de zéro, les fichiers complets ne sont pas retéléchargés.
- **Vecteurs et manifeste** : `fetch` par le worker, rangés dans un cache `mealing-embedding`. Le manifeste est redemandé au réseau à chaque préparation quand il y en a (il est petit et porte la version) ; le binaire n'est retéléchargé que si la version a changé.
- **`.wasm` du moteur** : règle `runtimeCaching` `CacheFirst` dans `vite.config.ts`. Pas de précache : cela imposerait plus de 10 Mo à tous les utilisateurs dès l'installation.
- **Stockage persistant** : `navigator.storage.persist()` au lancement du téléchargement ; résultat ignoré s'il est négatif. `navigator.storage.estimate()` avant téléchargement pour le cas « espace insuffisant ».
- **Déclenchement** : à la première utilisation de la fonction, sur bouton, et non au lancement de l'application. **Écart assumé avec le besoin** (« au premier lancement ») : Mealing a d'autres usages, et imposer 120 Mo — éventuellement en données mobiles — à qui n'utilisera pas la description libre n'est pas acceptable.
- **Suppression** (Réglages) : suppression des entrées du modèle dans le cache de la bibliothèque et du cache `mealing-embedding`.

Codes d'erreur de préparation : `OFFLINE`, `QUOTA`, `UNSUPPORTED`, `INTERRUPTED`.

### D8 — Client 1min.AI partagé

Extraction de la partie réseau de `requestReview` dans `src/services/aiClient.ts` : `chat({ apiKey, model, prompt, signal }) → Promise<string>`, avec la classe d'erreur et ses codes (renommés `AiError` / `AiErrorCode`, `aiReview.ts` les réexportant sous leurs anciens noms pour ne pas toucher `WeekPlanScreen`). `signal` (`AbortController`) sert l'annulation. Les traces `console.log` du message et de la réponse sont conservées, sans la clé.

### D9 — Flux « textes → plats », par lot dès le départ

Le service ne connaît pas le cas « un seul plat » : il prend une liste de descriptions et rend une liste de résultats. L'écran de ce changement appelle `analyze([texte])` ; la génération d'une semaine (changement futur) appellera la même fonction avec tous ses plats. Aucun contrat JSON, type ni fonction n'aura à changer.

`src/services/dishFromText.ts`, fonctions pures sauf `analyze` :

```
analyze(texts: string[]) → DishResult[]        (même ordre, même longueur que texts)
  1. buildDecomposePrompt(texts)      → chat → parseDecomposition      (1 appel pour tous les plats)
  2. expandComposites(dish)           (pur, par plat : proportions → lignes)
  3. embeddingClient.search(textes de recherche distincts, 10) → getByIds   (1 lot pour tous les plats)
  4. buildChoicePrompt(dishes, candidates) → chat → parseChoices        (1 appel pour tous les plats)
  5. applyChoices(dish, candidates, choices)   (pur, par plat : contrôles + repli)
  6. mergeSameIngredient(dish)        (pur, par plat)
```

```ts
type DishResult =
  | { status: 'OK'; text: string; name: string; lines: DishLine[] }
  | { status: 'FAILED'; text: string; code: 'NO_FOOD' | 'INVALID_RESPONSE' };
```

Chaque `DishLine` garde ses candidats, pour que l'écran puisse proposer d'en changer sans nouvelle recherche.

**Contrat de l'appel 1** — la demande numérote les descriptions à partir de 1 ; la réponse est un objet JSON seul, un élément de `dishes` par description :

```json
{
  "dishes": [
    {
      "dish": 1,
      "name": "Sandwich merguez frites",
      "items": [
        {
          "label": "grande merguez",
          "query": "merguez grillée",
          "state": "CUIT",
          "grams": 90,
          "count": null,
          "source": "ESTIMATE",
          "confidence": "HIGH",
          "parts": null
        },
        {
          "label": "sauce samouraï",
          "query": "sauce samouraï",
          "state": "AUTRE",
          "grams": 30,
          "count": null,
          "source": "ESTIMATE",
          "confidence": "MEDIUM",
          "parts": [
            { "query": "mayonnaise", "state": "AUTRE", "ratio": 0.7 },
            { "query": "ketchup", "state": "AUTRE", "ratio": 0.2 },
            { "query": "harissa", "state": "AUTRE", "ratio": 0.1 }
          ]
        }
      ]
    }
  ]
}
```

`state` ∈ `CRU | CUIT | FRIT | AUTRE` ; `source` ∈ `USER | ESTIMATE` ; `confidence` ∈ `HIGH | MEDIUM | LOW` ; `count` renseigné seulement pour un nombre d'unités ou une fraction donné par l'utilisateur. Les ratios sont renormalisés à 1. Toute clé inattendue — dont une éventuelle valeur nutritionnelle — est ignorée.

**Validation à deux niveaux** (à la différence de `parseReview`, tout ou rien) :

- *Enveloppe* : JSON introuvable ou `dishes` absent → `INVALID_RESPONSE` pour toute l'analyse.
- *Par plat* : plat absent de la réponse, cité deux fois, ou dont un ingrédient est invalide (`query` vide, `grams ≤ 0`, énumération inconnue, `ratio ≤ 0`) → ce plat seul passe en `FAILED / INVALID_RESPONSE` ; `items` vide → `FAILED / NO_FOOD`. Les autres plats continuent. Un numéro de plat inconnu est ignoré.

**Recherche par lot** : les textes de recherche de tous les plats sont dédoublonnés (casse et espaces ignorés) avant l'envoi au worker ; « riz blanc cuit » présent dans quatre plats n'est vectorisé qu'une fois.

**Contrat de l'appel 2** — la demande comporte deux parties : les **listes de candidats, une par texte de recherche distinct**, chaque candidat avec son identifiant et son nom ; puis les **plats**, chacun avec ses ingrédients (rang, libellé, état, poids, texte de recherche renvoyant à sa liste). Une liste de candidats n'est donc écrite qu'une fois, même si dix plats s'y réfèrent. La réponse est la liste des plats, un identifiant par ingrédient :

```json
{
  "dishes": [
    {
      "dish": 1,
      "name": "Sandwich merguez frites",
      "ingredients": [
        { "item": 1, "id": "3b217e2b-a218-4be4-bda1-df095b337c5d" },
        { "item": 2, "id": null }
      ]
    }
  ]
}
```

`id: null` = aucun candidat ne convient. `dish` et `item` sont les rangs de la demande. Le nom renvoyé remplace celui de l'appel 1 s'il est non vide.

Les identifiants sont les UUID de la table `ingredients` (36 caractères). *Alternative écartée* : numéroter les candidats de 1 à 10 et ne faire renvoyer qu'un numéro — demande plus courte et recopie plus sûre, mais le besoin demande que l'IA trie et renvoie des identifiants Ciqual ; le contrôle ci-dessous couvre le risque d'un identifiant mal recopié. À reconsidérer si la taille des demandes d'une semaine entière pose problème (voir Risques).
**Quantités intactes par construction** : l'appel 2 ne reçoit les quantités qu'à titre d'information et sa réponse n'en contient pas ; `applyChoices` ne lit que `dish`, `item` et `id`. Le contrôle exigé par la spec est une assertion sur les lignes avant / après `applyChoices`.

**Repli par ingrédient** : identifiant absent de la liste des candidats de cet ingrédient (y compris inventé, mal recopié, ou pris dans la liste d'un autre ingrédient), ingrédient oublié ou cité deux fois, plat entier oublié → premier candidat sémantique, ligne marquée `needsReview`. Seule une réponse entièrement illisible fait échouer l'étape (`INVALID_RESPONSE`), la décomposition étant alors gardée en mémoire pour une relance qui ne refait que l'appel 2.
**Nombre d'unités** : si `count` est renseigné, `source === 'USER'` et que l'aliment retenu a une unité propre (`hasOwnUnit` de [portions.ts](../../../src/services/portions.ts)), la ligne prend `unitCount = count` et `quantityG = count × portionG`. Sinon `quantityG = grams`.

### D10 — Écran, validation et création du plat

- Route `/recipes/describe`, écran `src/screens/recipes/DishFromTextScreen.tsx`, structure et classes de l'écran de référence. Trois états : saisie, analyse en cours, résultat. L'écran de préparation du modèle est un composant partagé (`EmbeddingSetup`) réutilisé dans les Réglages.
- Entrée : second bouton flottant sur `RecipeListScreen`, à côté de celui qui mène à `/recipes/new`, avec l'icône `ia`.
- Saisie : un `textarea` ordinaire. Ni dictée ni reconnaissance vocale.
- Ligne de résultat : libellé compris, aliment retenu, quantité (`≈` et mention « estimé » si estimée), calories, mention « à vérifier » en orange `#f39c12`, trois boutons de taille (classe `.selected`), champ de poids, bouton « changer d'aliment » ouvrant une fenêtre listant la dizaine de candidats avec repli vers `IngredientPickerModal`.
- Tailles : facteurs 0,7 / 1 / 1,3 appliqués à l'estimation **initiale** gardée sur la ligne, arrondi à l'entier. Pour une ligne comptée en unités (toujours `USER`), pas de tailles.
- « Valider » : `recipeRepository.create` directement, avec `kind: 'RECIPE'`, une portion, et les valeurs par défaut du formulaire pour les autres champs (temps, difficulté), puis `navigate('/recipes/<id>')`. Le calcul de `isHealthy`, aujourd'hui dans `handleSubmit` de `RecipeFormScreen`, est extrait dans une fonction pure de `services/nutrition.ts` appelée par les deux écrans. Rien n'est écrit en base avant la validation.
- `RecipeFormScreen` n'est pas modifié dans son comportement : il sert ensuite à retoucher le plat comme n'importe quel autre.
### D12 — Origine du plat et verrou des actions

- Champ optionnel non indexé `Recipe.sourceText?: string` : la description saisie. Sa seule présence dit que le plat vient de l'IA ; pas de booléen à côté. Écrit par « Valider », absent de ce que le formulaire envoie : `recipeRepository.update` fusionne, donc il survit à une modification (comme `isFavorite`).
- Liste des plats : `MaskIcon` `ia.svg` avec `label` à côté du nom. Détail : une `.card` reprenant la description.
- Double clic : `handleAnalyze` attendait l'état du modèle avant de changer de phase, ce qui laissait passer un second clic. Un verrou (`busyRef` lu tout de suite, `isBusy` pour griser) couvre « Analyser » et « Valider » dès le clic.

### D11 — Marque d'estimation persistée

Champ optionnel non indexé `RecipeIngredient.isEstimated?: boolean` (absent = non estimé), donc sans nouvelle version Dexie. Transporté par `RecipeIngredientInput`, `DraftIngredient` et `backup.ts` (qui exporte les lignes entières). `updateQuantity` du formulaire le retire. Affichage dans `RecipeDetailScreen` par le même préfixe `≈`.

## Risks / Trade-offs

- [Mémoire : le modèle occupe ≈ 120 Mo dans le worker ; un téléphone modeste peut tuer l'onglet] → chargement seulement sur l'écran qui en a besoin, `terminate()` à la sortie, erreur `UNSUPPORTED` attrapée et expliquée.
- [iOS peut purger le Cache API d'une PWA inutilisée malgré `persist()`] → la présence du modèle est retestée à chaque ouverture ; l'écran de préparation réapparaît.
- [Écart numérique entre onnxruntime-node (préparation) et onnxruntime-web (requêtes)] → même fichier ONNX q8 des deux côtés ; l'écart résiduel est très inférieur à l'arrondi int8. Vérification manuelle de quelques requêtes de référence dans les tâches.
- [Catégories de l'application peu discriminantes (un abricot est en « Légumes »)] → le nom domine le vecteur ; la catégorie reste, comme demandé. À revoir si les candidats se dégradent : c'est un simple changement de texte et une version de plus.
- [Qualité du JSON selon le modèle 1min.AI choisi] → consigne « un objet JSON seul », extraction tolérante du premier objet, validation stricte, message `INVALID_RESPONSE` avec relance.
- [Deux requêtes facturées par analyse] → deux demandes en tout, quel que soit le nombre de plats ; aucune relance automatique.
- [Taille des demandes par lot : une semaine d'une vingtaine de plats représente une centaine d'ingrédients, donc jusqu'à un millier de candidats dans l'appel 2, et une réponse longue] → listes de candidats écrites une fois par texte de recherche distinct ; dix candidats et non quinze. Ce changement ne fixe pas de plafond : le changement « semaine » décidera, mesures à l'appui, s'il découpe en plusieurs analyses ou passe aux numéros de candidats. Le découpage ne demande aucune modification d'`analyze`.
- [Taille des `.wasm` au-delà de 25 Mio] → vérifiée par une tâche dédiée avant tout le reste du lot embedding.
- [Précision : les quantités estimées peuvent s'écarter de ±30 %] → marquage systématique, avertissement sur le total, ajustement en un appui. Le choix de la fiche Ciqual pèse bien moins.
- [Le manifeste liste 3 281 UUID, ≈ 130 Ko] → acceptable ; mis en cache.

## Migration Plan

1. Livrer d'abord la capacité `on-device-food-embedding` (script, fichiers, worker, section des Réglages) : elle est inerte tant qu'aucun écran ne l'appelle.
2. Livrer ensuite `dish-from-text`.
3. Aucune migration de données. Retour arrière : retirer la route et l'entrée de la liste des plats ; les caches du modèle se suppriment depuis les Réglages ou avec les données du site. Le champ `isEstimated` déjà écrit est ignoré par une version antérieure.

## Open Questions

- Modèle 1min.AI recommandé pour cette fonction : le modèle des Réglages est utilisé tel quel ; un conseil pourra être ajouté dans les Réglages après essais, sans toucher aux specs.
- Formulation exacte des deux consignes : à affiner à l'usage grâce aux traces de console, comme pour l'avis de l'IA.
