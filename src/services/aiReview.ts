import type { MealSlot, UserProfile } from '../db/schema';
import { getByIds as getRecipesByIds, getIngredientsForRecipes } from '../db/repositories/recipeRepository';
import { getByIds as getIngredientsByIds } from '../db/repositories/ingredientRepository';
import { mealTypeLabel, mealTypeOrder } from '../utils/mealTypes';
import { AiError, chat, extractJsonObject, type AiErrorCode } from './aiClient';

export const DEFAULT_AI_MODEL = 'gpt-4o-mini';

/** Sélection courte de la documentation 1min.AI ; le modèle est envoyé tel quel. */
export const AI_MODELS: { id: string; label: string }[] = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (rapide)' },
  { id: 'gpt-5-mini', label: 'GPT-5 Mini' },
  { id: 'gpt-5', label: 'GPT-5' },
  { id: 'us.anthropic.claude-haiku-4-5-20251001-v1:0', label: 'Claude 4.5 Haiku' },
  { id: 'us.anthropic.claude-sonnet-5', label: 'Claude 5 Sonnet' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'mistral-medium-latest', label: 'Mistral Medium' },
];

// Anciens noms, gardés pour les écrans qui les importent d'ici.
export { AiError as AiReviewError, type AiErrorCode as AiReviewErrorCode };

const ERROR_MESSAGES: Record<AiErrorCode, string> = {
  NO_KEY: "Aucune clé d'accès n'est enregistrée. Saisis ta clé 1min.AI dans les Réglages pour demander l'avis de l'IA.",
  UNAUTHORIZED: "Le service a refusé la clé d'accès. Vérifie-la dans les Réglages.",
  RATE_LIMITED: 'Trop de demandes ont été envoyées. Réessaie dans quelques minutes.',
  NETWORK: "L'avis de l'IA nécessite une connexion, et le service n'a pas répondu. Vérifie le réseau puis réessaie.",
  INVALID_RESPONSE: "La réponse de l'IA n'a pas pu être lue. Rien n'a été modifié ; réessaie.",
};

export function aiErrorMessage(code: AiErrorCode): string {
  return ERROR_MESSAGES[code];
}

/** Vrai quand l'échec se règle dans les Réglages. */
export function aiErrorNeedsSettings(code: AiErrorCode): boolean {
  return code === 'NO_KEY' || code === 'UNAUTHORIZED';
}

export interface ReviewMeal {
  mealType: MealSlot['mealType'];
  name: string;
  calories: number;
  isDeviation: boolean;
  /** Composition d'un plat maison : c'est elle qui dit l'équilibre, pas le nom du plat. */
  ingredients?: { name: string; quantityG: number }[];
}

export interface ReviewDay {
  date: string;
  meals: ReviewMeal[];
}

export interface ReviewGoal {
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goal: UserProfile['goal'];
}

export interface DayReview {
  date: string;
  score: number;
  comment: string;
}

export interface ReviewResult {
  days: DayReview[];
  summary?: string;
}

function sortedSlots(slots: MealSlot[]): MealSlot[] {
  return [...slots].sort(
    (a, b) => mealTypeOrder(a.mealType) - mealTypeOrder(b.mealType) || (a.id ?? '').localeCompare(b.id ?? ''),
  );
}

/**
 * Empreinte du contenu d'une journée. Enregistrée avec l'avis : si elle ne correspond plus,
 * la journée a changé depuis et l'avis est dépassé. Comparer à la lecture plutôt que marquer
 * à chaque écriture, pour ne dépendre d'aucun des chemins qui modifient un repas.
 */
export function daySignature(slots: MealSlot[]): string {
  return sortedSlots(slots)
    .map((s) => [s.mealType, s.freeLabel ?? '', s.caloriesOverride ?? 0, s.isDeviation ? 1 : 0, s.recipeId ?? ''].join('|'))
    .join('\n');
}

/** Charge la composition des plats maison pour les journées à transmettre. */
export async function loadReviewDays(days: { date: string; slots: MealSlot[] }[]): Promise<ReviewDay[]> {
  const recipeIds = [...new Set(days.flatMap((d) => d.slots.flatMap((s) => (s.recipeId ? [s.recipeId] : []))))];
  const recipes = await getRecipesByIds(recipeIds);
  const homeRecipeIds = recipes.filter((r) => r.kind === 'RECIPE').map((r) => r.id!);
  const lines = await getIngredientsForRecipes(homeRecipeIds);
  const ingredients = await getIngredientsByIds([...new Set(lines.map((l) => l.ingredientId))]);
  const nameById = new Map(ingredients.map((i) => [i.id!, i.name]));

  return days.map(({ date, slots }) => ({
    date,
    meals: sortedSlots(slots).map((slot) => {
      const composition = lines
        .filter((l) => l.recipeId === slot.recipeId)
        .flatMap((l) => {
          const name = nameById.get(l.ingredientId);
          return name ? [{ name, quantityG: Math.round(l.quantityG) }] : [];
        });
      return {
        mealType: slot.mealType,
        name: slot.freeLabel ?? '',
        calories: slot.caloriesOverride ?? 0,
        isDeviation: slot.isDeviation,
        ...(composition.length > 0 && { ingredients: composition }),
      };
    }),
  }));
}

