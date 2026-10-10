import type { Ingredient } from '../db/schema';
import { AiError, chat, extractJsonObject, type AiErrorCode } from './aiClient';
import { searchFoods } from './embedding/embeddingClient';
import { gramsFor, hasOwnUnit } from './portions';

// Création de plats à partir de descriptions libres. Tout est pensé par lot : une liste de descriptions
// donne une liste de résultats, avec deux demandes à l'IA quel que soit le nombre de plats.

export type FoodState = 'CRU' | 'CUIT' | 'FRIT' | 'AUTRE';
export type QuantitySource = 'USER' | 'ESTIMATE';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type DishErrorCode = AiErrorCode | 'NO_FOOD';
export type AnalysisStage = 'DECOMPOSE' | 'SEARCH' | 'CHOOSE';
export type PortionSize = 'SMALL' | 'NORMAL' | 'LARGE';

const STATES: FoodState[] = ['CRU', 'CUIT', 'FRIT', 'AUTRE'];
const SOURCES: QuantitySource[] = ['USER', 'ESTIMATE'];
const CONFIDENCES: Confidence[] = ['HIGH', 'MEDIUM', 'LOW'];

export const CANDIDATE_COUNT = 10;

export const PORTION_FACTORS: Record<PortionSize, number> = { SMALL: 0.7, NORMAL: 1, LARGE: 1.3 };

/** Ingrédient tel que rendu par la décomposition, avant éclatement des aliments composés. */
export interface DecomposedItem {
  label: string;
  query: string;
  state: FoodState;
  grams: number;
  /** Nombre d'unités ou fraction donné par l'utilisateur (« deux merguez », « une demi-pizza »). */
  count?: number;
  source: QuantitySource;
  confidence: Confidence;
  parts?: { query: string; state: FoodState; ratio: number }[];
}

/** Ingrédient simple à rapprocher de Ciqual. */
export interface DraftLine {
  label: string;
  query: string;
  state: FoodState;
  grams: number;
  count?: number;
  source: QuantitySource;
  confidence: Confidence;
  /** Aliment composé dont la ligne est issue (« sauce samouraï »). */
  origin?: string;
}

export type DecomposedDish =
  | { status: 'OK'; name: string; items: DecomposedItem[] }
  | { status: 'FAILED'; code: DishErrorCode };

export interface DishLine {
  key: string;
  label: string;
  origin?: string;
  /** `null` : aucun aliment Ciqual retenu, la ligne ne compte pour rien. */
  ingredient: Ingredient | null;
  candidates: Ingredient[];
  quantityG: number;
  unitCount?: number;
  isEstimated: boolean;
  /** Estimation initiale, base des tailles de portion ; absente dès que la quantité vient de l'utilisateur. */
  estimateG?: number;
  needsReview: boolean;
}

export type DishResult =
  | { status: 'OK'; text: string; name: string; lines: DishLine[] }
  | { status: 'FAILED'; text: string; code: DishErrorCode };

const ERROR_MESSAGES: Record<DishErrorCode, string> = {
  NO_KEY: "Aucune clé d'accès n'est enregistrée. Saisis ta clé 1min.AI dans les Réglages pour analyser un plat.",
  UNAUTHORIZED: "Le service a refusé la clé d'accès. Vérifie-la dans les Réglages.",
  RATE_LIMITED: 'Trop de demandes ont été envoyées. Réessaie dans quelques minutes.',
  NETWORK: "L'analyse nécessite une connexion, et le service n'a pas répondu. Vérifie le réseau puis réessaie.",
  INVALID_RESPONSE: "La réponse de l'IA n'a pas pu être lue. Réessaie.",
  NO_FOOD: "Aucun aliment n'a été reconnu dans ce texte. Décris un repas, par exemple « une omelette de trois œufs et une salade verte ».",
};

export function dishErrorMessage(code: DishErrorCode): string {
  return ERROR_MESSAGES[code];
}

