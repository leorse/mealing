# Mealing — Spécification fonctionnelle (écrans & fonctionnalités)

> Document de référence listant **tout ce que l'application doit contenir** : fonctionnalités, écrans,
> sous-écrans, modales et règles métier. Complète les documents techniques `spec.md` et `mealing-specs.md`.
>
> Version : 2026-08-23 — Périmètre : Mealing mobile (Expo/React Native, Android + web) + backend Spring Boot.

---

## 1. Vision

Application personnelle de **planification des repas** et de **suivi nutritionnel**, orientée
« régime réaliste » : on planifie la semaine, on génère les courses, on suit ses calories/macros,
et surtout **on gère les écarts** (restaurant, pizza, apéro) au lieu de les subir.

Principes directeurs :

1. **Saisie rapide avant exhaustivité** — tout repas doit pouvoir être saisi en moins de 15 s (plat préparé, écart, saisie libre).
2. **Aucune donnée perdue en déplacement** — l'application Android fonctionne **hors ligne** (SQLite embarqué).
3. **Données nutritionnelles fiables** — base Ciqual (ANSES) pour le générique, Open Food Facts pour les produits de marque.
4. **Mono-utilisateur** — pas de social, pas de partage, pas de cloud imposé ; sauvegarde par fichier JSON.

---

## 2. Modes de fonctionnement

| Mode | Plateforme | Données | Usage |
|---|---|---|---|
| **Local / hors ligne** | Android (APK) | SQLite embarqué (`mealing.db`) + base Ciqual pré-chargée | Usage nominal quotidien |
| **Connecté** | Web (navigateur) / dev | API REST Spring Boot + PostgreSQL | Développement, saisie au clavier, recherche Open Food Facts en ligne |

Le basculement est automatique (`Platform.OS`) : chaque module d'API a une implémentation HTTP et une implémentation SQLite.
**Règle** : toute fonctionnalité ajoutée doit exister dans les deux implémentations, ou être explicitement
désactivée en local (ex. recherche OFF en ligne).

---

## 3. Carte des écrans

```
Racine
├── /                        Redirection (session / onboarding)
├── /auth/login              Connexion          ─┐ mode connecté
├── /auth/register           Inscription        ─┘
│
├── (tabs)  — barre d'onglets principale (8 onglets)
│   ├── Accueil              Tableau de bord du jour
│   ├── Planning             Semaine + jour + créneaux
│   ├── Recettes             Liste
│   │   ├── /recipes/new         Création
│   │   ├── /recipes/[id]        Détail
│   │   └── /recipes/edit/[id]   Édition
│   ├── Courses              Liste de courses de la semaine
│   ├── Suivi                Nutrition : jour / semaine / mois
│   ├── Ingrédients          Ma base d'ingrédients
│   ├── Plats préparés       Bibliothèque de plats
│   └── Paramètres           Profil, bases de données, sauvegarde
│
├── /ingredients/index       Ma base (accès plein écran)
│   ├── /ingredients/new         Création manuelle
│   ├── /ingredients/[id]        Fiche produit
│   ├── /ingredients/search      Recherche unifiée (locale + OFF)
│   └── /ingredients/off-search  Recherche catalogue (Générique / Marque)
│
├── /meal-slots/[id]         Détail d'un créneau repas + extras
│
├── /prepared-meals/index    Plats préparés (plein écran)
│   ├── /prepared-meals/new      Création
│   └── /prepared-meals/[id]     Détail
│
├── /restaurant-meals/new    Assistant repas restaurant (4 étapes)
│   └── /restaurant-meals/[id]   Détail d'un repas restaurant
│
└── /deviation               Déclaration d'écart
```

Charte : couleur primaire `#2ECC71`, fond `#F8F9FA`, cartes arrondies (12 px), React Native Paper,
barre d'onglets sans libellés (icônes seules), en-têtes verts.

---

## 4. Écrans — spécification détaillée

### 4.1 Authentification (mode connecté uniquement)

**`/auth/login` — Connexion**
- Logo « 🥗 Mealing » + baseline « Planifiez vos repas, atteignez vos objectifs ».
- Champs : e-mail, mot de passe. Bouton **Connexion**. Lien vers l'inscription.
- Message d'erreur en clair en cas d'échec ; jeton JWT stocké dans `AsyncStorage` (`mealing_token`).

**`/auth/register` — Créer un compte**
- Champs : e-mail, mot de passe (+ confirmation). Connexion automatique après création.

