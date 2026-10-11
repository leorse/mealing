import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MealSlot } from '../db/schema';
import { addGeneratedMeals, type GeneratedDish } from '../db/repositories/planningRepository';
import { getFoodPreferences, FOOD_PREFERENCES_MAX_LENGTH } from '../db/repositories/settingsRepository';
import { AiError, chat, extractJsonObject, type AiErrorCode } from './aiClient';
import type { ReviewGoal } from './aiReview';
import { analyze, type AnalysisCheckpoint, type AnalysisStage } from './dishFromText';
import { computeRecipeNutrition, isHealthyFromItems } from './nutrition';
import { fromIsoDate } from '../utils/date';
import { mealTypeLabel, mealTypeOrder } from '../utils/mealTypes';

// Remplissage de la semaine par l'IA : une demande de propositions, puis l'analyse par lot
// de dishFromText, puis une écriture groupée au planning.

/** Repas que l'IA peut remplir. La collation n'en fait pas partie. */
export const FILL_MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;
export type FillMealType = (typeof FILL_MEAL_TYPES)[number];

/** Plats analysés ensemble au plus ; au-delà, la création enchaîne plusieurs analyses. */
export const MAX_DISHES_PER_ANALYSIS = 21;

export type FillStage = 'PROPOSE' | AnalysisStage | 'WRITE';

export interface FillSlot {
  date: string;
  mealType: FillMealType;
}

export interface Proposal {
  slot: FillSlot;
  name: string;
  /** Composition pour une personne, avec quantités : c'est le texte analysé à la création. */
  description: string;
}

/** Ce qu'une journée porte déjà, pour que l'IA ne la surcharge pas. */
export interface WeekDayContext {
  date: string;
  meals: { mealType: MealSlot['mealType']; name: string; calories: number; isDeviation: boolean }[];
  /** Créneaux vides que l'utilisateur a écartés : il les gère lui-même. */
  skipped: FillMealType[];
}

export function slotKey(slot: FillSlot): string {
  return `${slot.date}|${slot.mealType}`;
}

/** Ordre de la semaine : jours, puis repas dans l'ordre de la journée. */
export function compareSlots(a: FillSlot, b: FillSlot): number {
  return a.date.localeCompare(b.date) || mealTypeOrder(a.mealType) - mealTypeOrder(b.mealType);
}

function dayName(date: string): string {
  return format(fromIsoDate(date), 'EEEE', { locale: fr });
}

/** « Déjeuner du mardi 6 » : libellé d'un créneau pour l'écran et les lecteurs d'écran. */
export function slotLabel(slot: FillSlot): string {
  return `${mealTypeLabel(slot.mealType)} du ${format(fromIsoDate(slot.date), 'EEEE d', { locale: fr })}`;
}

/** La semaine telle que l'IA doit la voir : tous les repas déjà prévus, jour par jour, et les créneaux écartés. */
export function buildWeekContext(dates: string[], slots: MealSlot[], retained: FillSlot[]): WeekDayContext[] {
  const retainedKeys = new Set(retained.map(slotKey));
  return dates.map((date) => {
    const daySlots = slots.filter((s) => s.slotDate === date).sort((a, b) => mealTypeOrder(a.mealType) - mealTypeOrder(b.mealType));
    return {
      date,
      meals: daySlots.map((s) => ({
        mealType: s.mealType,
        name: s.freeLabel ?? '',
        calories: s.caloriesOverride ?? 0,
        isDeviation: s.isDeviation,
      })),
      skipped: FILL_MEAL_TYPES.filter(
        (type) => !daySlots.some((s) => s.mealType === type) && !retainedKeys.has(slotKey({ date, mealType: type })),
      ),
    };
  });
}

const GOAL_LABELS: Record<ReviewGoal['goal'], string> = {
  LOSE: 'perte de poids',
  MAINTAIN: 'maintien du poids',
  GAIN: 'prise de poids',
};

function describeDay(day: WeekDayContext): string {
  const total = day.meals.reduce((sum, meal) => sum + meal.calories, 0);
  const meals = day.meals.map(
    (meal) => `${mealTypeLabel(meal.mealType).toLowerCase()} « ${meal.name} » ${meal.calories} kcal${meal.isDeviation ? ' (écart)' : ''}`,
  );
  const skipped = day.skipped.map((type) => `${mealTypeLabel(type).toLowerCase()} pris par l'utilisateur sans proposition, contenu inconnu`);
  const content = [...meals, ...skipped];
  return `- ${dayName(day.date)} : ${content.length > 0 ? content.join(' ; ') : 'rien de prévu'}${total > 0 ? ` (déjà prévu : ${total} kcal)` : ''}`;
}

