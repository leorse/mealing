# Tasks

> Le projet n'embarque pas de framework de test (`package.json` : `dev`, `build`, `lint`, `preview`).
> La vérification se fait donc par observation dans `npm run dev`, plus `npm run build` et `npm run lint`.

## 1. Déclenchement par appui maintenu

- [x] 1.1 Remplacer le `onClick` de l'icône de suppression par un armement sur `pointerdown` et un déclenchement de `deleteSlot` au terme de 700 ms, puis vérifier qu'un appui maintenu supprime bien l'entrée
- [x] 1.2 Désarmer sur `pointerup`, `pointerleave` et `pointercancel`, et vérifier qu'un relâchement anticipé, puis un glissement hors du bouton, laissent l'entrée en place
- [x] 1.3 Vérifier qu'un clic bref ne supprime rien
- [x] 1.4 Vérifier qu'un appui annulé puis repris repart de zéro et non de là où il s'était arrêté
- [x] 1.5 Libérer la minuterie au démontage du composant, et vérifier qu'aucune suppression ne survient après un changement de semaine en cours d'appui

## 2. Retour visuel

- [x] 2.1 Animer le remplissage du disque sur la durée de l'appui via une classe CSS, et vérifier que la progression est visible dès le premier contact
- [x] 2.2 Animer la couleur du symbole vers le blanc sur la même durée, et vérifier qu'il reste lisible une fois le disque plein
- [x] 2.3 Vérifier que le disque revient à son apparence initiale après une annulation, sans animation résiduelle
- [x] 2.4 Fournir un état d'appui sans animation continue sous `prefers-reduced-motion`, et vérifier que la durée d'appui reste la même
- [x] 2.5 Vérifier le rendu de l'animation en thème clair et en thème sombre

## 3. Clavier et comportements natifs

- [x] 3.1 Armer et désarmer la minuterie sur `keydown` / `keyup` de la touche d'activation en ignorant la répétition automatique, et vérifier la suppression au clavier seul
- [x] 3.2 Vérifier qu'une touche relâchée trop tôt laisse l'entrée en place
- [x] 3.3 Neutraliser le menu contextuel et la sélection de texte déclenchés par un appui long, et le vérifier sur un appareil tactile réel

## 4. Contrôle d'ensemble

- [x] 4.1 Vérifier que la pastille de courses et l'ouverture de la modification répondent toujours à un clic simple
- [x] 4.2 Supprimer plusieurs entrées d'affilée et vérifier que le total du jour suit, et qu'un créneau vidé repropose l'ajout
- [x] 4.3 Exécuter `npm run lint` et `npm run build` et vérifier qu'ils passent sans nouvelle erreur
