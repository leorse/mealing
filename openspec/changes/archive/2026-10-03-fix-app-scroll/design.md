# Design

## Context

Voir `proposal.md` — Why, pour la motivation et le mécanisme du défaut.

État actuel de la coquille, dans `src/index.css` :

```
.app-shell    height: 100dvh
.app-content  flex: 1; min-height: 0
              display: flex; flex-direction: column
              padding: 1rem; padding-bottom: 4.5rem
              (aucun overflow)
.bottom-nav   position: fixed; bottom: 0   -> hauteur ~3,3 rem
.fab          position: fixed; bottom: 5.5rem
```

Seul `WeekPlanScreen` a déjà traité le sujet pour son compte, via `.screen--wide { flex: 1; min-height: 0 }` et `.week-grid-scroll { overflow-x: auto }`. Le défilement a donc été résolu au cas par cas et jamais pour le cas général.

## Goals / Non-Goals

**Goals**

- Un conteneur de défilement unique et prévisible pour tous les écrans.
- Ne rien changer au rendu des écrans qui tiennent déjà dans le viewport.

**Non-Goals**

- Refondre la navigation ou la position de la barre fixe.
- Transformer les boutons de validation en barre d'action collée en bas : c'est une évolution d'ergonomie distincte, hors de ce correctif.
- Corriger les couleurs codées en dur du thème : traité par la change `recipe-ingredient-picker` pour la zone concernée.

## Decisions

### Le conteneur de défilement est `.app-content`, pas `.screen`

`overflow-y: auto` est posé sur `.app-content`.

*Pourquoi* : `.app-content` est le seul nœud commun à tous les écrans, et il porte déjà le `padding-bottom: 4.5rem`. Dans un conteneur de défilement, ce padding fait partie de la zone défilable et se retrouve donc à la fin du défilement, là où il doit être — ce qui corrige d'un même geste le débordement et le recouvrement par la nav.

*Alternative écartée* : mettre le défilement sur chaque `.screen`. Il faudrait alors y reporter la réserve de la nav écran par écran, et la règle serait à répéter pour tout nouvel écran. C'est précisément la dérive qui a produit le défaut.

### Les enfants d'un écran ne se compriment pas

`.screen > *` reçoit `flex-shrink: 0`.

*Pourquoi* : `.screen` et `.app-content` sont des conteneurs flex en colonne ; leurs enfants ont `flex-shrink: 1` par défaut et se tassent quand le contenu dépasse. Avec le défilement activé, la compression n'a plus lieu d'être et fausserait la hauteur des champs.

*Alternative écartée* : poser `flex-shrink: 0` sur chaque composant. Même dérive au cas par cas.

### La réserve de bas de page reste exprimée sur `.app-content`

On conserve `padding-bottom` plutôt que d'introduire un élément espaceur.

*À vérifier à l'implémentation* : la valeur actuelle de 4,5 rem couvre les ~3,3 rem de la nav. Le bouton flottant `.fab` monte lui jusqu'à `bottom: 5.5rem` ; sur les écrans qui en portent un, il peut masquer du contenu en fin de défilement. Si le cas se présente, la réserve est à ajuster sur ces écrans plutôt qu'à globaliser.

### Préserver `WeekPlanScreen`

`.screen--wide` conserve `flex: 1; min-height: 0`, ce qui le laisse occuper la hauteur disponible sans déclencher le défilement de `.app-content`. Son défilement interne reste donc le seul actif, sans imbrication.

## Risks / Trade-offs

- **Défilement imbriqué sur le planning** → `.screen--wide` borne déjà sa hauteur ; à vérifier visuellement après le changement.
- **La barre d'URL mobile fait varier `100dvh`** → `dvh` suit déjà la hauteur dynamique ; le correctif ne l'aggrave pas, mais la vérification se fait sur mobile réel, pas seulement en émulation.
- **Zone sûre iOS** → sur un appareil à encoche, la nav fixe peut passer sous l'indicateur système. Hors périmètre ici, à traiter si le cas se pose.
- **Risque global faible** : changement purement CSS, réversible en retirant les deux règles.

## Migration Plan

Aucune migration de données. Déploiement par simple livraison du CSS ; retour arrière en supprimant les règles ajoutées.