/** Clé de regroupement d'un texte de recherche : un même texte n'est vectorisé et listé qu'une fois. */
function queryKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const DECOMPOSE_EXAMPLE = `{
  "dishes": [
    {
      "dish": 1,
      "name": "Sandwich merguez frites",
      "items": [
        { "label": "grande merguez", "query": "merguez grillée", "state": "CUIT", "grams": 90, "count": null, "source": "ESTIMATE", "confidence": "HIGH", "parts": null },
        { "label": "sauce samouraï", "query": "sauce samouraï", "state": "AUTRE", "grams": 30, "count": null, "source": "ESTIMATE", "confidence": "MEDIUM", "parts": [
          { "query": "mayonnaise", "state": "AUTRE", "ratio": 0.7 },
          { "query": "ketchup", "state": "AUTRE", "ratio": 0.2 },
          { "query": "harissa", "state": "AUTRE", "ratio": 0.1 }
        ] }
      ]
    }
  ]
}`;

/** Première demande : chaque description devient une liste d'ingrédients avec leurs quantités. Seuls les textes saisis sont transmis. */
export function buildDecomposePrompt(texts: string[]): string {
  return [
    'Tu es diététicien. Pour chaque plat décrit ci-dessous, donne la liste de ses ingrédients et leur poids.',
    '',
    'Règles :',
    '- Une quantité indiquée dans la description (poids, volume, nombre, fraction) est respectée exactement : "source" vaut "USER". Un poids ou un volume est repris tel quel dans "grams". Pour un nombre ou une fraction (« deux merguez », « une demi-pizza »), "count" porte ce nombre (2, 0.5) et "grams" le poids total correspondant.',
    '- Sans indication, estime le poids d\'une portion courante en France, en tenant compte des qualificatifs (petit, grand, gros) : "source" vaut "ESTIMATE" et "count" vaut null.',
    '- "grams" est le poids de l\'aliment tel qu\'il est mangé, strictement positif.',
    '- "query" est un texte de recherche court dans le vocabulaire de la table Ciqual de l\'Anses : nom générique de l\'aliment, suivi de son état ou de sa préparation (cru, cuit, grillé, frit, rôti…). Ni marque ni quantité.',
    '- "state" vaut CRU, CUIT, FRIT ou AUTRE.',
    '- "confidence" vaut HIGH, MEDIUM ou LOW, selon ta certitude sur l\'aliment et son poids.',
    '- Si l\'aliment est une préparation qui n\'existe probablement pas dans Ciqual (sauce particulière, spécialité…), "parts" le décompose en ingrédients simples, chacun avec "query", "state" et "ratio" (part du poids, total 1). Sinon "parts" vaut null.',
    '- "label" reprend les mots de la description ; "name" est un nom court pour le plat.',
    '- Ne donne aucune valeur nutritionnelle : ni calories, ni protéines, ni glucides, ni lipides.',
    '- Une description qui ne contient aucun aliment donne "items": [].',
    '',
    'Réponds uniquement par un objet JSON de cette forme, sans texte autour, avec un élément de "dishes" par plat, numéroté comme ci-dessous :',
    DECOMPOSE_EXAMPLE,
    '',
    'Plats :',
    ...texts.map((text, index) => `${index + 1}. « ${text.trim()} »`),
  ].join('\n');
}

function asEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  const upper = typeof value === 'string' ? (value.trim().toUpperCase() as T) : null;
  return upper !== null && allowed.includes(upper) ? upper : null;
}

function isPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** `null` : ingrédient invalide. Toute clé inattendue — dont une valeur nutritionnelle — est ignorée. */
function readItem(raw: unknown): DecomposedItem | null {
  const item = raw as Record<string, unknown> | null;
  if (!item || typeof item !== 'object') return null;

  const query = typeof item.query === 'string' ? item.query.trim() : '';
  const state = asEnum(item.state, STATES);
  const source = asEnum(item.source, SOURCES);
  const confidence = asEnum(item.confidence, CONFIDENCES);
  if (!query || !state || !source || !confidence || !isPositive(item.grams)) return null;
  if (item.count != null && !isPositive(item.count)) return null;

  let parts: DecomposedItem['parts'];
  if (item.parts != null) {
    if (!Array.isArray(item.parts) || item.parts.length === 0) return null;
    parts = [];
    for (const rawPart of item.parts as Record<string, unknown>[]) {
      const partQuery = typeof rawPart?.query === 'string' ? rawPart.query.trim() : '';
      const partState = asEnum(rawPart?.state, STATES);
      if (!partQuery || !partState || !isPositive(rawPart.ratio)) return null;
      parts.push({ query: partQuery, state: partState, ratio: rawPart.ratio });
    }
  }

  const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim() : query;
  return { label, query, state, grams: item.grams, count: item.count ?? undefined, source, confidence, parts };
}

