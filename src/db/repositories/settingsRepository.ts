import { db } from '../schema';
import { DEFAULT_AI_MODEL } from '../../services/aiReview';

const AI_API_KEY = 'aiApiKey';
const AI_MODEL = 'aiModel';
const FOOD_PREFERENCES = 'foodPreferences';

/** Longueur maximale des préférences culinaires, saisie comme transmise à l'IA. */
export const FOOD_PREFERENCES_MAX_LENGTH = 1000;

/** Clés de `appMeta` qui ne doivent jamais sortir de l'appareil, sauvegardes comprises. */
export const SECRET_META_KEYS: string[] = [AI_API_KEY];

export interface AiSettings {
  /** Absente tant que l'utilisateur ne l'a pas saisie. Jamais dans le code ni dans le bundle. */
  apiKey?: string;
  model: string;
}

export async function getAiSettings(): Promise<AiSettings> {
  const [apiKey, model] = await db.appMeta.bulkGet([AI_API_KEY, AI_MODEL]);
  return { apiKey: apiKey?.value || undefined, model: model?.value || DEFAULT_AI_MODEL };
}

/** Une clé non fournie laisse en place celle qui est enregistrée. */
export async function saveAiSettings({ apiKey, model }: { apiKey?: string; model: string }): Promise<void> {
  await db.transaction('rw', db.appMeta, async () => {
    await db.appMeta.put({ key: AI_MODEL, value: model });
    if (apiKey) await db.appMeta.put({ key: AI_API_KEY, value: apiKey });
  });
}

export async function clearAiApiKey(): Promise<void> {
  await db.appMeta.delete(AI_API_KEY);
}

/**
 * Préférences culinaires en texte libre, jointes aux consignes du remplissage de la semaine.
 * Ce n'est pas un secret : elles suivent les sauvegardes. Chaîne vide si rien n'est saisi.
 */
export async function getFoodPreferences(): Promise<string> {
  return (await db.appMeta.get(FOOD_PREFERENCES))?.value ?? '';
}

/** Un texte vide efface la préférence plutôt que d'enregistrer une chaîne vide. */
export async function saveFoodPreferences(text: string): Promise<void> {
  const value = text.trim().slice(0, FOOD_PREFERENCES_MAX_LENGTH);
  if (value) await db.appMeta.put({ key: FOOD_PREFERENCES, value });
  else await db.appMeta.delete(FOOD_PREFERENCES);
}
