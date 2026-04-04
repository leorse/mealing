# Mealing

Application de **planification des repas et suivi nutritionnel**.

- Planifier ses repas à la semaine
- Générer automatiquement sa liste de courses
- Suivre ses apports nutritionnels (calories, macros, Nutri-Score)
- Gérer les écarts alimentaires (prévus ou imprévus)
- Visualiser ses tendances via des graphiques
- Exporter ses bilans nutritionnels en PDF
- Rechercher des aliments via [Open Food Facts](https://world.openfoodfacts.org/)

---

## Architecture

```
mealing/
├── mealing-backend/    API REST — Spring Boot 3.2 / Java 21
├── mealing-mobile/     Frontend — Expo React Native (web + Android)
└── docker-compose.yml  PostgreSQL local (dev)
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