/**
 * Lit la décomposition. Deux niveaux : une enveloppe illisible fait échouer toute l'analyse (exception) ;
 * un plat absent, en double ou à ingrédient invalide échoue seul, les autres continuent.
 */
export function parseDecomposition(text: string, dishCount: number): DecomposedDish[] {
  const root = extractJsonObject(text) as { dishes?: unknown };
  if (!Array.isArray(root.dishes)) throw new AiError('INVALID_RESPONSE');
  const dishes = root.dishes as ({ dish?: unknown; name?: unknown; items?: unknown } | null)[];

  return Array.from({ length: dishCount }, (_, index): DecomposedDish => {
    const matches = dishes.filter((d) => d?.dish === index + 1);
    // Un seul plat demandé, un seul rendu : son numéro n'a pas d'importance.
    const entry = matches.length === 1 ? matches[0] : dishCount === 1 && dishes.length === 1 ? dishes[0] : null;
    if (!entry || !Array.isArray(entry.items)) return { status: 'FAILED', code: 'INVALID_RESPONSE' };
    if (entry.items.length === 0) return { status: 'FAILED', code: 'NO_FOOD' };

    const items = entry.items.map(readItem);
    if (items.some((item) => item === null)) return { status: 'FAILED', code: 'INVALID_RESPONSE' };
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    return { status: 'OK', name, items: items as DecomposedItem[] };
  });
}

/**
 * Remplace chaque aliment composé par ses ingrédients simples, au prorata de leurs proportions.
 * La somme des parts vaut exactement le poids de l'aliment composé : l'écart d'arrondi va à la plus grosse.
 */
export function expandComposites(items: DecomposedItem[]): DraftLine[] {
  return items.flatMap((item): DraftLine[] => {
    const { parts, ...simple } = item;
    if (!parts) return [simple];

    const total = parts.reduce((sum, part) => sum + part.ratio, 0);
    const weights = parts.map((part) => round1((item.grams * part.ratio) / total));
    const biggest = weights.indexOf(Math.max(...weights));
    weights[biggest] = round1(weights[biggest] + item.grams - weights.reduce((sum, w) => sum + w, 0));

    return parts
      .map((part, index) => ({
        label: part.query,
        query: part.query,
        state: part.state,
        grams: weights[index],
        source: item.source,
        confidence: item.confidence,
        origin: item.label,
      }))
      .filter((line) => line.grams > 0);
  });
}

export interface ChoiceDish {
  /** Rang du plat dans la demande, à partir de 1. */
  dish: number;
  name: string;
  lines: DraftLine[];
}

/** Les textes de recherche distincts de tous les plats, dans l'ordre de première apparition. */
export function distinctQueries(dishes: ChoiceDish[]): string[] {
  const seen = new Map<string, string>();
  for (const dish of dishes) {
    for (const line of dish.lines) {
      if (!seen.has(queryKey(line.query))) seen.set(queryKey(line.query), line.query);
    }
  }
  return [...seen.values()];
}

/** Candidats Ciqual par texte de recherche (voir `queryKey`). */
export type CandidateMap = Map<string, Ingredient[]>;

export function toCandidateMap(queries: string[], candidates: Ingredient[][]): CandidateMap {
  return new Map(queries.map((query, index) => [queryKey(query), candidates[index] ?? []]));
}

function candidatesOf(line: DraftLine, candidates: CandidateMap): Ingredient[] {
  return candidates.get(queryKey(line.query)) ?? [];
}

const CHOICE_EXAMPLE = `{
  "dishes": [
    { "dish": 1, "name": "Sandwich merguez frites", "ingredients": [ { "item": 1, "id": "identifiant du candidat retenu" }, { "item": 2, "id": null } ] }
  ]
}`;

/**
 * Seconde demande : l'IA trie les candidats et rend, pour chaque ingrédient de chaque plat, l'identifiant retenu.
 * Une liste de candidats n'est écrite qu'une fois par texte de recherche, même si plusieurs plats s'y réfèrent.
 * Ne part que ce qui vient des descriptions et les noms des aliments candidats.
 */