**`/` — Écran de démarrage**
- Restaure la session (`restoreSession`) puis redirige vers les onglets, ou vers la connexion.
- En mode local Android : accès direct aux onglets, sans authentification.

---

### 4.2 Onglet **Accueil** — tableau de bord

Doit afficher, pour la journée en cours :

- Salutation + date longue en français (`lundi 23 août 2026`).
- **Carte calories du jour** : consommé / objectif, barre de progression **tricolore**
  (vert < 90 %, orange 90–110 %, rouge > 110 %), calories restantes.
- **Puces macros** : protéines, glucides, lipides — valeur / objectif, code couleur par macro.
- **Repas d'aujourd'hui** : liste des créneaux planifiés, marquage ✓ pour les repas consommés ;
  message « Aucun repas planifié » si vide.
- **Raccourcis d'action** : déclarer un écart, aller au planning.
- Rafraîchissement automatique au retour sur l'onglet (`useFocusEffect`).

---

### 4.3 Onglet **Planning**

**Vue semaine**
- Navigation semaine précédente / suivante (« ‹ Semaine du 18 au 24 août 2026 › »).
- Bandeau horizontal des 7 jours (Lun→Dim) : n° du jour, nombre de plats, **code couleur d'avancement**
  (gris = vide, bleu = planifié, jaune = partiellement consommé, vert = tout consommé) ; le jour courant est mis en évidence.

**Vue jour** (jour sélectionné)
- Quatre cartes de créneaux, chacune avec emoji, libellé et couleur propre :
  🌅 Petit-déjeuner · 🍽️ Déjeuner · 🌙 Dîner · 🍎 Collation.
- Par créneau : bouton **+ Ajouter**, zone vide cliquable « Appuyer pour ajouter un repas ».
- Par repas planifié : nom (recette / plat préparé / libellé libre), nombre de portions (« × 2 »),
  calories ou mention « recette · voir détail », indice « appuyer pour extras ».
- Actions par repas : **marquer consommé** (✓), **supprimer** (corbeille), **ouvrir le détail** (extras).

**Modale d'ajout de repas** — trois sources :
1. **Recette** : recherche dans les recettes, choix du nombre de portions.
2. **Plat préparé** : sélection dans la bibliothèque, nombre de portions.
3. **Saisie libre** : libellé + calories saisies à la main.

Messages si les bases sont vides (« Aucune recette — créez-en une d'abord », « Aucun plat préparé — ajoutez-en depuis l'onglet Plats »).

**Fonctions attendues** : copier une semaine vers une autre semaine, création implicite du plan de semaine
au premier ajout, persistance du repas consommé (alimente le journal nutritionnel).

---

### 4.4 Sous-écran `/meal-slots/[id]` — Détail d'un créneau

- En-tête : type de repas + date.
- **PLAT PRINCIPAL** : nom et calories du plat planifié.
- **EXTRAS** : liste des à-côtés avec emoji par type, libellé, calories, suppression rapide (×) ;
  message « Aucun extra pour ce repas » si vide.
- **Modale « Ajouter un extra »**, trois modes :
  - *Ingrédient* : recherche dans la base + quantité en grammes ;
  - *Plat préparé* : sélection + nombre de portions ;
  - *Libre* : libellé, calories, protéines, glucides, lipides.
  - Types d'extra : 🥗 Entrée · 🥔 Accompagnement · 🍮 Dessert · 🥤 Boisson · 🍪 En-cas · ➕ Autre.
- **TOTAL du créneau** : total calorique (plat + extras), objectif du créneau, **écart signé** (+/−),
  passage en rouge au-delà de 115 % de l'objectif, avec bouton **« Déclarer comme écart »**
  qui bascule vers l'écran d'écart pré-rempli.

---

### 4.5 Onglet **Recettes**

**Liste `/recipes`**
- Barre de recherche par nom.
- Carte par recette : nom, puce difficulté (Facile / Moyen / Élaboré, code couleur),
  puce **Healthy 🌿**, nombre de portions, temps de préparation, nombre d'ingrédients.
- Suppression avec confirmation. FAB **+** → création.

**Détail `/recipes/[id]`**
- Nom, description, portions, temps de préparation / cuisson, difficulté, badge Healthy.
- **Ingrédients** : liste avec quantités.
- **Valeurs nutritionnelles** : totales et par portion (calories, protéines, glucides, lipides, fibres).
- Actions : modifier, supprimer, ajouter au planning.

