# Mealing — Guide de lancement

## Architecture

```
mealing/
├── mealing-backend/    Spring Boot (Java 21)
├── mealing-mobile/     Expo React Native (testable sur PC via navigateur)
└── docker-compose.yml  PostgreSQL + pgAdmin + Backend
```

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- [Java 21 + Maven](https://adoptium.net/) (pour compiler le backend sans Docker)

---

## Lancement rapide (tout Docker)

```bash
# Depuis c:/prog/regime/
docker-compose up -d
```

- Backend API : http://localhost:8080
- Swagger UI  : http://localhost:8080/swagger-ui.html
- pgAdmin     : http://localhost:5050  (admin@mealing.local / admin)

---

## Lancement développement (recommandé pour tester sur PC)

### 1. Base de données seule (Docker)

```bash
docker-compose up -d postgres
```

### 2. Backend (terminal 1)

```bash
cd mealing-backend

# Windows
mvnw.cmd spring-boot:run

# ou si Maven installé
mvn spring-boot:run
```

Le backend démarre sur http://localhost:8080  
Variable requise : `JWT_SECRET` (défaut déjà configuré pour le dev)

### 3. Frontend — Test sur PC (terminal 2)

```bash
cd mealing-mobile
npm install
npx expo start --web
```

Ouvrir http://localhost:8081 dans le navigateur.  
Toutes les fonctionnalités sont disponibles sur PC sauf le scan code-barres (webcam non implémentée).

---

## Créer les wrappers Maven (Windows)

```bash
cd mealing-backend
mvn wrapper:wrapper
```

---

## Variables d'environnement backend

| Variable | Défaut | Description |
|---|---|---|
| `DB_USER` | `mealing` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | `mealing` | Mot de passe PostgreSQL |
| `JWT_SECRET` | *(clé de dev)* | Clé secrète JWT (changer en prod) |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/mealing` | URL JDBC |

---

## Premier lancement — Créer un compte

1. Aller sur http://localhost:8081 (frontend web)
2. Cliquer "S'inscrire"
3. Saisir email + mot de passe
4. Remplir le profil (taille, poids, objectif)

---

## Structure des données

La base de données est créée automatiquement par Flyway au premier lancement :
- `V1__init_schema.sql` : Tables principales
- `V2__indexes.sql` : Index de performance  
- `V3__seed_ingredients.sql` : ~50 aliments courants pré-chargés

---

## API REST (Swagger)

Documentation complète disponible sur :
http://localhost:8080/swagger-ui.html

---

## Notes iOS / Android (pour plus tard)

Pour Android physique ou émulateur :
```bash
npx expo start --android
```

Le backend est automatiquement accessible via `10.0.2.2:8080` depuis l'émulateur Android.
