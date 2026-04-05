# Mealing

Application de **planification des repas et suivi nutritionnel**.

- Planifier ses repas à la semaine
- Générer automatiquement sa liste de courses
- Suivre ses apports nutritionnels (calories, macros, Nutri-Score)
- Gérer les écarts alimentaires (prévus ou imprévus)
- Visualiser ses tendances via des graphiques
- Exporter ses bilans nutritionnels en PDF
- Rechercher des aliments depuis un catalogue Open Food Facts local

---

## Architecture

```
mealing/
├── mealing-backend/    API REST — Spring Boot 3.2 / Java 21
├── mealing-mobile/     Frontend — Expo React Native (web + Android)
├── cliqual/            Fichiers XML Ciqual 2025 (ANSES)
└── tools/
    ├── off-import/     Outil Java d'import du catalogue Open Food Facts → SQLite
    └── ciqual-import/  Outil Java d'import Ciqual XML → PostgreSQL ingredients
```

---

## Prérequis

| Outil | Version | Lien |
|---|---|---|
| Java | 21 LTS | https://adoptium.net/ |
| Maven | 3.9+ | https://maven.apache.org/ |
| Node.js | 20+ | https://nodejs.org/ |
| PostgreSQL | 14+ | https://www.postgresql.org/ |

> PostgreSQL doit tourner avec une base `mealing`, utilisateur `mealing`, mot de passe `mealing`.  
> Flyway crée automatiquement les tables au premier démarrage du backend.

---

## Lancement

### Backend

```bash
cd mealing-backend

# Compiler
mvn clean package -DskipTests

# Lancer
mvn spring-boot:run
```

Le backend démarre sur **http://localhost:8080**  
Swagger UI : http://localhost:8080/swagger-ui.html

### Frontend

```bash
cd mealing-mobile

# Installer les dépendances (première fois)
npm install --legacy-peer-deps

# Lancer sur navigateur (test PC)
npm run web
# ou
npx expo start --web
```

Ouvrir **http://localhost:8081** dans le navigateur.

---

## Catalogue Open Food Facts (import local)

Le catalogue des aliments provient d'un fichier SQLite pré-construit à partir des données Open Food Facts.  
Cet import est à faire **une seule fois** (ou à renouveler pour rafraîchir les données).

### 1. Télécharger le fichier JSONL

```
https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz
```

Décompresser l'archive (le fichier fait ~11 Go compressé, ~60-80 Go décompressé) :

```bash
# Linux / macOS
gunzip openfoodfacts-products.jsonl.gz

# Windows (PowerShell)
Expand-Archive openfoodfacts-products.jsonl.gz
# ou avec 7-Zip
```

### 2. Compiler l'outil d'import

```bash
cd tools/off-import
mvn package -q
```

### 3. Lancer l'import

```bash
# Syntaxe
java -jar tools/off-import/target/off-import.jar <fichier.jsonl> [off_catalog.db]

# Exemple — fichier décompressé dans le répertoire courant
java -jar tools/off-import/target/off-import.jar openfoodfacts-products.jsonl

# Exemple — chemin et sortie personnalisés
java -jar tools/off-import/target/off-import.jar C:\Téléchargements\openfoodfacts-products.jsonl C:\prog\regime\off_catalog.db
```

L'import filtre automatiquement les produits sans nom ni valeur calorique.  
La durée dépend du matériel (20-60 min typiquement).  
Le fichier `off_catalog.db` produit est de **~300-600 Mo**.

> Le fichier `off_catalog.db` doit ensuite être placé à la racine du projet pour que le backend puisse l'utiliser.

---

## Base Ciqual (aliments génériques)

Les aliments génériques (pain, riz, poulet…) proviennent de la base Ciqual 2025 de l'ANSES.  
Les fichiers XML sont inclus dans le répertoire `cliqual/`. L'import est à faire **une seule fois**.

### 1. Compiler l'outil

```bash
cd tools/ciqual-import
mvn package -q
```

### 2. Lancer l'import

```bash
# Syntaxe
java -jar tools/ciqual-import/target/ciqual-import.jar <répertoire-cliqual> [jdbc-url] [user] [password]

# Exemple avec les valeurs par défaut (localhost:5432, user mealing, pass mealing)
java -jar tools/ciqual-import/target/ciqual-import.jar cliqual

# Exemple avec connexion personnalisée
java -jar tools/ciqual-import/target/ciqual-import.jar cliqual jdbc:postgresql://localhost:5432/mealing mealing mealing
```

L'outil insère ~2 800 aliments Ciqual dans la table `ingredients` avec `source = 'CIQUAL'`.  
Il est idempotent (upsert par `off_id = CIQUAL_<code>`) — relancer ne crée pas de doublons.

---

## Variables d'environnement backend

Les valeurs par défaut conviennent pour le développement local.

| Variable | Défaut |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/mealing` |
| `DB_USER` | `mealing` |
| `DB_PASSWORD` | `mealing` |
| `JWT_SECRET` | *(clé de dev embarquée — à changer en prod)* |

---

## Premier lancement

1. Démarrer PostgreSQL avec la base `mealing`
2. Lancer le backend (`mvn spring-boot:run`)
3. Lancer le frontend (`npm run web`)
4. Ouvrir http://localhost:8081 → **S'inscrire**
5. Remplir le profil (taille, poids, objectif calorique)
