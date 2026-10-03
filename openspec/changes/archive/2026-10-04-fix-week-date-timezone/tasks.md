# Tasks

> Le projet n'embarque pas de framework de test, mais ce défaut dépend de l'heure et du fuseau :
> il se vérifie en exécutant les fonctions sous `TZ`, pas en regardant l'écran à une heure donnée.

## 1. Utilitaires de date

- [x] 1.1 Réécrire `toIsoDate` à partir des composantes locales (`getFullYear`, `getMonth`, `getDate`), et vérifier qu'une date du soir et une date d'après minuit rendent chacune leur propre jour
- [x] 1.2 Ajouter une fonction de lecture d'une chaîne `AAAA-MM-JJ` vers une `Date` locale à midi, et vérifier l'aller-retour chaîne → date → chaîne sur une série de jours
- [x] 1.3 Faire passer `startOfWeekIso` et `addDays` par cette fonction de lecture, sans conversion UTC résiduelle, et vérifier qu'aucun `toISOString` ne subsiste dans le fichier

## 2. Appelants

- [x] 2.1 Remplacer les trois `new Date(<chaîne ISO>)` de `MealPickerModal` et `WeekPlanScreen` par la fonction de lecture, et vérifier qu'aucun parsing direct de chaîne ne subsiste dans `src/`
- [x] 2.2 Vérifier que les libellés de colonne affichent le bon jour de la semaine

## 3. Vérification par exécution

- [x] 3.1 Exécuter `startOfWeekIso` pour chaque heure de la journée en `TZ=Europe/Paris` et vérifier qu'elle renvoie toujours le même lundi
- [x] 3.2 Rejouer le même contrôle en `TZ=America/Los_Angeles` et en `TZ=Pacific/Kiritimati`, décalages négatif et fortement positif, et vérifier la stabilité dans chacun
- [x] 3.3 Vérifier que `weekDates` renvoie sept jours consécutifs du lundi au dimanche, sans jour manquant ni répété, dans ces mêmes fuseaux
- [x] 3.4 Vérifier qu'une semaine traversant un changement d'heure reste de sept jours consécutifs
- [x] 3.5 Vérifier qu'avancer puis reculer d'une semaine ramène à la semaine de départ

## 4. Contrôle d'ensemble

- [x] 4.1 Vérifier dans l'application que les repas déjà en base réapparaissent sur leurs créneaux
- [x] 4.2 Exécuter `npm run lint` et `npm run build` et vérifier qu'ils passent sans nouvelle erreur