export function buildChoicePrompt(dishes: ChoiceDish[], candidates: CandidateMap): string {
  const listNames = new Map<string, string>();
  const lists: string[] = [];
  for (const query of distinctQueries(dishes)) {
    const found = candidates.get(queryKey(query)) ?? [];
    if (found.length === 0) continue;
    const listName = `L${listNames.size + 1}`;
    listNames.set(queryKey(query), listName);
    lists.push(`Liste ${listName} — « ${query} »`, ...found.map((c) => `${c.id} : ${c.name}`), '');
  }

  const dishBlocks = dishes.flatMap((dish) => [
    `Plat ${dish.dish} — « ${dish.name} »`,
    ...dish.lines.map((line, index) => {
      const listName = listNames.get(queryKey(line.query));
      const origin = line.origin ? `, composant de « ${line.origin} »` : '';
      return `  Ingrédient ${index + 1} : ${line.label} (${line.state}, ${line.grams} g${origin}) → ${listName ? `liste ${listName}` : 'aucun candidat'}`;
    }),
    '',
  ]);

  return [
    "Tu es diététicien. Pour chaque ingrédient des plats ci-dessous, choisis dans sa liste de candidats l'aliment de la table Ciqual qui lui correspond le mieux.",
    '',
    'Règles :',
    "- Choisis uniquement dans la liste indiquée pour l'ingrédient, et recopie l'identifiant du candidat exactement.",
    "- Tiens compte de l'état (cru, cuit, frit) et du plat. Préfère l'aliment simple à un plat composé qui le contient, et l'« aliment moyen » quand la description ne précise pas la variété.",
    '- Si aucun candidat ne convient, ou si l\'ingrédient n\'a aucun candidat, "id" vaut null.',
    '- Ne modifie pas les quantités et ne donne aucune valeur nutritionnelle.',
    '- "name" est un nom court pour le plat ; tu peux garder celui proposé.',
    '',
    'Réponds uniquement par un objet JSON de cette forme, sans texte autour, avec tous les plats et tous leurs ingrédients :',
    CHOICE_EXAMPLE,
    '',
    'Listes de candidats (identifiant : aliment) :',
    ...lists,
    'Plats :',
    ...dishBlocks,
  ].join('\n');
}

export interface DishChoices {
  name: string;
  /** Tels que rendus par l'IA, sans contrôle : `applyChoices` s'en charge. */
  ingredients: { item: number; id: string | null }[];
}

/** Lit le tri de l'IA, par rang de plat. Un plat cité deux fois est tenu pour absent. Enveloppe illisible : exception. */
export function parseChoices(text: string): Map<number, DishChoices> {
  const root = extractJsonObject(text) as { dishes?: unknown };
  if (!Array.isArray(root.dishes)) throw new AiError('INVALID_RESPONSE');

  const result = new Map<number, DishChoices>();
  const duplicated = new Set<number>();
  for (const raw of root.dishes as ({ dish?: unknown; name?: unknown; ingredients?: unknown } | null)[]) {
    if (!raw || typeof raw.dish !== 'number') continue;
    if (result.has(raw.dish)) duplicated.add(raw.dish);
    const ingredients = (Array.isArray(raw.ingredients) ? raw.ingredients : [])
      .filter((i): i is { item: number; id: unknown } => typeof i?.item === 'number')
      .map((i) => ({ item: i.item, id: typeof i.id === 'string' ? i.id.trim() : null }));
    result.set(raw.dish, { name: typeof raw.name === 'string' ? raw.name.trim() : '', ingredients });
  }
  for (const dish of duplicated) result.delete(dish);
  return result;
}

/**
 * Applique le tri de l'IA aux lignes d'un plat, sous contrôle : l'identifiant retenu doit figurer parmi
 * les candidats de l'ingrédient. Sinon (hors liste, inventé, oublié, cité deux fois) la ligne prend
 * le candidat le plus proche et passe « à vérifier ». Les quantités ne viennent jamais de cette réponse.
 */
