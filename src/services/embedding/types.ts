/** Manifeste des vecteurs Ciqual, produit par scripts/embed-ciqual.mjs. */
export interface EmbeddingManifest {
  version: number;
  sourceHash: string;
  model: string;
  dtype: string;
  prefix: string;
  pooling: string;
  dim: number;
  count: number;
  /** Identifiants d'aliments, dans l'ordre exact des vecteurs. */
  ids: string[];
}

export type EmbeddingErrorCode = 'OFFLINE' | 'QUOTA' | 'UNSUPPORTED' | 'INTERRUPTED';

/** `VECTORS` et `MODEL` téléchargent ; `LOADING` charge le modèle en mémoire, sans octets à compter. */
export type EmbeddingStage = 'VECTORS' | 'MODEL' | 'LOADING';

export interface EmbeddingProgress {
  stage: EmbeddingStage;
  loadedBytes: number;
  totalBytes: number;
}

export interface EmbeddingStatus {
  isModelCached: boolean;
  sizeBytes: number;
}

export interface EmbeddingCandidate {
  id: string;
  /** Proximité avec la requête, proche du cosinus : 1 = identique. */
  score: number;
}

export type EmbeddingRequest =
  | { type: 'status' }
  | { type: 'prepare' }
  | { type: 'search'; texts: string[]; topK: number }
  | { type: 'remove' };

export type EmbeddingRequestMessage = EmbeddingRequest & { requestId: number };

export type EmbeddingResponseMessage =
  | { requestId: number; type: 'progress'; progress: EmbeddingProgress }
  | { requestId: number; type: 'result'; value: unknown }
  | { requestId: number; type: 'error'; code: EmbeddingErrorCode; detail: string };

/** Taille annoncée avant le téléchargement ; la progression affiche ensuite les octets réels. */
export const MODEL_APPROX_BYTES = 120 * 1024 * 1024;
