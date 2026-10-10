import { addMissingCiqual, getByIds } from '../../db/repositories/ingredientRepository';
import type { Ingredient } from '../../db/schema';
import type {
  EmbeddingCandidate,
  EmbeddingErrorCode,
  EmbeddingProgress,
  EmbeddingRequest,
  EmbeddingResponseMessage,
  EmbeddingStatus,
} from './types';

export class EmbeddingError extends Error {
  code: EmbeddingErrorCode;

  constructor(code: EmbeddingErrorCode) {
    super(code);
    this.code = code;
  }
}

const ERROR_MESSAGES: Record<EmbeddingErrorCode, string> = {
  OFFLINE: 'Le téléchargement nécessite une connexion. Vérifie le réseau puis réessaie.',
  QUOTA: "Il n'y a pas assez de place sur cet appareil : la recherche intelligente demande environ 120 Mo libres.",
  UNSUPPORTED: "La recherche intelligente n'est pas disponible sur cet appareil.",
  INTERRUPTED: 'Le téléchargement a été interrompu. Réessaie : les fichiers déjà reçus ne seront pas retéléchargés.',
};

export function embeddingErrorMessage(code: EmbeddingErrorCode): string {
  return ERROR_MESSAGES[code];
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (error: EmbeddingError) => void;
  onProgress?: (progress: EmbeddingProgress) => void;
}

let worker: Worker | null = null;
let consumers = 0;
let nextRequestId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../../workers/embedding.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }: MessageEvent<EmbeddingResponseMessage>) => {
    const request = pending.get(data.requestId);
    if (!request) return;
    if (data.type === 'progress') {
      request.onProgress?.(data.progress);
      return;
    }
    pending.delete(data.requestId);
    if (data.type === 'error') request.reject(new EmbeddingError(data.code));
    else request.resolve(data.value);
  };
  worker.onerror = () => {
    for (const request of pending.values()) request.reject(new EmbeddingError('UNSUPPORTED'));
    pending.clear();
  };
  return worker;
}

function call<T>(request: EmbeddingRequest, onProgress?: (progress: EmbeddingProgress) => void): Promise<T> {
  const requestId = nextRequestId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(requestId, { resolve: resolve as (value: unknown) => void, reject, onProgress });
    getWorker().postMessage({ ...request, requestId });
  });
}

/**
 * Déclare un écran consommateur et rend la fonction qui le retire. Le worker garde le modèle
 * en mémoire (≈ 120 Mo) : il est arrêté dès que plus aucun écran ne s'en sert.
 */
export function acquireEmbedding(): () => void {
  consumers++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    consumers--;
    if (consumers > 0 || !worker) return;
    worker.terminate();
    worker = null;
    // Les demandes en cours n'auront pas de réponse : leurs appelants ont quitté l'écran.
    pending.clear();
  };
}

export function getEmbeddingStatus(): Promise<EmbeddingStatus> {
  return call<EmbeddingStatus>({ type: 'status' });
}

/** Télécharge au besoin les vecteurs et le modèle, puis met la base de l'appareil au niveau des vecteurs. */
export async function prepareEmbedding(onProgress?: (progress: EmbeddingProgress) => void): Promise<void> {
  const version = await call<number>({ type: 'prepare' }, onProgress);
  await addMissingCiqual(version);
}

export function removeEmbedding(): Promise<void> {
  return call<void>({ type: 'remove' });
}

/**
 * Pour chaque texte, les aliments Ciqual les plus proches, du plus proche au plus éloigné.
 * Un aliment des vecteurs introuvable dans la base de l'appareil est écarté.
 */
export async function searchFoods(texts: string[], topK = 10): Promise<Ingredient[][]> {
  // La base de l'appareil doit connaître tous les aliments des vecteurs avant qu'on y cherche les candidats.
  await prepareEmbedding();
  const results = await call<EmbeddingCandidate[][]>({ type: 'search', texts, topK });
  const ids = [...new Set(results.flat().map((candidate) => candidate.id))];
  const byId = new Map((await getByIds(ids)).map((ingredient) => [ingredient.id!, ingredient]));
  return results.map((candidates) =>
    candidates.map((candidate) => byId.get(candidate.id)).filter((i): i is Ingredient => i !== undefined),
  );
}
