---
type: Reference
title: Routes, navigation et état des écrans
description: Table des routes, barre de navigation, garde de profil et avancement de chaque écran.
resource: ../../src/app/router.tsx
tags: [architecture, routing, screens]
timestamp: 2026-10-04T00:00:00Z
---
# Routes et écrans

Tout est déclaré dans [app/router.tsx](../../src/app/router.tsx).

## Emboîtement

```
/onboarding                 ProfileSetupScreen   (hors coquille, sans barre de navigation)
<RequireProfile>            redirige vers /onboarding tant qu'aucun profil n'existe
  <AppLayout>               coquille : zone de contenu + barre de navigation fixe
    … toutes les autres routes
```

[RequireProfile](../../src/app/RequireProfile.tsx) rend `null` pendant le chargement (`PROFILE_LOADING`), puis redirige ou affiche. Un écran qui a besoin du profil refait le même test : `if (profile === PROFILE_LOADING || profile === undefined) return null;`.

## Routes

| Route | Écran | État |
|---|---|---|
| `/onboarding` | `onboarding/ProfileSetupScreen` | Fait |
| `/` | `home/HomeScreen` | Fait (objectif du jour) |
| `/planning` | `planning/WeekPlanScreen` | Fait |
| `/planning/:date` | `planning/DayDetailScreen` | À venir |
| `/recipes` | `recipes/RecipeListScreen` | Fait |
| `/recipes/new`, `/recipes/:id/edit` | `recipes/RecipeFormScreen` | Fait — **écran de référence** |
| `/recipes/describe` | `recipes/DishFromTextScreen` | Fait — plat décrit en texte libre |
| `/recipes/:id` | `recipes/RecipeDetailScreen` | Fait |
| `/ingredients`, `/ingredients/scan`, `/ingredients/:id` | `ingredients/*` | À venir |
| `/shopping` | `shopping/ShoppingListScreen` | Fait |
| `/nutrition`, `/nutrition/log`, `/nutrition/deviations` | `nutrition/*` | À venir |
| `/analytics` | `analytics/AnalyticsScreen` | À venir |
| `/export` | `export/ExportScreen` | À venir |
| `/settings` | `settings/SettingsScreen` | Fait (avis de l'IA : clé et modèle) |

Un écran « À venir » est une coquille : `<div className="screen"><h1>Titre</h1><p>À venir.</p></div>`.

## Barre de navigation

Six entrées, définies par `NAV_ITEMS` dans [app/AppLayout.tsx](../../src/app/AppLayout.tsx) : Accueil, Planning, Plats (route `/recipes`), Courses, Suivi, Réglages. Icône seule, libellé en `aria-label`, entrée active à pleine opacité. Détail visuel dans [layout.md](../design/layout.md).

## Ajouter un écran

1. Créer `src/screens/<domaine>/<Nom>Screen.tsx`, export par défaut, racine en `className="screen"`.
2. L'importer et l'ajouter aux enfants de `AppLayout` dans `router.tsx`. Placer les routes fixes (`/recipes/new`) avant les routes paramétrées (`/recipes/:id`).
3. Une entrée de navigation ne s'ajoute que pour un domaine de premier niveau, avec une icône dans `public/icons/nav/` (voir [icons.md](../design/icons.md)).
4. Suivre [recipe-form.md](../design/recipe-form.md) pour la structure et le style.
5. Mettre à jour le tableau ci-dessus.

## Navigation dans le code

- Liens : `<Link>` / `<NavLink>`. Après une écriture : `useNavigate()` (`navigate('/recipes/' + id)`).
- Paramètres : `useParams<{ id: string }>()`. Le même écran sert à créer et à modifier ; `const isEdit = Boolean(id)`.