export function applyChoices(dish: ChoiceDish, candidates: CandidateMap, choices: DishChoices | undefined): DishLine[] {
  return dish.lines.map((line, index): DishLine => {
    const found = candidatesOf(line, candidates);
    const answers = choices?.ingredients.filter((i) => i.item === index + 1) ?? [];
    const answer = answers.length === 1 ? answers[0] : null;

    let ingredient: Ingredient | null = null;
    let needsReview = line.confidence === 'LOW';
    if (found.length > 0 && !(answer && answer.id === null)) {
      const chosen = answer ? found.find((c) => c.id === answer.id) : undefined;
      ingredient = chosen ?? found[0];
      if (!chosen) needsReview = true;
    }

    const isEstimated = line.source === 'ESTIMATE';
    const countsUnits = !isEstimated && line.count !== undefined && ingredient !== null && hasOwnUnit(ingredient);
    return {
      key: `${dish.dish}-${index + 1}`,
      label: line.label,
      origin: line.origin,
      ingredient,
      candidates: found,
      quantityG: countsUnits ? gramsFor(line.count!, (ingredient as Ingredient).portionG!) : line.grams,
      unitCount: countsUnits ? line.count : undefined,
      isEstimated,
      estimateG: isEstimated ? line.grams : undefined,
      needsReview,
    };
  });
}

/** Contrôle : une quantité donnée par l'utilisateur est la même avant et après le tri de l'IA. */
export function userQuantitiesIntact(drafts: DraftLine[], lines: DishLine[]): boolean {
  return (
    drafts.length === lines.length &&
    drafts.every((draft, index) => {
      const line = lines[index];
      if (draft.source !== 'USER') return true;
      return !line.isEstimated && (line.unitCount !== undefined ? line.unitCount === draft.count : line.quantityG === draft.grams);
    })
  );
}

function joinDistinct(values: (string | undefined)[]): string | undefined {
  const distinct = [...new Set(values.filter((v): v is string => Boolean(v)))];
  return distinct.length > 0 ? distinct.join(' + ') : undefined;
}

/**
 * Un même aliment ne figure qu'une fois dans un plat : les quantités s'additionnent,
 * et la ligne est estimée dès qu'une des parts l'est. Les lignes sans aliment restent telles quelles.
 */
export function mergeSameIngredient(lines: DishLine[]): DishLine[] {
  const merged: DishLine[] = [];
  for (const line of lines) {
    const twin = line.ingredient ? merged.find((m) => m.ingredient?.id === line.ingredient!.id) : undefined;
    if (!twin) {
      merged.push({ ...line });
      continue;
    }
    twin.quantityG = round1(twin.quantityG + line.quantityG);
    twin.unitCount =
      twin.unitCount !== undefined && line.unitCount !== undefined ? twin.unitCount + line.unitCount : undefined;
    twin.isEstimated = twin.isEstimated || line.isEstimated;
    twin.estimateG = twin.isEstimated ? twin.quantityG : undefined;
    twin.needsReview = twin.needsReview || line.needsReview;
    twin.label = joinDistinct([twin.label, line.label])!;
    twin.origin = joinDistinct([twin.origin, line.origin]);
  }
  return merged;
}

/** Taille actuellement appliquée à une ligne estimée, ou `null` si elle ne correspond à aucune. */
export function portionSizeOf(line: DishLine): PortionSize | null {
  if (!line.isEstimated || line.estimateG === undefined) return null;
  const sizes = Object.keys(PORTION_FACTORS) as PortionSize[];
  return sizes.find((size) => Math.round(line.estimateG! * PORTION_FACTORS[size]) === line.quantityG) ?? null;
}

/** Petite, normale ou grande portion : un facteur appliqué à l'estimation initiale. La ligne reste estimée. */
export function resizeLine(line: DishLine, size: PortionSize): DishLine {
  if (!line.isEstimated || line.estimateG === undefined) return line;
  return { ...line, quantityG: Math.round(line.estimateG * PORTION_FACTORS[size]) };
}

/** Un poids précis devient une quantité donnée par l'utilisateur. Un poids nul ou négatif est refusé. */
export function setLineWeight(line: DishLine, grams: number): DishLine {
  if (!Number.isFinite(grams) || grams <= 0) return line;
  return { ...line, quantityG: grams, unitCount: undefined, isEstimated: false, estimateG: undefined };
}

