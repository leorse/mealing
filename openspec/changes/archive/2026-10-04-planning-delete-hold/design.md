# Design

## Context

Voir `proposal.md` — Why.

État actuel : l'icône de suppression est un bouton de 1,35 rem, disque rouge pâle et symbole rouge vif, dont le `onClick` appelle `deleteSlot` immédiatement. Elle voisine la pastille de courses et la zone qui ouvre la modification, dans des colonnes de 150 px.

## Goals / Non-Goals

**Goals**

- Rendre la suppression volontaire sans la rendre laborieuse.
- Montrer la progression, pour que l'utilisateur comprenne qu'il doit maintenir et sache où il en est.
- Garder la suppression atteignable au clavier.

**Non-Goals**

- Une annulation après coup, qui demanderait de conserver l'entrée supprimée quelque part.
- Changer le geste de la pastille de courses ou de la modification : réversibles, un clic suffit.
- Appliquer l'appui maintenu aux autres suppressions de l'application, par exemple celle d'une recette, qui passe déjà par une confirmation.

## Decisions

### Durée d'appui de 700 ms

*Pourquoi* : assez long pour qu'un effleurement ou un clic réflexe ne déclenche rien, assez court pour ne pas donner l'impression que l'application ne répond pas. En deçà de 500 ms le geste ne protège plus de grand-chose ; au-delà d'une seconde il devient agaçant sur une suppression qu'on peut vouloir répéter.

### Le remplissage est une animation CSS, pas un état React

Un disque en pseudo-élément passe de `scale(0)` à `scale(1)` pendant la durée de l'appui, déclenché par une classe posée sur le bouton.

*Pourquoi* : animer en CSS laisse le compositeur travailler et évite de provoquer un rendu React à chaque image. Le composant ne garde qu'un drapeau « appui en cours » et un identifiant de minuterie.

*Alternative écartée* : une barre de progression pilotée en JavaScript. Plus de code, plus de rendus, et visuellement moins lisible dans un disque de 1,35 rem.

### Le symbole vire au blanc pendant le remplissage

La couleur du symbole est animée sur la même durée que le disque.

*Pourquoi* : une fois le disque rempli de rouge vif, un symbole rouge disparaîtrait dedans.

### L'appui est suivi par les événements de pointeur

`pointerdown` arme la minuterie, `pointerup`, `pointerleave` et `pointercancel` la désarment.

*Pourquoi* : les événements de pointeur couvrent souris, tactile et stylet d'un même jeu de gestionnaires. `pointerleave` traite le cas où l'on glisse hors du bouton pour se raviser, et `pointercancel` celui où le système reprend la main, par exemple quand un défilement démarre.

*À surveiller* : sur mobile, un appui long déclenche parfois le menu contextuel ou la sélection de texte du navigateur. Le bouton doit neutraliser ce comportement.

### Le clavier a son propre chemin

`keydown` sur la touche d'activation arme la même minuterie, `keyup` la désarme, et la répétition automatique du clavier est ignorée.

*Pourquoi* : sans cela, la suppression deviendrait inaccessible au clavier — un bouton dont le `click` ne fait plus rien n'est plus actionnable autrement. Ignorer la répétition évite de réarmer la minuterie à chaque événement répété.

### Mouvement réduit

Lorsque l'utilisateur demande un mouvement réduit, le remplissage progressif est remplacé par un état d'appui franc, sans animation continue. La durée d'appui, elle, ne change pas.

*Pourquoi* : la protection contre l'appui accidentel est une règle d'interaction, pas une décoration. Seule sa mise en scène s'efface.

## Risks / Trade-offs

- **Geste non découvrable** → rien n'annonce qu'il faut maintenir. Le premier clic bref ne fera rien et pourra passer pour un bug. L'animation qui démarre dès le premier contact est ce qui l'enseigne ; à surveiller à l'usage.
- **Appui long natif du navigateur** → menu contextuel ou sélection sur mobile. Neutralisé sur le bouton, à vérifier sur un appareil réel.
- **Suppression répétée** → vider un créneau de trois entrées demande trois appuis maintenus. Accepté : la suppression doit rester un peu coûteuse.

## Migration Plan

Aucune migration : changement d'interaction uniquement, sans effet sur les données. Retour arrière en rétablissant le `onClick` direct.
