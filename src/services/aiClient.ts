const CHAT_URL = 'https://api.1min.ai/api/chat-with-ai';

export type AiErrorCode = 'NO_KEY' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'NETWORK' | 'INVALID_RESPONSE';

export class AiError extends Error {
  code: AiErrorCode;

  constructor(code: AiErrorCode) {
    super(code);
    this.code = code;
  }
}

export interface ChatRequest {
  apiKey: string;
  model: string;
  prompt: string;
  /** Préfixe des traces de console, pour distinguer les fonctions qui parlent à l'IA. */
  trace: string;
  signal?: AbortSignal;
}

/**
 * Envoie un message à 1min.AI et rend le texte de la réponse. Une seule requête, sans diffusion.
 * Une annulation par `signal` remonte telle quelle (AbortError), sans être prise pour une panne de réseau.
 */
export async function chat({ apiKey, model, prompt, trace, signal }: ChatRequest): Promise<string> {
  // Trace de mise au point : le message exact envoyé, pour le relire et l'améliorer. Jamais la clé.
  console.log(`[${trace}] Message envoyé (modèle ${model}) :
${prompt}`);

  let res: Response;
  try {
    res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'API-KEY': apiKey },
      body: JSON.stringify({
        type: 'UNIFY_CHAT_WITH_AI',
        model,
        promptObject: { prompt },
      }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AiError('NETWORK');
  }

  if (res.status === 401) throw new AiError('UNAUTHORIZED');
  if (res.status === 429) throw new AiError('RATE_LIMITED');
  if (!res.ok) throw new AiError('NETWORK');

  let text: string;
  try {
    const body = (await res.json()) as { aiRecord?: { aiRecordDetail?: { resultObject?: string[] | string } } };
    const result = body.aiRecord?.aiRecordDetail?.resultObject;
    text = Array.isArray(result) ? result.join('') : (result ?? '');
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AiError('INVALID_RESPONSE');
  }

  console.log(`[${trace}] Réponse reçue :
${text}`);

  return text;
}

/** Le premier objet JSON d'une réponse, que l'IA entoure parfois de texte ou d'un bloc de code. */
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AiError('INVALID_RESPONSE');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AiError('INVALID_RESPONSE');
  }
}
