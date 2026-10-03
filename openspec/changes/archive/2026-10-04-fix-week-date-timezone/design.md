# Design

## Context

Voir `proposal.md` — Why.

`src/utils/date.ts` mélange deux référentiels :

```
toIsoDate(d)        -> d.toISOString().slice(0, 10)      UTC
startOfWeekIso(d)   -> getDay(), getDate(), setDate()     local, puis toIsoDate -> UTC
addDays(iso, n)     -> new Date(iso)                      UTC minuit
                       getDate(), setDate()               local
                       toIsoDate                          UTC
```

Chaque fonction bascule d'un référentiel à l'autre en cours de route. Le résultat n'est correct que lorsque l'heure locale et l'heure UTC tombent le même jour civil.

Trois appelants reconstruisent par ailleurs une `Date` à partir d'une chaîne : `MealPickerModal` pour calculer la semaine d'un créneau, et `WeekPlanScreen` à deux reprises pour l'affichage des libellés.

## Goals / Non-Goals

**Goals**

- Une seule convention : une chaîne `AAAA-MM-JJ` désigne un jour civil local, jamais un instant.
- Correct à toute heure et dans tout fuseau.

**Non-Goals**

- Introduire une bibliothèque de dates. `date-fns` est déjà présent pour le formatage ; le besoin ici tient en deux fonctions.
- Reprendre les données : les plans de semaine enregistrés portent des dates correctes.
- Traiter les fuseaux des autres écrans, aujourd'hui des pages vides.

## Decisions

### Une chaîne de date désigne un jour civil local

`toIsoDate` compose la chaîne à partir de `getFullYear`, `getMonth` et `getDate`, et une fonction de lecture reconstruit une `Date` à midi local à partir des trois nombres.

*Pourquoi le midi* : une date construite à minuit local tombe à un instant qu'un changement d'heure peut déplacer de part et d'autre de la frontière du jour. À midi, aucune transition d'heure d'été connue ne fait changer la date, ce qui rend l'arithmétique de jours insensible aux basculements.

*Alternative écartée* : tout garder en UTC, y compris le calcul du début de semaine. Cohérent sur le papier, mais le planning serait alors désaligné de l'idée que l'utilisateur se fait de « aujourd'hui » dès qu'il se trouve loin du méridien.

### Les appelants cessent de parser eux-mêmes

Les trois `new Date(<chaîne>)` passent par la fonction de lecture.

*Pourquoi* : `new Date("2026-09-28")` est spécifié comme minuit **UTC**, alors que `new Date("2026/09/28")` serait local. Cette asymétrie est précisément le piège ; la centraliser dans une fonction nommée évite qu'il revienne.

### Le comportement se vérifie par exécution, pas par observation

Le correctif se teste en exécutant les fonctions sous plusieurs fuseaux et plusieurs heures, via la variable d'environnement `TZ`.

*Pourquoi* : c'est un défaut dépendant de l'heure et du lieu. L'ouvrir dans un navigateur à 15 h ne prouve rien — c'est exactement ce qui l'a laissé passer jusqu'ici.

## Risks / Trade-offs

- **Fuseaux à décalage de 30 ou 45 minutes** → le choix de midi laisse une marge de douze heures, largement suffisante.
- **Changement d'heure** → l'arithmétique de jours passe par `setDate`, qui raisonne en jours civils et non en multiples de 24 heures ; combiné au midi, les nuits de bascule sont couvertes.
- **Données écrites pendant que le défaut était actif** → vérifié sur la base réelle : les `weekStart` enregistrés sont des lundis corrects. Le défaut touchait la lecture de « maintenant », pas l'écriture depuis une date déjà en chaîne.

## Migration Plan

Aucune migration. Les plans de semaine existants redeviennent visibles dès que la lecture cesse de glisser d'un jour. Retour arrière par restauration du fichier.