const GOAL_LABELS: Record<UserProfile['goal'], string> = {
  LOSE: 'perte de poids',
  MAINTAIN: 'maintien du poids',
  GAIN: 'prise de poids',
};

/**
 * Consigne et données d'une demande. Ne contient ni prénom, ni date de naissance, ni sexe,
 * ni poids, ni taille : l'objectif calorique en est déjà le résumé utile.
 */
export function buildPrompt(days: ReviewDay[], goal: ReviewGoal, withSummary: boolean): string {
  const data = {
    objectif: {
      but: GOAL_LABELS[goal.goal],
      calories_par_jour: goal.targetCalories,
      proteines_g: goal.proteinG,
      glucides_g: goal.carbsG,
      lipides_g: goal.fatG,
    },
    jours: days.map((day) => ({
      date: day.date,
      repas: day.meals.map((meal) => ({
        creneau: mealTypeLabel(meal.mealType),
        nom: meal.name,
        kcal: meal.calories,
        ...(meal.isDeviation && { ecart: true }),
        ...(meal.ingredients && { ingredients: meal.ingredients.map((i) => `${i.name} — ${i.quantityG} g`) }),
      })),
    })),
  };

  const format = withSummary
    ? '{"days":[{"date":"AAAA-MM-JJ","score":7,"comment":"…"}],"summary":"…"}'
    : '{"days":[{"date":"AAAA-MM-JJ","score":7,"comment":"…"}]}';

  return [
    'Tu es une nutritionniste diplômée. Tu évalues les repas planifiés par une personne, au regard de son objectif.',
    'Pour chaque jour fourni, donne une note entière de 0 (très déséquilibré) à 10 (excellent) et un commentaire de 2 à 4 phrases, en français, en tutoyant la personne : ce qui va, ce qui manque ou est en excès, un conseil concret.',
    'Un repas marqué "ecart" est un écart assumé (restaurant, fête) : tiens-en compte sans le sermonner.',
    withSummary
      ? 'Ajoute dans "summary" un bilan de la semaine de 3 à 5 phrases : tendance générale, points forts, priorité à corriger.'
      : 'Ne donne pas de bilan global.',
    `Réponds uniquement par un objet JSON de cette forme exacte, sans texte avant ni après, sans balise de code : ${format}`,
    'Il doit y avoir exactement une entrée par jour fourni, avec la même date.',
    '',
    'Données :',
    JSON.stringify(data),
  ].join('\n');
}

/**
 * Lit la réponse de l'IA. Tout ou rien : une seule anomalie rejette l'ensemble,
 * pour ne jamais enregistrer une semaine notée à moitié.
 */
export function parseReview(text: string, dates: string[], withSummary: boolean): ReviewResult {
  const root = extractJsonObject(text) as { days?: unknown; summary?: unknown };
  if (!Array.isArray(root.days)) throw new AiError('INVALID_RESPONSE');

  const days = dates.map((date) => {
    const matches = (root.days as { date?: unknown; score?: unknown; comment?: unknown }[]).filter((d) => d?.date === date);
    const entry = matches[0];
    const isValid =
      matches.length === 1 &&
      typeof entry.score === 'number' &&
      Number.isInteger(entry.score) &&
      entry.score >= 0 &&
      entry.score <= 10 &&
      typeof entry.comment === 'string' &&
      entry.comment.trim().length > 0;
    if (!isValid) throw new AiError('INVALID_RESPONSE');
    return { date, score: entry.score as number, comment: (entry.comment as string).trim() };
  });

  if (!withSummary) return { days };
  if (typeof root.summary !== 'string' || root.summary.trim().length === 0) throw new AiError('INVALID_RESPONSE');
  return { days, summary: root.summary.trim() };
}

export interface ReviewRequest {
  apiKey: string;
  model: string;
  days: ReviewDay[];
  goal: ReviewGoal;
  withSummary: boolean;
}

/** Envoie les journées à 1min.AI et rend les avis. Seul appel réseau de cette fonction, sur demande explicite. */
export async function requestReview({ apiKey, model, days, goal, withSummary }: ReviewRequest): Promise<ReviewResult> {
  const text = await chat({ apiKey, model, prompt: buildPrompt(days, goal, withSummary), trace: 'Avis IA' });

  return parseReview(
    text,
    days.map((d) => d.date),
    withSummary,
  );
}