**Création `/recipes/new` et édition `/recipes/edit/[id]`**
- Champs : nom, description, nombre de portions, temps préparation, temps cuisson, difficulté, indicateur Healthy.
- **Ajout d'ingrédients** : modale « Choisir un ingrédient » (recherche dans la base) + quantité.
- Lien **« Ingrédient introuvable ? »** → recherche catalogue / création d'ingrédient, avec retour à la recette en cours.
- Signalement « Introuvable dans votre base » pour un ingrédient non résolu.
- Calcul nutritionnel de la recette recalculé automatiquement à l'enregistrement.

**Import de recettes (format JSON)**
- Import d'un fichier JSON décrivant une ou plusieurs recettes (nom, portions, ingrédients, quantités, unités,
  `nutrition_override` optionnel).
- Résolution automatique des ingrédients par nom sur la base locale / Ciqual.
- Retour d'import : `SUCCESS` / `PARTIAL_SUCCESS` / `FAILED`, nombre d'ingrédients résolus,
  liste des non résolus, avertissements.
- **Écran de résolution** des ingrédients non résolus : associer manuellement, créer l'ingrédient, ou ignorer.

---

### 4.6 Onglet **Courses**

- Génération **automatique** de la liste à partir du planning de la semaine courante.
- En-tête : nom de la liste + compteur « x/y articles cochés ».
- **Regroupement par catégorie** d'ingrédient (sections triées alphabétiquement, « Autres » par défaut).
- Par article : case à cocher, libellé (barré une fois coché), quantité agrégée en grammes,
  puce **Manuel** pour les articles ajoutés à la main.
- Ajout d'un article manuel, suppression d'un article.
- Export **PDF** de la liste de courses.
- État vide : « Créez un planning pour générer votre liste de courses ».

---

### 4.7 Onglet **Suivi** (nutrition & analytics)

Sélecteur de période : **Jour / Semaine / Mois**.

**Vue Jour**
- Grand compteur calories consommées / objectif, barre de progression (rouge en dépassement),
  message « Encore N kcal » ou « Dépassement de N kcal ».
- **Macros** : protéines, glucides, lipides, fibres (objectif fibres 25 g) — valeur / objectif + barre colorée.

**Vue Semaine**
- Histogramme des calories par jour, ligne d'objectif, mise en évidence des jours dans la cible (±10 %).
- Moyenne hebdomadaire, nombre de jours dans l'objectif.

**Vue Mois**
- Tendance mensuelle des calories, message « Données mensuelles disponibles après 30 jours de suivi »
  tant que l'historique est insuffisant.

**Autres éléments attendus** : répartition des macros, historique des écarts et de leur compensation,
export PDF du bilan de la semaine.

---

### 4.8 Écran `/deviation` — Déclarer un écart

- **Type d'écart** : Imprévu / Prévu.
- **Repas rapides courants** (boutons pré-remplis) : Pizza 700 kcal · Burger 650 · Kebab 800 ·
  Dessert 400 · Apéritif 350 · Restaurant complet 900.
- Champs : description (optionnelle), calories, **compensation sur N jours** (2 par défaut).
- **Aperçu de compensation** : « Réduction de X kcal/jour pendant N jours ».
- Enregistrement daté du jour ; l'écart et sa compensation se répercutent sur les objectifs quotidiens suivants.

---

### 4.9 Onglet **Ingrédients** / `/ingredients`

**Liste « Ma base d'ingrédients »**
- Recherche, puce **Perso.** pour les ingrédients créés par l'utilisateur, calories/100 g.
- État vide : « Utilisez le bouton + pour ajouter des ingrédients ». FAB **+**.

**`/ingredients/new` — Nouvel ingrédient**
- *Informations générales* : nom, marque, catégorie.
- *Valeurs nutritionnelles pour 100 g* : calories **obligatoires**, protéines, glucides, lipides, fibres,
  sucres, sel (« Seules les calories sont obligatoires »).
- *Nutri-Score* (optionnel, A→E).

**`/ingredients/[id]` — Fiche ingrédient**
- Nom, marque, code-barres, catégorie, puce **Ingrédient perso.**, *Informations produit*,
  *Valeurs nutritionnelles pour 100 g*, Nutri-Score. Actions : modifier, supprimer.

**`/ingredients/search` — Recherche unifiée**
- Une seule barre de recherche, **debounce 400 ms**, minimum 2 caractères.
- Deux recherches lancées **en parallèle** : base locale (rapide) et Open Food Facts (plus lente),
  avec indicateur « 📦 N depuis Open Food Facts ».
