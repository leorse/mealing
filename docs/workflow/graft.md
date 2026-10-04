---
type: Workflow
title: Recherche dans le code avec graft
description: Règle d'usage de graft pour toute recherche, compréhension ou analyse d'impact dans le code de Mealing.
resource: ../../.mcp.json
tags: [workflow, graft, search]
timestamp: 2026-10-04T00:00:00Z
---
# Recherche dans le code : graft

Le dépôt est indexé par **graft** : un graphe de tous les symboles TypeScript/TSX, avec leur `fichier:ligne` et leurs appels. **Toute recherche dans le code passe par graft**, avant un grep ou la lecture d'un fichier entier.

## Quel outil pour quel besoin

| Besoin | Ligne de commande | Outil MCP |
|---|---|---|
| « Comment marche X ? », « Où est Y ? » | `graft ask "<question>" --source` | `graft_find_code` |
| Toutes les occurrences d'un texte | `graft grep "<texte>"` | `graft_find_all` |
| L'API d'un fichier sans le lire | `graft skeleton <fichier>` | `graft_file_api` |
| Qui appelle ce symbole, ce qu'il appelle | `graft callers <symbole> [--direction out] [--depth N\|all]` | `graft_trace_calls` |
| S'orienter dans le dépôt | `graft map` | `graft_repo_map` |

## Règles

1. **Un seul appel bien choisi** suffit le plus souvent. Ne pas reposer la même question reformulée ; changer d'outil si le besoin change.
2. **Fichier ou symbole déjà connu** : `graft grep "<symbole>"`, lire la portion indiquée, modifier. `ask` sert quand on ne sait pas où est le code.
3. **Avant de modifier ou renommer un symbole** : `graft callers <symbole> --depth all`, pour voir tous les fichiers touchés. Modifier le fichier principal et s'arrêter là est l'erreur classique.
4. **`ask` renvoie les meilleurs résultats, pas tous** : pour une liste complète (tous les usages d'une classe CSS dans le JSX, tous les appels d'un repository), utiliser `grep`.
5. Ne jamais tronquer la sortie de graft (`head`, `tail`) : elle est déjà bornée.
6. Les résultats tiennent compte des modifications non commitées.

## Ce que graft ne couvre pas

- **`src/index.css`** et les fichiers Markdown ne sont pas indexés. Pour une classe CSS : recherche ciblée dans `src/index.css` seulement, puis `graft grep "<classe>"` pour ses usages dans le JSX.
- Les fichiers de configuration (`package.json`, `wrangler.toml`, `tsconfig*.json`) se lisent directement.

## Entretien

Le dossier `graft/` est un cache local, ignoré par git et régénérable par `graft build`. Le serveur MCP est déclaré dans [.mcp.json](../../.mcp.json). Ne pas modifier `graft/` à la main.