const FILL_EXAMPLE = `{ "meals": [ { "slot": 1, "name": "Poulet, riz et courgettes", "description": "150 g de riz basmati cuit, 120 g de blanc de poulet grillé, 100 g de courgettes sautées, une cuillère à soupe d'huile d'olive" } ] }`;

/**
 * Demande de propositions : un plat par créneau retenu. Transmet l'objectif, la semaine complète
 * et les préférences ; jamais l'identité, le poids ni la taille, ni les dates.
 */
export function buildFillPrompt({
  slots,
  week,
  goal,
  preferences,
}: {
  slots: FillSlot[];
  week: WeekDayContext[];
  goal: ReviewGoal;
  preferences: string;
}): string {
  const trimmed = preferences.trim().slice(0, FOOD_PREFERENCES_MAX_LENGTH);
  return [
    'Tu es diététicien. Propose un plat pour chacun des repas listés plus bas, pour une personne.',
    '',
    `Objectif quotidien : ${goal.targetCalories} kcal, dont ${goal.proteinG} g de protéines, ${goal.carbsG} g de glucides et ${goal.fatG} g de lipides ; objectif de poids : ${GOAL_LABELS[goal.goal]}.`,
    '',
    'La semaine, avec les repas déjà prévus. Tiens-en compte pour ne surcharger ni une journée ni la semaine : les plats proposés complètent chaque journée vers son objectif. Un repas pris sans proposition est un repas réel dont tu ne connais pas le contenu : garde-lui de la marge.',
    ...week.map(describeDay),
    '',
    ...(trimmed ? ["Préférences de l'utilisateur, à respecter strictement :", `« ${trimmed} »`, ''] : []),
    'Règles :',
    '- Un plat par repas listé, adapté au moment de la journée (un petit-déjeuner n\'est pas un dîner).',
    "- Des plats variés d'un repas à l'autre et d'un jour à l'autre, réalistes à cuisiner chez soi.",
    '- "name" : un nom court de plat.',
    '- "description" : une phrase qui liste tous les ingrédients, chacun avec sa quantité pour une personne (en grammes, ou en unités : « 2 œufs », « une cuillère à soupe d\'huile »).',
    '- Aucune valeur nutritionnelle : ni calories, ni protéines, ni glucides, ni lipides.',
    '',
    'Réponds uniquement par un objet JSON de cette forme, sans texte autour, avec un élément par repas, numéroté comme ci-dessous :',
    FILL_EXAMPLE,
    '',
    'Repas à proposer :',
    ...slots.map((slot, index) => `${index + 1}. ${dayName(slot.date)} — ${mealTypeLabel(slot.mealType).toLowerCase()}`),
  ].join('\n');
}

export interface ParsedProposals {
  proposals: Proposal[];
  /** Créneaux demandés restés sans proposition exploitable. */
  missing: FillSlot[];
}

/**
 * Lit les propositions. Enveloppe illisible ou aucune proposition valide : exception.
 * Un créneau absent, cité deux fois ou incomplet reste sans proposition ; un numéro inconnu est ignoré.
 */
export function parseProposals(text: string, slots: FillSlot[]): ParsedProposals {
  const root = extractJsonObject(text) as { meals?: unknown };
  if (!Array.isArray(root.meals)) throw new AiError('INVALID_RESPONSE');
  const meals = root.meals as ({ slot?: unknown; name?: unknown; description?: unknown } | null)[];

  const proposals: Proposal[] = [];
  const missing: FillSlot[] = [];
  slots.forEach((slot, index) => {
    const matches = meals.filter((m) => m?.slot === index + 1);
    const entry = matches.length === 1 ? matches[0] : null;
    const name = typeof entry?.name === 'string' ? entry.name.trim() : '';
    const description = typeof entry?.description === 'string' ? entry.description.trim() : '';
    if (name && description) proposals.push({ slot, name, description });
    else missing.push(slot);
  });
  if (proposals.length === 0) throw new AiError('INVALID_RESPONSE');
  return { proposals, missing };
}

export interface ProposalRequest {
  apiKey?: string;
  model: string;
  slots: FillSlot[];
  week: WeekDayContext[];
  goal: ReviewGoal;
  signal?: AbortSignal;
}

