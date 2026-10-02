# Proposal

## Why

La coquille de l'application est verrouillée à la hauteur du viewport (`.app-shell { height: 100dvh }`) sans conteneur de défilement : `.app-content` n'a pas de `overflow-y`. Tout écran plus haut que l'écran déborde de sa boîte, de sorte que le `padding-bottom: 4.5rem` censé dégager la barre de navigation se retrouve au milieu du défilement au lieu d'en être la fin. En bas de page, la nav `position: fixed` recouvre les derniers ~3,3 rem de contenu et capte les clics.

Conséquence observée : sur l'écran de saisie d'une recette, le bouton « Créer » est invisible et inatteignable dès que quelques ingrédients sont ajoutés. Le symptôme touche tous les écrans qui s'allongent, pas seulement celui-là.

## What Changes

- `.app-content` devient un véritable conteneur de défilement vertical, afin que son `padding-bottom` réserve l'espace de la barre de navigation **à la fin** du défilement.
- Le dernier élément de n'importe quel écran reste accessible et cliquable, quelle que soit la hauteur du contenu.
- Les enfants directs d'un écran ne sont plus compressés par le flex pour tenir dans la hauteur du viewport.
- Aucun changement de mise en page sur les écrans qui tiennent déjà dans l'écran, ni sur `WeekPlanScreen`, qui gère déjà son propre défilement interne (`.screen--wide` + `.week-grid-scroll`).

Pas de changement cassant.

## Capabilities

### New Capabilities

- `app-shell-layout`: comportement de défilement et d'occupation de l'espace de la coquille applicative (zone de contenu, barre de navigation fixe, accessibilité du bas de page).

### Modified Capabilities

<!-- Aucune : le projet n'a pas encore de spec existante. -->

## Impact

- `src/index.css` : règles `.app-content`, et marge de sécurité sous la barre de navigation.
- Aucun changement de composant React : `AppLayout` et les écrans restent inchangés.
- Écrans bénéficiaires : `RecipeFormScreen`, `ProfileSetupScreen`, `AddMealScreen`, `SettingsScreen`, `IngredientSearchScreen`, `IngredientDetailScreen`, `RecipeListScreen`, `RecipeDetailScreen`, `ShoppingListScreen`, `DailyLogScreen`, `DashboardScreen`, `DeviationScreen`, `AnalyticsScreen`, `ExportScreen`, `BarcodeScanScreen`, `DayDetailScreen`.
- À vérifier : interaction avec le bouton flottant `.fab` (`position: fixed; bottom: 5.5rem`), qui ne doit masquer aucun contenu en fin de défilement.
