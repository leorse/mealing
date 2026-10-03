# Mealing

Application de **planification des repas et suivi nutritionnel**.

- Planifier ses repas à la semaine
- Générer automatiquement sa liste de courses
- Suivre ses apports nutritionnels (calories, macros, Nutri-Score)
- Gérer les écarts alimentaires (prévus ou imprévus)
- Visualiser ses tendances via des graphiques
- Exporter ses bilans nutritionnels en PDF
- Rechercher des aliments via [Open Food Facts](https://world.openfoodfacts.org/)

**PWA local-first** : aucune donnée ne quitte l'appareil (stockage IndexedDB), pas de backend, pas de compte. Voir [spec.md](spec.md) pour le détail complet de l'architecture.

---

## Architecture

```
mealing/
├── src/
│   ├── app/         Bootstrap, routing, layout
│   ├── screens/     Écrans de l'application
│   ├── components/  Composants réutilisables
│   ├── db/          Schéma Dexie (IndexedDB) + repositories
│   ├── services/     Nutrition, Open Food Facts, export PDF, backup
│   ├── store/        État UI (Zustand)
│   └── hooks/        Hooks (dont lecture réactive Dexie)
├── public/            Manifest PWA, icônes
└── wrangler.toml       Déploiement Cloudflare Workers
```

---

## Prérequis

| Outil | Version |
|---|---|
| Node.js | 20+ |

Aucune base de données ni backend à installer.

---

## Lancement

```bash
npm install
npm run dev
```

Ouvrir **http://localhost:5173**. Le premier lancement redirige automatiquement vers l'écran de création de profil.

## Build & déploiement

```bash
npm run deploy
```

Génère le site statique dans `dist/` (`npm run build`) puis le publie sur **Cloudflare Workers** (`wrangler deploy`, configuration dans `wrangler.toml`).