- **Dédoublonnage** des résultats OFF déjà présents localement (par code-barres).
- Import d'un résultat dans la base perso en un tap.

**`/ingredients/off-search` — Recherche catalogue**
- Bascule **🥦 Générique** (Ciqual + mes ingrédients) / **🏷️ Marque (OFF)** (catalogue Open Food Facts local).
- Résultats avec nutrition pour 100 g, marquage « Disponible » / « Ajouté ».
- Bandeau d'erreur explicite si le catalogue est absent ou la recherche échoue.

**Recherche par code-barres** : import d'un produit par EAN (Open Food Facts), création directe
de l'ingrédient ou du plat préparé correspondant.

---

### 4.10 Onglet **Plats préparés**

- Bibliothèque de plats tout prêts (surgelés, conserves, plats du commerce) pour la saisie rapide.
- Liste : nom, marque, calories par portion, favoris ; état vide « Aucun plat préparé — utilisez le + pour en ajouter ».
- **`/prepared-meals/new`** : nom, marque, nombre de portions, *Valeurs nutritionnelles (par portion)*, Nutri-Score.
- **`/prepared-meals/[id]`** : détail, valeurs nutritionnelles / portion, mise en favori, édition, suppression.
- **Création depuis un code-barres** : un scan/EAN remplit automatiquement la fiche.
- Un plat préparé est utilisable comme repas planifié **et** comme extra de créneau.

---

### 4.11 Repas restaurant — assistant `/restaurant-meals/new`

Parcours en **4 étapes** avec indicateur « Étape n/4 » et retour arrière.

1. **Le restaurant** — nom (optionnel), **nom du plat (obligatoire)**, notes (accompagnements, sauce…),
   type de cuisine : 🇫🇷 Français · 🇮🇹 Italien · 🇯🇵 Japonais · 🇨🇳 Chinois · 🇹🇭 Thaï · 🇮🇳 Indien ·
   🇲🇦 Marocain · 🇺🇸 Américain · 🌍 Autre.
2. **Comment estimer ?** — trois méthodes :
   - ✏️ **Saisie directe** : calories (+ macros) approximatives ;
   - 📋 **Plat type** : choix dans une bibliothèque d'environ 80 plats courants ;
   - 🔍 **Reconstitution** : liste des ingrédients un par un (plus précis).
3. **Détails** — selon la méthode : macros libres, ou **taille de portion** (Petite / Normale / Grande)
   appliquée au plat type, ou ajout/suppression d'ingrédients reconstitués.
4. **Résumé** — récapitulatif et calories estimées avant enregistrement.

**`/restaurant-meals/[id]`** : détail du repas, *Valeurs nutritionnelles estimées*,
*Ingrédients reconstitués* (si méthode reconstitution), édition, suppression.

---

### 4.12 Onglet **Paramètres**

**Profil**
- Prénom, date de naissance, taille (cm), poids (kg).
- **Sexe** : Homme / Femme / Autre.
- **Objectif** : Perdre du poids / Maintenir / Prendre du muscle.
- **Niveau d'activité** : Sédentaire · Légèrement actif · Modérément actif · Très actif · Extrêmement actif.
- Bouton d'enregistrement avec confirmation visuelle temporaire.

**Objectifs calculés** (recalculés à chaque enregistrement)
- BMR (Mifflin-St Jeor), TDEE (BMR × facteur d'activité), calories cibles ajustées selon l'objectif,
  et répartition cible protéines / glucides / lipides.

**Catalogue Open Food Facts**
- État : « Catalogue présent » / « Catalogue absent » (`off_catalog.db`), nombre de produits.
- Instructions d'import si absent ; message « Aucune recherche OFF disponible » sinon.

**Base Ciqual (ANSES)**
- État : « Base Ciqual disponible » / « Base Ciqual non importée », instructions (`ciqual-import.jar`).

**Sauvegarde & Restauration**
- **Export** : génère `mealing-backup-AAAA-MM-JJ.json` — téléchargement sur le web,
  partage de fichier sur Android.
- **Import** : sélection d'un fichier JSON, **confirmation explicite** (« Cette action remplacera
  toutes vos données actuelles »), message de succès ou d'erreur détaillé.

---

## 5. Règles métier transverses

