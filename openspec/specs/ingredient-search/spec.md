# ingredient-search Specification

## Purpose
Décrit comment une recherche d'ingrédient par nom trouve les aliments et les ordonne, pour que l'aliment qui porte le nom cherché apparaisse en premier.

## Requirements

### Requirement: La recherche ignore la casse et les accents

Un aliment SHALL correspondre à la recherche lorsque son nom ou sa marque contient le texte saisi, sans distinction de majuscules, de minuscules ni d'accents.

#### Scenario: Accents ignorés

- **WHEN** l'utilisateur saisit « pate »
- **THEN** les aliments dont le nom contient « Pâte » sont proposés

#### Scenario: Majuscules ignorées

- **WHEN** l'utilisateur saisit « POMME »
- **THEN** les mêmes aliments que pour « pomme » sont proposés, dans le même ordre

#### Scenario: Recherche sur la marque

- **WHEN** l'utilisateur saisit un texte que seule la marque d'un aliment contient
- **THEN** cet aliment est proposé

### Requirement: Les résultats sont classés en quatre niveaux

Les résultats SHALL être présentés par niveau, puis par ordre alphabétique du nom à l'intérieur d'un niveau. Le premier mot du nom compte : 1) il commence par le texte saisi et n'est suivi que d'une virgule ou de rien ; 2) il commence par le texte saisi et est suivi d'un autre mot ; 3) il commence par le texte saisi et est suivi d'une liaison (de, du, des, d', à, au, aux, en) ; 4) tous les autres résultats.

#### Scenario: Aliment qui porte le nom cherché

- **WHEN** l'utilisateur saisit « pomme »
- **THEN** « Pomme, chair et peau, crue » et « Pomme, sèche » sont proposés avant tout autre résultat

#### Scenario: Variétés ensuite

- **WHEN** l'utilisateur saisit « pomme »
- **THEN** « Pomme Gala, chair sans peau, crue » et « Pomme Golden, chair et peau, crue » viennent après « Pomme, sèche »
- **AND** avant « Pomme de terre, bouillie/cuite à l'eau »

#### Scenario: Noms composés après les variétés

- **WHEN** l'utilisateur saisit « pomme »
- **THEN** tous les aliments commençant par « Pomme de terre » viennent après « Pomme Pink lady, chair sans peau, crue »

#### Scenario: Mot présent ailleurs en dernier

- **WHEN** l'utilisateur saisit « pomme »
- **THEN** « Jus de pomme, pur jus » et « Compote de pomme, préemballée » viennent après tous les aliments dont le nom commence par « Pomme »

#### Scenario: Ordre alphabétique dans un niveau

- **WHEN** l'utilisateur saisit « pomme »
- **THEN** « Compote de pomme, préemballée » vient avant « Jus de pomme, pur jus »

#### Scenario: Saisie partielle

- **WHEN** l'utilisateur saisit « pom »
- **THEN** « Pomme, sèche » vient avant « Pomme Gala, chair sans peau, crue », qui vient avant « Pomme de terre, bouillie/cuite à l'eau »

#### Scenario: Plusieurs mots saisis

- **WHEN** l'utilisateur saisit « pomme de terre »
- **THEN** « Pomme de terre, bouillie/cuite à l'eau » vient avant « Pomme de terre dauphine, surgelée, cuite »
- **AND** « Purée de pomme de terre (aliment moyen) » vient après les deux

### Requirement: Le classement précède la limite du nombre de résultats

Lorsque le nombre de résultats est limité, le classement SHALL porter sur tous les aliments correspondants avant que la limite ne s'applique, de sorte que les résultats écartés soient toujours les moins bien classés.

#### Scenario: Recherche très large

- **WHEN** une recherche correspond à plus d'aliments que la limite n'en affiche
- **THEN** les aliments affichés sont les premiers du classement complet
- **AND** un aliment dont le nom commence par le texte saisi n'est jamais écarté au profit d'un aliment qui le contient ailleurs