/** Remplace l'aliment retenu en gardant la quantité et sa provenance ; le doute est levé par ce choix. */
export function replaceLineIngredient(line: DishLine, ingredient: Ingredient): DishLine {
  const keepsUnits = line.unitCount !== undefined && hasOwnUnit(ingredient);
  return {
    ...line,
    ingredient,
    needsReview: false,
    unitCount: keepsUnits ? line.unitCount : undefined,
    quantityG: keepsUnits ? gramsFor(line.unitCount!, ingredient.portionG) : line.quantityG,
  };
}

/** Décomposition et candidats déjà obtenus : permet de ne refaire que le tri après un échec de celui-ci. */
export interface AnalysisCheckpoint {
  texts: string[];
  decomposed: DecomposedDish[];
  candidates: CandidateMap;
}

/** Échec du tri seul : `checkpoint` se repasse à `analyze` pour ne pas refaire la décomposition. */
export class ChoiceStepError extends AiError {
  checkpoint: AnalysisCheckpoint;

  constructor(code: AiErrorCode, checkpoint: AnalysisCheckpoint) {
    super(code);
    this.checkpoint = checkpoint;
  }
}

export interface AnalyzeRequest {
  /** Une description par plat. Le résultat a la même longueur et le même ordre. */
  texts: string[];
  apiKey?: string;
  model: string;
  signal?: AbortSignal;
  onStage?: (stage: AnalysisStage) => void;
  checkpoint?: AnalysisCheckpoint;
}

/**
 * Analyse une ou plusieurs descriptions de plats : une demande de décomposition, une recherche
 * sémantique locale, une demande de tri — pour tous les plats à la fois. Un plat inexploitable
 * est rendu `FAILED` sans écarter les autres ; seule une réponse illisible en entier lève une exception.
 */
export async function analyze({ texts, apiKey, model, signal, onStage, checkpoint }: AnalyzeRequest): Promise<DishResult[]> {
  const results: DishResult[] = texts.map((text) => ({ status: 'FAILED', text, code: 'NO_FOOD' }));
  // Les descriptions vides ne sont pas envoyées ; `sent` garde le rang d'origine de chacune des autres.
  const sent = texts.map((text, index) => ({ text, index })).filter(({ text }) => text.trim().length > 0);
  if (sent.length === 0) return results;
  if (!apiKey) throw new AiError('NO_KEY');

  let decomposed = checkpoint?.decomposed;
  if (!decomposed) {
    onStage?.('DECOMPOSE');
    const prompt = buildDecomposePrompt(sent.map(({ text }) => text));
    decomposed = parseDecomposition(await chat({ apiKey, model, prompt, trace: 'Plat décrit', signal }), sent.length);
  }

  const dishes: ChoiceDish[] = [];
  decomposed.forEach((dish, position) => {
    const { text, index } = sent[position];
    if (dish.status === 'FAILED') {
      results[index] = { status: 'FAILED', text, code: dish.code };
      return;
    }
    const lines = expandComposites(dish.items);
    if (lines.length === 0) results[index] = { status: 'FAILED', text, code: 'NO_FOOD' };
    else dishes.push({ dish: position + 1, name: dish.name, lines });
  });
  if (dishes.length === 0) return results;

  let candidates = checkpoint?.candidates;
  if (!candidates) {
    onStage?.('SEARCH');
    const queries = distinctQueries(dishes);
    candidates = toCandidateMap(queries, await searchFoods(queries, CANDIDATE_COUNT));
    signal?.throwIfAborted();
  }

  let choices = new Map<number, DishChoices>();
  if ([...candidates.values()].some((found) => found.length > 0)) {
    onStage?.('CHOOSE');
    try {
      const prompt = buildChoicePrompt(dishes, candidates);
      choices = parseChoices(await chat({ apiKey, model, prompt, trace: 'Plat décrit', signal }));
    } catch (error) {
      if (error instanceof AiError) throw new ChoiceStepError(error.code, { texts, decomposed, candidates });
      throw error;
    }
  }

  for (const dish of dishes) {
    const { text, index } = sent[dish.dish - 1];
    const chosen = choices.get(dish.dish);
    const lines = applyChoices(dish, candidates, chosen);
    results[index] = userQuantitiesIntact(dish.lines, lines)
      ? { status: 'OK', text, name: chosen?.name || dish.name || text.trim(), lines: mergeSameIngredient(lines) }
      : { status: 'FAILED', text, code: 'INVALID_RESPONSE' };
  }
  return results;
}