### 5.1 Calcul des objectifs
- **BMR** — Mifflin-St Jeor : `10 × poids(kg) + 6,25 × taille(cm) − 5 × âge + s` (`s` = +5 homme / −161 femme).
- **TDEE** = BMR × facteur d'activité (Sédentaire 1,2 → Extrêmement actif 1,9).
- **Calories cibles** = TDEE ajusté selon l'objectif (déficit pour perdre, surplus pour prendre).
- **Macros cibles** dérivées des calories cibles.

### 5.2 Calcul nutritionnel
- Toute valeur nutritionnelle d'ingrédient est stockée **pour 100 g**.
- Recette = somme des ingrédients ; valeurs par portion = total / nombre de portions.
- Créneau repas = plat principal (× portions) + somme des extras.
- Journée = somme des créneaux **consommés** + écarts du jour.

### 5.3 Écarts et compensation
- Un écart ajoute `caloriesExtra` au jour concerné et **répartit la compensation** sur `N` jours suivants
  (`caloriesExtra / N` retirées de l'objectif quotidien).
- Écart *prévu* (anticipé) vs *imprévu* (constaté) — le suivi distingue les deux.
- Détection automatique de dépassement au niveau d'un créneau (> 115 % de l'objectif) avec proposition de déclaration.

### 5.4 Sources de données ingrédients

| Source | Contenu | Disponibilité |
|---|---|---|
| **Ciqual (ANSES)** | Aliments génériques | Embarquée dans l'app Android, importable côté backend |
| **Open Food Facts (catalogue local)** | Produits de marque, code-barres | SQLite `off_catalog.db` généré par `tools/off-import` |
| **Open Food Facts (en ligne)** | Produits de marque | Mode connecté uniquement |
| **Perso.** | Créés par l'utilisateur | Toujours |

---

## 6. Récapitulatif des fonctionnalités attendues

| # | Fonctionnalité | Écran principal |
|---|---|---|
| F01 | Tableau de bord calorique du jour | Accueil |
| F02 | Planning hebdomadaire, 4 créneaux/jour | Planning |
| F03 | Ajout d'un repas : recette / plat préparé / saisie libre | Planning (modale) |
| F04 | Marquage « consommé », suppression de repas | Planning |
| F05 | Copie d'une semaine vers une autre | Planning |
| F06 | Extras par créneau (entrée, accompagnement, dessert, boisson, en-cas) | Créneau |
| F07 | Total et écart par créneau vs objectif | Créneau |
| F08 | CRUD recettes avec ingrédients et nutrition calculée | Recettes |
| F09 | Difficulté, temps, portions, indicateur Healthy | Recettes |
| F10 | Import de recettes en JSON + résolution des ingrédients | Recettes |
| F11 | Liste de courses générée depuis le planning, groupée par catégorie | Courses |
| F12 | Cochage des articles, ajout manuel, export PDF | Courses |
| F13 | Suivi jour / semaine / mois avec macros et graphiques | Suivi |
| F14 | Déclaration d'écart + compensation étalée | Écart |
| F15 | Base d'ingrédients personnelle (CRUD) | Ingrédients |
| F16 | Recherche unifiée locale + Open Food Facts | Recherche ingrédient |
| F17 | Recherche générique (Ciqual) / marque (OFF), import par code-barres | Recherche catalogue |
| F18 | Plats préparés (bibliothèque, favoris, création par EAN) | Plats préparés |
| F19 | Repas restaurant : assistant 4 étapes, 3 méthodes d'estimation | Restaurant |
| F20 | Profil + objectifs calculés (BMR / TDEE / macros) | Paramètres |
| F21 | État et import des bases Ciqual et Open Food Facts | Paramètres |
| F22 | Export / import JSON complet des données | Paramètres |
| F23 | Export PDF (bilan de la semaine, liste de courses) | Suivi / Courses |
| F24 | Fonctionnement 100 % hors ligne sur Android (SQLite) | Transverse |
| F25 | Authentification e-mail / mot de passe (mode connecté) | Auth |

---

## 7. Reste à faire / points ouverts

- Écran de **résolution des ingrédients non résolus** après import JSON (spécifié, à finaliser côté UI).
- Bouton **« Déclarer comme écart »** du détail de créneau : câbler la navigation avec pré-remplissage.
- **Graphiques** de la vue Mois : n'afficher qu'au-delà de 30 jours d'historique.
- **Scan** de code-barres par la caméra (aujourd'hui : saisie de l'EAN).
- Export PDF côté **mode local Android** (actuellement dépendant du backend).
- Pas d'`AuthController` côté backend actuellement : les écrans de connexion/inscription ne sont
  fonctionnels que si l'API d'authentification est (re)mise en place.