/** Envoie la demande de propositions. Les préférences sont lues maintenant : une modification récente compte. */
export async function requestProposals({ apiKey, model, slots, week, goal, signal }: ProposalRequest): Promise<ParsedProposals> {
  if (!apiKey) throw new AiError('NO_KEY');
  const preferences = await getFoodPreferences();
  const prompt = buildFillPrompt({ slots, week, goal, preferences });
  return parseProposals(await chat({ apiKey, model, prompt, trace: 'Remplissage', signal }), slots);
}

function normalized(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface GenerateRequest {
  weekStart: string;
  proposals: Proposal[];
  apiKey?: string;
  model: string;
  signal?: AbortSignal;
  onStage?: (stage: FillStage) => void;
  /** Décomposition et candidats d'une tentative dont seul le tri a échoué. */
  checkpoint?: AnalysisCheckpoint;
}

export interface GenerateResult {
  createdDishes: number;
  /** Propositions restées sans plat : analyse en échec ou aucun ingrédient retenu. */
  failed: Proposal[];
}

/**
 * Transforme les propositions en plats chiffrés et les place au planning. Deux propositions de même nom
 * et de même description donnent un seul plat, placé dans leurs deux créneaux. Rien n'est écrit tant que
 * toutes les analyses ne sont pas terminées ; l'écriture est une seule transaction.
 */
export async function generate({ weekStart, proposals, apiKey, model, signal, onStage, checkpoint }: GenerateRequest): Promise<GenerateResult> {
  if (!apiKey) throw new AiError('NO_KEY');

  const groups = new Map<string, Proposal[]>();
  for (const proposal of proposals) {
    const key = `${normalized(proposal.name)}|${normalized(proposal.description)}`;
    groups.set(key, [...(groups.get(key) ?? []), proposal]);
  }
  const distinct = [...groups.values()];

  const dishes: GeneratedDish[] = [];
  const failed: Proposal[] = [];
  for (let start = 0; start < distinct.length; start += MAX_DISHES_PER_ANALYSIS) {
    const chunk = distinct.slice(start, start + MAX_DISHES_PER_ANALYSIS);
    const texts = chunk.map((group) => group[0].description);
    const reusable = checkpoint && checkpoint.texts.join('\n') === texts.join('\n') ? checkpoint : undefined;
    const results = await analyze({ texts, apiKey, model, signal, onStage, checkpoint: reusable });

    results.forEach((result, index) => {
      const group = chunk[index];
      const lines = result.status === 'OK' ? result.lines.filter((line) => line.ingredient !== null) : [];
      if (lines.length === 0) {
        failed.push(...group);
        return;
      }
      const items = lines.map((line) => ({ ingredient: line.ingredient!, quantityG: line.quantityG }));
      dishes.push({
        recipe: {
          name: group[0].name,
          servings: 1,
          kind: 'RECIPE',
          difficulty: 'EASY',
          isHealthy: isHealthyFromItems(items, 1),
          sourceText: group[0].description,
        },
        // Les quantités viennent de l'IA, même quand la description les chiffre : elles restent estimées.
        ingredients: lines.map((line) => ({
          ingredientId: line.ingredient!.id!,
          quantityG: line.quantityG,
          unitCount: line.unitCount,
          isEstimated: true,
        })),
        calories: Math.round(computeRecipeNutrition(items).calories),
        slots: group.map((proposal) => ({ slotDate: proposal.slot.date, mealType: proposal.slot.mealType })),
      });
    });
  }

  signal?.throwIfAborted();
  if (dishes.length > 0) {
    onStage?.('WRITE');
    await addGeneratedMeals(weekStart, dishes);
  }
  return { createdDishes: dishes.length, failed };
}

const ERROR_MESSAGES: Record<AiErrorCode, string> = {
  NO_KEY: "Aucune clé d'accès n'est enregistrée. Saisis ta clé 1min.AI dans les Réglages pour que l'IA remplisse ta semaine.",
  UNAUTHORIZED: "Le service a refusé la clé d'accès. Vérifie-la dans les Réglages.",
  RATE_LIMITED: 'Trop de demandes ont été envoyées. Réessaie dans quelques minutes.',
  NETWORK: "Le remplissage nécessite une connexion, et le service n'a pas répondu. Vérifie le réseau puis réessaie.",
  INVALID_RESPONSE: "La réponse de l'IA n'a pas pu être lue. Rien n'a été modifié ; réessaie.",
};

export function fillErrorMessage(code: AiErrorCode): string {
  return ERROR_MESSAGES[code];
}
